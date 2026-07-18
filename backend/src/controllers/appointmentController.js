const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const {
  sendAppointmentConfirmationEmail,
  sendAppointmentStatusEmail,
  sendNewAppointmentOwnerEmail,
} = require('../services/emailService');
const User = require('../models/User');

/**
 * Format a Date object to a human-readable string: "Monday, January 15, 2025"
 * Using native Intl.DateTimeFormat to avoid adding date-fns as a backend dependency.
 */
const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(
    new Date(date)
  );

/**
 * Helper: Create an in-app notification record.
 * Kept private to this module – not exported.
 */
const createNotification = async (userId, type, title, message, link = '') => {
  await Notification.create({ user: userId, type, title, message, link });
};

// @desc  Book an appointment
// @route POST /api/appointments
// @access Private (customer only)
exports.bookAppointment = async (req, res) => {
  const { businessId, serviceId, date, timeSlot, notes } = req.body;

  // Validate business exists and is active
  const business = await Business.findById(businessId).populate('owner', 'name email');
  if (!business || !business.isApproved) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  // Validate service belongs to this business
  const service = await Service.findById(serviceId);
  if (!service || service.business.toString() !== businessId) {
    return res.status(404).json({ success: false, message: 'Service not found.' });
  }

  // Validate appointment date is in the future
  const appointmentDate = new Date(date);
  if (appointmentDate < new Date()) {
    return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past.' });
  }

  // Check if this date is blocked by the business
  const isBlocked = business.blockedDates.some(
    (d) => new Date(d).toDateString() === appointmentDate.toDateString()
  );
  if (isBlocked) {
    return res.status(400).json({ success: false, message: 'This date is blocked by the business.' });
  }

  // Check for double-booking: same business + same day + same time slot (non-cancelled)
  const existing = await Appointment.findOne({
    business: businessId,
    date: appointmentDate,
    'timeSlot.start': timeSlot.start,
    status: { $nin: ['cancelled'] },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
  }

  // Create the appointment
  const appointment = await Appointment.create({
    customer: req.user._id,
    business: businessId,
    service: serviceId,
    date: appointmentDate,
    timeSlot,
    notes: notes || '',
    totalAmount: service.price,
  });

  // Populate for response and emails
  await appointment.populate([
    { path: 'business', select: 'name email owner' },
    { path: 'service', select: 'name price duration' },
    { path: 'customer', select: 'name email' },
  ]);

  const formattedDate = formatDate(appointmentDate);

  // In-app notifications (non-blocking)
  await Promise.allSettled([
    createNotification(
      req.user._id,
      'appointment_booked',
      'Appointment Booked',
      `Your appointment at ${business.name} has been booked for ${formattedDate}.`,
      '/dashboard/customer'
    ),
    createNotification(
      business.owner._id,
      'new_appointment',
      'New Appointment Request',
      `${req.user.name} booked ${service.name} on ${formattedDate}.`,
      '/dashboard/business'
    ),
  ]);

  // Emails (non-blocking – failures are logged but don't break the response)
  await Promise.allSettled([
    // Customer gets a booking confirmation
    sendAppointmentConfirmationEmail({
      to: req.user.email,
      customerName: req.user.name,
      businessName: business.name,
      serviceName: service.name,
      date: formattedDate,
      timeSlot,
      amount: service.price,
    }),
    // Business owner gets a new booking alert
    sendNewAppointmentOwnerEmail({
      to: business.owner.email,
      ownerName: business.owner.name,
      customerName: req.user.name,
      serviceName: service.name,
      date: formattedDate,
      timeSlot,
    }),
  ]);

  res.status(201).json({ success: true, data: appointment });
};

// @desc  Get appointments (filtered by requester's role)
// @route GET /api/appointments
// @access Private
exports.getAppointments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === 'customer') {
    // Customers see their own appointments
    query.customer = req.user._id;
  } else if (req.user.role === 'business_owner') {
    // Business owners see appointments for their business
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) return res.json({ success: true, data: [], pagination: {} });
    query.business = business._id;
  }

  // Optional status filter (supports comma-separated values e.g. "pending,confirmed")
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    query.status = { $in: statuses };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('customer', 'name email avatar phone')
      .populate('business', 'name images.logo address')
      .populate('service', 'name price duration')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: appointments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

// @desc  Get a single appointment
// @route GET /api/appointments/:id
// @access Private
exports.getAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('customer', 'name email avatar phone')
    .populate('business', 'name images phone email')
    .populate('service', 'name price duration');

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  // Authorization: only the customer or the business owner may view this appointment
  const isCustomer = appointment.customer._id.toString() === req.user._id.toString();
  const ownerBusiness = await Business.findOne({ owner: req.user._id });
  const isBusinessOwner =
    ownerBusiness && ownerBusiness._id.toString() === appointment.business._id.toString();

  if (!isCustomer && !isBusinessOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this appointment.' });
  }

  res.json({ success: true, data: appointment });
};

// @desc  Update appointment status (confirm / complete / cancel)
// @route PUT /api/appointments/:id/status
// @access Private
exports.updateStatus = async (req, res) => {
  const { status, cancellationReason } = req.body;
  const VALID_STATUSES = ['confirmed', 'completed', 'cancelled'];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const appointment = await Appointment.findById(req.params.id)
    .populate('customer', 'name email')
    .populate('business', 'name owner')
    .populate('service', 'name');

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  const business = await Business.findById(appointment.business._id);
  const isBusinessOwner = business && business.owner.toString() === req.user._id.toString();
  const isCustomer = appointment.customer._id.toString() === req.user._id.toString();

  // Role-based permission checks
  if (req.user.role === 'customer' && !isCustomer) {
    return res.status(403).json({ success: false, message: 'Not your appointment.' });
  }
  if (req.user.role === 'customer' && status !== 'cancelled') {
    return res.status(403).json({ success: false, message: 'Customers can only cancel appointments.' });
  }
  if (req.user.role === 'business_owner' && !isBusinessOwner) {
    return res.status(403).json({ success: false, message: 'Not your business appointment.' });
  }

  // Apply status update
  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = isCustomer ? 'customer' : 'business';
    appointment.cancellationReason = cancellationReason || '';
  }
  await appointment.save();

  // Notify the other party
  const formattedDate = formatDate(new Date(appointment.date));
  const recipientIsCustomer = !isCustomer; // if the actor is the owner, notify the customer and vice versa

  const notifyUserId = recipientIsCustomer ? appointment.customer._id : business.owner;
  const notifyMessages = {
    confirmed: `Your appointment for ${appointment.service.name} on ${formattedDate} has been confirmed!`,
    cancelled: `Appointment for ${appointment.service.name} on ${formattedDate} was cancelled.`,
    completed: `Your appointment for ${appointment.service.name} has been marked as completed. Please leave a review!`,
  };

  await Promise.allSettled([
    createNotification(
      notifyUserId,
      `appointment_${status}`,
      `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      notifyMessages[status]
    ),
    // Send email to affected party
    (async () => {
      const recipient = recipientIsCustomer
        ? { email: appointment.customer.email, name: appointment.customer.name }
        : await User.findById(business.owner).select('name email');

      if (recipient) {
        await sendAppointmentStatusEmail({
          to: recipient.email,
          recipientName: recipient.name,
          status,
          businessName: appointment.business.name,
          serviceName: appointment.service.name,
          date: formattedDate,
        });
      }
    })(),
  ]);

  res.json({ success: true, data: appointment });
};
