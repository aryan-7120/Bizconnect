const Business = require('../models/Business');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');

// Helper: build filter query from request query params
const buildQuery = (queryParams) => {
  const { search, category, city, minRating, priceRange } = queryParams;

  // Only return active, approved businesses to the public
  const query = { isApproved: true, isSuspended: false };

  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (minRating) query.avgRating = { $gte: Number(minRating) };
  if (priceRange) query.priceRange = priceRange;

  return query;
};

// @desc  Get all approved businesses (public, with filters & pagination)
// @route GET /api/businesses
// @access Public
exports.getBusinesses = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;
  const sortBy = req.query.sortBy === 'rating' ? { avgRating: -1 } : { createdAt: -1 };

  const query = buildQuery(req.query);

  const [businesses, total] = await Promise.all([
    Business.find(query)
      .populate('category', 'name icon slug')
      .populate('owner', 'name avatar')
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .lean(),
    Business.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: businesses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// @desc  Get a single business profile
// @route GET /api/businesses/:id
// @access Public
exports.getBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id)
    .populate('category', 'name icon slug')
    .populate('owner', 'name avatar email')
    .populate({ path: 'services', match: { isActive: true } });

  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  // If the business is not yet approved, only the owner can view it
  if (!business.isApproved) {
    const isOwner = req.user && business.owner._id.toString() === req.user._id.toString();
    if (!isOwner) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }
  }

  res.json({ success: true, data: business });
};

// @desc  Create a business profile (one per owner)
// @route POST /api/businesses
// @access Private (business_owner)
exports.createBusiness = async (req, res) => {
  // Each business owner can only have one business
  const existing = await Business.findOne({ owner: req.user._id });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You already have a business profile. Edit it instead.',
    });
  }

  const business = await Business.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: business });
};

// @desc  Update own business profile
// @route PUT /api/businesses/:id
// @access Private (business_owner)
exports.updateBusiness = async (req, res) => {
  let business = await Business.findById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  // Only the owner can edit
  if (business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this business.' });
  }

  // Handle image uploads from Cloudinary (Multer sets req.files for multipart)
  if (req.files) {
    if (req.files.logo) req.body['images.logo'] = req.files.logo[0].path;
    if (req.files.cover) req.body['images.cover'] = req.files.cover[0].path;
    if (req.files.gallery) {
      // Append new gallery images to existing ones
      req.body['images.gallery'] = (business.images.gallery || []).concat(
        req.files.gallery.map((f) => f.path)
      );
    }
  }

  business = await Business.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: business });
};

// @desc  Delete own business
// @route DELETE /api/businesses/:id
// @access Private (business_owner)
exports.deleteBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }
  if (business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this business.' });
  }
  await business.deleteOne();
  res.json({ success: true, message: 'Business deleted successfully.' });
};

// @desc  Get current owner's business
// @route GET /api/businesses/my
// @access Private (business_owner)
exports.getMyBusiness = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id })
    .populate('category', 'name icon slug')
    .populate({ path: 'services', match: { isActive: true } });

  if (!business) {
    return res.status(404).json({ success: false, message: 'No business profile found.' });
  }

  res.json({ success: true, data: business });
};

// @desc  Block / unblock specific dates
// @route PUT /api/businesses/:id/blocked-dates
// @access Private (business_owner)
exports.updateBlockedDates = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }
  if (business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  business.blockedDates = req.body.blockedDates || [];
  await business.save();
  res.json({ success: true, data: business.blockedDates });
};

// @desc  Get available time slots for a business on a specific date
// @route GET /api/businesses/:id/slots
// @access Public
exports.getAvailableSlots = async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ success: false, message: 'Both date and serviceId are required.' });
  }

  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

  const requestedDate = new Date(date);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[requestedDate.getDay()];

  // Check if this date is blocked
  const isBlocked = business.blockedDates.some(
    (d) => new Date(d).toDateString() === requestedDate.toDateString()
  );
  if (isBlocked) {
    return res.json({ success: true, slots: [], message: 'This date is blocked by the business.' });
  }

  const workingDay = business.workingHours.find((wh) => wh.day === dayName);
  if (!workingDay || !workingDay.isOpen) {
    return res.json({ success: true, slots: [], message: 'Business is closed on this day.' });
  }

  // Get already-booked slots on this date (exclude cancelled)
  const bookedSlots = await Appointment.find({
    business: req.params.id,
    date: {
      $gte: new Date(date),
      $lt: new Date(new Date(date).setDate(requestedDate.getDate() + 1)),
    },
    status: { $nin: ['cancelled'] },
  }).select('timeSlot');

  const bookedStarts = new Set(bookedSlots.map((a) => a.timeSlot.start));

  // Generate all possible time slots based on service duration
  const slots = [];
  const [openH, openM] = workingDay.open.split(':').map(Number);
  const [closeH, closeM] = workingDay.close.split(':').map(Number);
  let current = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  while (current + service.duration <= closeMinutes) {
    const startH = String(Math.floor(current / 60)).padStart(2, '0');
    const startMin = String(current % 60).padStart(2, '0');
    const end = current + service.duration;
    const endH = String(Math.floor(end / 60)).padStart(2, '0');
    const endMin = String(end % 60).padStart(2, '0');
    const start = `${startH}:${startMin}`;

    slots.push({ start, end: `${endH}:${endMin}`, available: !bookedStarts.has(start) });
    current += service.duration;
  }

  res.json({ success: true, slots });
};

// @desc  Get search suggestions (autocomplete)
// @route GET /api/businesses/suggestions
// @access Public
exports.getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const businesses = await Business.find(
    { $text: { $search: q }, isApproved: true },
    { score: { $meta: 'textScore' }, name: 1, 'images.logo': 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .lean();

  res.json({ success: true, suggestions: businesses });
};

// @desc  Get analytics for the current owner's business
// @route GET /api/businesses/analytics
// @access Private (business_owner)
exports.getBusinessAnalytics = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id });
  if (!business) {
    return res.status(404).json({ success: false, message: 'No business found.' });
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalAppointments,
    statusBreakdown,
    popularServices,
    recentAppointments,
    monthlyTrend,
  ] = await Promise.all([
    Appointment.countDocuments({ business: business._id }),

    Appointment.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Appointment.aggregate([
      { $match: { business: business._id, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
    ]),

    Appointment.find({ business: business._id })
      .populate('customer', 'name avatar')
      .populate('service', 'name price')
      .sort({ date: -1 })
      .limit(10),

    Appointment.aggregate([
      {
        $match: {
          business: business._id,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      business: {
        name: business.name,
        avgRating: business.avgRating,
        totalReviews: business.totalReviews,
      },
      totalAppointments,
      statusBreakdown,
      popularServices,
      recentAppointments,
      monthlyTrend,
    },
  });
};
