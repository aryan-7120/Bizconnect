const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Service = require('../models/Service');
const Notification = require('../models/Notification');
const { sendEmail } = require('../config/nodemailer');

const createNotification = async (userId, type, title, message, link = '') => {
  await Notification.create({ user: userId, type, title, message, link });
};

// @desc  Book appointment
// @route POST /api/appointments
exports.bookAppointment = async (req, res) => {
  const { businessId, serviceId, date, timeSlot, notes } = req.body;

  const business = await Business.findById(businessId).populate('owner');
  if (!business || !business.isApproved) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

  // Validate date is in the future
  const appointmentDate = new Date(date);
  if (appointmentDate < new Date()) {
    return res.status(400).json({ success: false, message: 'Cannot book in the past.' });
  }

  // Check blocked dates
  const isBlocked = business.blockedDates.some(
    (d) => new Date(d).toDateString() === appointmentDate.toDateString()
  );
  if (isBlocked) return res.status(400).json({ success: false, message: 'This date is blocked.' });

  // Check double booking
  const existing = await Appointment.findOne({
    business: businessId,
    date: appointmentDate,
    'timeSlot.start': timeSlot.start,
    status: { $nin: ['cancelled'] },
  });
  if (existing) return res.status(400).json({ success: false, message: 'This slot is already booked.' });

  const appointment = await Appointment.create({
    customer: req.user._id,
    business: businessId,
    service: serviceId,
    date: appointmentDate,
    timeSlot,
    notes: notes || '',
    totalAmount: service.price,
  });

  await appointment.populate([
    { path: 'business', select: 'name email owner' },
    { path: 'service', select: 'name price duration' },
    { path: 'customer', select: 'name email' },
  ]);

  // Notifications
  await createNotification(
    req.user._id, 'appointment_booked',
    'Appointment Booked',
    `Your appointment at ${business.name} has been booked for ${appointmentDate.toLocaleDateString()}.`,
    `/dashboard/customer`
  );
  await createNotification(
    business.owner._id, 'appointment_booked',
    'New Appointment Request',
    `${req.user.name} booked ${service.name} on ${appointmentDate.toLocaleDateString()}.`,
    `/dashboard/business`
  );

  // Email confirmation
  await sendEmail({
    to: req.user.email,
    subject: `Appointment Confirmed – ${business.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #6366f1;">Appointment Booked! 🎉</h2>
        <p>Hi ${req.user.name},</p>
        <p>Your appointment has been booked successfully.</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;font-weight:bold;">Business</td><td>${business.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Service</td><td>${service.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Date</td><td>${appointmentDate.toDateString()}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Time</td><td>${timeSlot.start} – ${timeSlot.end}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Amount</td><td>$${service.price}</td></tr>
        </table>
      </div>
    `,
  });

  res.status(201).json({ success: true, data: appointment });
};

// @desc  Get appointments (filtered by role)
// @route GET /api/appointments
exports.getAppointments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.user.role === 'business_owner') {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) return res.json({ success: true, data: [], pagination: {} });
    query.business = business._id;
  }

  if (status) query.status = status;

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
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
};

// @desc  Get single appointment
// @route GET /api/appointments/:id
exports.getAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('customer', 'name email avatar phone')
    .populate('business', 'name images phone email')
    .populate('service', 'name price duration');
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

  // Allow customer, business owner, or admin
  const isOwner = appointment.customer._id.toString() === req.user._id.toString();
  const business = await Business.findById(appointment.business._id);
  const isBusinessOwner = business && business.owner.toString() === req.user._id.toString();
  if (!isOwner && !isBusinessOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  res.json({ success: true, data: appointment });
};

// @desc  Update appointment status
// @route PUT /api/appointments/:id/status
exports.updateStatus = async (req, res) => {
  const { status, cancellationReason } = req.body;
  const appointment = await Appointment.findById(req.params.id)
    .populate('customer', 'name email')
    .populate('business', 'name owner')
    .populate('service', 'name');

  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

  const business = await Business.findById(appointment.business._id);
  const isBusinessOwner = business && business.owner.toString() === req.user._id.toString();
  const isCustomer = appointment.customer._id.toString() === req.user._id.toString();

  // Permissions
  if (req.user.role === 'customer' && status !== 'cancelled') {
    return res.status(403).json({ success: false, message: 'Customers can only cancel appointments.' });
  }
  if (req.user.role === 'business_owner' && !isBusinessOwner) {
    return res.status(403).json({ success: false, message: 'Not your business.' });
  }

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = req.user.role === 'customer' ? 'customer' : 'business';
    appointment.cancellationReason = cancellationReason || '';
  }
  await appointment.save();

  // Notify
  const recipientId = isCustomer ? business.owner : appointment.customer._id;
  const messages = {
    confirmed: `Your appointment for ${appointment.service.name} on ${new Date(appointment.date).toDateString()} has been confirmed!`,
    cancelled: `Appointment for ${appointment.service.name} on ${new Date(appointment.date).toDateString()} was cancelled.`,
    completed: `Your appointment for ${appointment.service.name} has been marked as completed.`,
  };
  if (messages[status]) {
    await createNotification(
      recipientId,
      `appointment_${status}`,
      `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      messages[status]
    );
    // Email
    const recipientUser = isCustomer
      ? { email: appointment.customer.email, name: appointment.customer.name }
      : await require('../models/User').findById(business.owner).select('name email');

    if (recipientUser) {
      await sendEmail({
        to: recipientUser.email,
        subject: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} – ${appointment.business.name}`,
        html: `<p>Hi ${recipientUser.name},</p><p>${messages[status]}</p>`,
      });
    }
  }

  res.json({ success: true, data: appointment });
};
