const Business = require('../models/Business');
const Service = require('../models/Service');
const Category = require('../models/Category');
const Notification = require('../models/Notification');

// Helper: build filter query
const buildQuery = (queryParams) => {
  const { search, category, city, minRating, priceRange, isVerified } = queryParams;
  const query = { isApproved: true, isSuspended: false };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (minRating) query.avgRating = { $gte: Number(minRating) };
  if (priceRange) query.priceRange = priceRange;
  if (isVerified === 'true') query.isVerified = true;
  return query;
};

// @desc  Get all businesses (public, with filters)
// @route GET /api/businesses
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

// @desc  Get single business profile
// @route GET /api/businesses/:id
exports.getBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id)
    .populate('category', 'name icon slug')
    .populate('owner', 'name avatar email')
    .populate({ path: 'services', match: { isActive: true } });
  if (!business || (!business.isApproved && (!req.user || req.user.role !== 'admin'))) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }
  res.json({ success: true, data: business });
};

// @desc  Create business
// @route POST /api/businesses
exports.createBusiness = async (req, res) => {
  const existing = await Business.findOne({ owner: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have a business profile. Edit it instead.' });
  }
  const business = await Business.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: business });
};

// @desc  Update business
// @route PUT /api/businesses/:id
exports.updateBusiness = async (req, res) => {
  let business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
  if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this business.' });
  }
  // Handle image uploads
  if (req.files) {
    if (req.files.logo) req.body['images.logo'] = req.files.logo[0].path;
    if (req.files.cover) req.body['images.cover'] = req.files.cover[0].path;
    if (req.files.gallery) {
      req.body['images.gallery'] = (business.images.gallery || []).concat(
        req.files.gallery.map((f) => f.path)
      );
    }
  }
  business = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: business });
};

// @desc  Delete business
// @route DELETE /api/businesses/:id
exports.deleteBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
  if (business.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  await business.deleteOne();
  res.json({ success: true, message: 'Business deleted.' });
};

// @desc  Get my business
// @route GET /api/businesses/my
exports.getMyBusiness = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id })
    .populate('category', 'name icon slug')
    .populate({ path: 'services', match: { isActive: true } });
  if (!business) return res.status(404).json({ success: false, message: 'No business profile found.' });
  res.json({ success: true, data: business });
};

// @desc  Block/unblock dates
// @route PUT /api/businesses/:id/blocked-dates
exports.updateBlockedDates = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
  if (business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  business.blockedDates = req.body.blockedDates || [];
  await business.save();
  res.json({ success: true, data: business.blockedDates });
};

// @desc  Get available time slots for a date
// @route GET /api/businesses/:id/slots
exports.getAvailableSlots = async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ success: false, message: 'date and serviceId required.' });
  }
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

  const requestedDate = new Date(date);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[requestedDate.getDay()];

  // Check blocked dates
  const isBlocked = business.blockedDates.some(
    (d) => new Date(d).toDateString() === requestedDate.toDateString()
  );
  if (isBlocked) return res.json({ success: true, slots: [], message: 'Date is blocked.' });

  const workingDay = business.workingHours.find((wh) => wh.day === dayName);
  if (!workingDay || !workingDay.isOpen) {
    return res.json({ success: true, slots: [], message: 'Business is closed on this day.' });
  }

  // Generate slots based on service duration
  const Appointment = require('../models/Appointment');
  const bookedSlots = await Appointment.find({
    business: req.params.id,
    date: { $gte: new Date(date), $lt: new Date(new Date(date).setDate(requestedDate.getDate() + 1)) },
    status: { $nin: ['cancelled'] },
  }).select('timeSlot');

  const bookedStarts = bookedSlots.map((a) => a.timeSlot.start);
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
    slots.push({ start, end: `${endH}:${endMin}`, available: !bookedStarts.includes(start) });
    current += service.duration;
  }

  res.json({ success: true, slots });
};

// @desc  Get search suggestions
// @route GET /api/businesses/suggestions
exports.getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });
  const businesses = await Business.find(
    { $text: { $search: q }, isApproved: true },
    { score: { $meta: 'textScore' }, name: 1, 'images.logo': 1 }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .lean();
  res.json({ success: true, suggestions: businesses });
};
