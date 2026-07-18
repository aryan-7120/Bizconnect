const User = require('../models/User');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');

// @desc  Admin: Get all users
exports.getUsers = async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.json({ success: true, data: users, pagination: { page: Number(page), limit: Number(limit), total } });
};

// @desc  Admin: Suspend/unsuspend user
exports.toggleSuspend = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  user.isSuspended = !user.isSuspended;
  await user.save();
  res.json({ success: true, data: user, message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'}.` });
};

// @desc  Admin: Approve/reject business
exports.approveBusiness = async (req, res) => {
  const { approved, rejectionReason } = req.body;
  const business = await Business.findById(req.params.id).populate('owner', 'name email');
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });
  business.isApproved = approved;
  await business.save();

  const { sendEmail } = require('../config/nodemailer');
  await sendEmail({
    to: business.owner.email,
    subject: approved ? 'Business Approved! 🎉' : 'Business Application Update',
    html: approved
      ? `<p>Hi ${business.owner.name}, your business <strong>${business.name}</strong> has been approved on BizConnect!</p>`
      : `<p>Hi ${business.owner.name}, your business <strong>${business.name}</strong> was not approved. ${rejectionReason || ''}</p>`,
  });

  res.json({ success: true, data: business });
};

// @desc  Admin: Platform analytics
exports.getPlatformAnalytics = async (req, res) => {
  const [totalUsers, totalBusinesses, totalAppointments, pendingApprovals, recentReviews] = await Promise.all([
    User.countDocuments(),
    Business.countDocuments(),
    Appointment.countDocuments(),
    Business.countDocuments({ isApproved: false }),
    Review.find().populate('customer', 'name avatar').populate('business', 'name').sort({ createdAt: -1 }).limit(10),
  ]);

  // Monthly appointment trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyTrend = await Appointment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const statusBreakdown = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      totalUsers, totalBusinesses, totalAppointments, pendingApprovals,
      recentReviews, monthlyTrend, statusBreakdown,
    },
  });
};

// @desc  Business analytics
exports.getBusinessAnalytics = async (req, res) => {
  const business = await Business.findOne({ owner: req.user._id });
  if (!business) return res.status(404).json({ success: false, message: 'No business found.' });

  const [totalAppointments, statusBreakdown, popularServices, recentAppointments, monthlyTrend] = await Promise.all([
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
      { $match: { business: business._id, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      business: { name: business.name, avgRating: business.avgRating, totalReviews: business.totalReviews },
      totalAppointments, statusBreakdown, popularServices, recentAppointments, monthlyTrend,
    },
  });
};
