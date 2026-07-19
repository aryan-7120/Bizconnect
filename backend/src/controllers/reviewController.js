const Review = require('../models/Review');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

exports.createReview = async (req, res) => {
  const { businessId, rating, comment, appointmentId } = req.body;

  const business = await Business.findById(businessId);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });

  // Allow reviews for confirmed or completed appointments
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    customer: req.user._id,
    business: businessId,
    status: { $in: ['confirmed', 'completed'] },
  });
  if (!appointment) {
    return res.status(403).json({ success: false, message: 'You can only review after a confirmed or completed appointment.' });
  }

  const existing = await Review.findOne({ customer: req.user._id, business: businessId });
  if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this business.' });

  const review = await Review.create({ customer: req.user._id, business: businessId, appointment: appointmentId, rating: Number(rating), comment });

  // Explicitly recalculate rating (the post-save hook also does this asynchronously)
  const stats = await Review.aggregate([
    { $match: { business: business._id, isApproved: true } },
    { $group: { _id: '$business', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Business.findByIdAndUpdate(businessId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }

  await review.populate('customer', 'name avatar');
  res.status(201).json({ success: true, data: review });
};

exports.getBusinessReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ business: req.params.businessId, isApproved: true })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ business: req.params.businessId, isApproved: true }),
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
};

exports.getMyReviews = async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate('business', 'name images.logo')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
};

exports.updateReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  if (review.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  const { rating, comment } = req.body;
  if (rating) review.rating = Number(rating);
  if (comment) review.comment = comment;
  // save() triggers the post-save hook which recalculates business avgRating
  await review.save();
  await review.populate('customer', 'name avatar');
  res.json({ success: true, data: review });
};

exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  if (review.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted.' });
};

exports.addOwnerReply = async (req, res) => {
  const review = await Review.findById(req.params.id).populate('business');
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  const business = await Business.findById(review.business._id);
  if (!business || business.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  review.ownerReply = req.body.reply;
  await review.save();
  res.json({ success: true, data: review });
};

// Recalculate avgRating and totalReviews for ALL businesses from review data
exports.syncAllRatings = async (req, res) => {
  const stats = await Review.aggregate([
    { $match: { isApproved: true } },
    { $group: { _id: '$business', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const updates = stats.map((s) =>
    Business.findByIdAndUpdate(s._id, {
      avgRating: Math.round(s.avgRating * 10) / 10,
      totalReviews: s.count,
    })
  );
  await Promise.all(updates);

  // Reset any businesses with no reviews
  const reviewedIds = stats.map((s) => s._id);
  await Business.updateMany(
    { _id: { $nin: reviewedIds } },
    { avgRating: 0, totalReviews: 0 }
  );

  res.json({ success: true, message: `Synced ratings for ${stats.length} businesses.` });
};
