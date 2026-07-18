const Review = require('../models/Review');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');

// @desc  Create review
// @route POST /api/reviews
exports.createReview = async (req, res) => {
  const { businessId, rating, comment, appointmentId } = req.body;
  const business = await Business.findById(businessId);
  if (!business) return res.status(404).json({ success: false, message: 'Business not found.' });

  // Check for completed appointment
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    customer: req.user._id,
    business: businessId,
    status: 'completed',
  });
  if (!appointment) {
    return res.status(403).json({ success: false, message: 'You can only review after a completed appointment.' });
  }

  const existing = await Review.findOne({ customer: req.user._id, business: businessId });
  if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this business.' });

  const review = await Review.create({
    customer: req.user._id,
    business: businessId,
    appointment: appointmentId,
    rating,
    comment,
  });
  await review.populate('customer', 'name avatar');
  res.status(201).json({ success: true, data: review });
};

// @desc  Get reviews for a business
// @route GET /api/reviews/business/:businessId
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

// @desc  Get my reviews
// @route GET /api/reviews/my
exports.getMyReviews = async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate('business', 'name images.logo')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
};

// @desc  Update review
// @route PUT /api/reviews/:id
exports.updateReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  if (review.customer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  const { rating, comment } = req.body;
  if (rating) review.rating = rating;
  if (comment) review.comment = comment;
  await review.save();
  await review.populate('customer', 'name avatar');
  res.json({ success: true, data: review });
};

// @desc  Delete review
// @route DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  const isOwner = review.customer.toString() === req.user._id.toString();
  if (!isOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted.' });
};

// @desc  Add owner reply
// @route PUT /api/reviews/:id/reply
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
