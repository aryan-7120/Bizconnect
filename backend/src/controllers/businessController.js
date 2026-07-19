const Business = require('../models/Business');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');

const buildQuery = ({ search, category, city, minRating, priceRange }) => {
  const query = { isApproved: true, isSuspended: false };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (minRating) query.avgRating = { $gte: Number(minRating) };
  if (priceRange) query.priceRange = priceRange;
  return query;
};

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
      .sort(sortBy).skip(skip).limit(limit).lean(),
    Business.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: businesses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

exports.getBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id)
    .populate('category', 'name icon slug')
    .populate('owner', 'name avatar email')
    .populate({ path: 'services', match: { isActive: true } });

  if (!business) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  if (!business.isApproved) {
    const isOwner = req.user && business.owner._id.toString() === req.user._id.toString();
    if (!isOwner) return res.status(404).json({ success: false, message: 'Business not found.' });
  }

  res.json({ success: true, data: business });
};

exports.createBusiness = async (req, res) => {
  const existing = await Business.findOne({ owner: req.user._id });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have a business profile.' });
  }
  const business = await Business.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ success: true, data: business });
};

exports.updateBusiness = async (req, res) => {
  let business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
  if (business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const updateData = {};

  // Scalar fields
  const scalarFields = ['name', 'description', 'tagline', 'phone', 'email', 'website', 'priceRange', 'category'];
  scalarFields.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f]; });

  // Tags array (may come as 'tags[]' from FormData)
  if (req.body['tags[]']) {
    updateData.tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
  } else if (req.body.tags) {
    updateData.tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
  }

  // Address (flat FormData keys like address[city])
  const addressFields = ['street', 'city', 'state', 'country', 'zipCode'];
  const addressUpdate = {};
  addressFields.forEach((f) => {
    const val = req.body[`address[${f}]`];
    if (val !== undefined) addressUpdate[f] = val;
  });
  if (Object.keys(addressUpdate).length > 0) {
    addressFields.forEach((f) => { updateData[`address.${f}`] = addressUpdate[f] || ''; });
  }

  // Social links
  const socialFields = ['facebook', 'instagram', 'twitter', 'linkedin'];
  const socialUpdate = {};
  socialFields.forEach((f) => {
    const val = req.body[`socialLinks[${f}]`];
    if (val !== undefined) socialUpdate[f] = val;
  });
  if (Object.keys(socialUpdate).length > 0) {
    socialFields.forEach((f) => { updateData[`socialLinks.${f}`] = socialUpdate[f] || ''; });
  }

  // Working hours
  const workingHoursMap = {};
  Object.keys(req.body).forEach((key) => {
    const match = key.match(/^workingHours\[(\d+)\]\[(.+)\]$/);
    if (match) {
      const idx = parseInt(match[1]);
      const field = match[2];
      if (!workingHoursMap[idx]) workingHoursMap[idx] = {};
      workingHoursMap[idx][field] = field === 'isOpen' ? req.body[key] === 'true' : req.body[key];
    }
  });
  if (Object.keys(workingHoursMap).length > 0) {
    updateData.workingHours = Object.keys(workingHoursMap)
      .sort((a, b) => a - b)
      .map((idx) => workingHoursMap[idx]);
  }

  // Image files
  if (req.files) {
    if (req.files.logo) updateData['images.logo'] = req.files.logo[0].path;
    if (req.files.cover) updateData['images.cover'] = req.files.cover[0].path;
    if (req.files.gallery) {
      updateData['images.gallery'] = (business.images.gallery || []).concat(
        req.files.gallery.map((f) => f.path)
      );
    }
  }

  business = await Business.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  res.json({ success: true, data: business });
};

exports.deleteBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
  if (business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  await business.deleteOne();
  res.json({ success: true, message: 'Business deleted.' });
};

exports.getMyBusiness = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id })
    .populate('category', 'name icon slug')
    .populate({ path: 'services', match: { isActive: true } });

  if (!business) return res.status(404).json({ success: false, message: 'No business profile found.' });
  res.json({ success: true, data: business });
};

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

exports.getAvailableSlots = async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ success: false, message: 'date and serviceId are required.' });
  }

  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

  const requestedDate = new Date(date);
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][requestedDate.getDay()];

  const isBlocked = business.blockedDates.some(
    (d) => new Date(d).toDateString() === requestedDate.toDateString()
  );
  if (isBlocked) return res.json({ success: true, slots: [] });

  const workingDay = business.workingHours.find((wh) => wh.day === dayName);
  if (!workingDay || !workingDay.isOpen) return res.json({ success: true, slots: [] });

  const bookedSlots = await Appointment.find({
    business: req.params.id,
    date: { $gte: new Date(date), $lt: new Date(new Date(date).setDate(requestedDate.getDate() + 1)) },
    status: { $nin: ['cancelled'] },
  }).select('timeSlot');

  const bookedStarts = new Set(bookedSlots.map((a) => a.timeSlot.start));
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

exports.getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });

  const businesses = await Business.find(
    { $text: { $search: q }, isApproved: true },
    { score: { $meta: 'textScore' }, name: 1, 'images.logo': 1 }
  ).sort({ score: { $meta: 'textScore' } }).limit(5).lean();

  res.json({ success: true, suggestions: businesses });
};

exports.getBusinessAnalytics = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id });
  if (!business) return res.status(404).json({ success: false, message: 'No business found.' });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [totalAppointments, statusBreakdown, popularServices, recentAppointments, monthlyTrend] =
    await Promise.all([
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
        .sort({ date: -1 }).limit(10),
      Appointment.aggregate([
        { $match: { business: business._id, createdAt: { $gte: sixMonthsAgo } } },
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
      business: { name: business.name, avgRating: business.avgRating, totalReviews: business.totalReviews },
      totalAppointments,
      statusBreakdown,
      popularServices,
      recentAppointments,
      monthlyTrend,
    },
  });
};
