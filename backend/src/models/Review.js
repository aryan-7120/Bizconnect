const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
    ownerReply: { type: String, default: '' },
  },
  { timestamps: true }
);

// One review per customer per business
reviewSchema.index({ customer: 1, business: 1 }, { unique: true });

// Auto-update business avgRating after save/remove
async function updateBusinessRating(businessId) {
  const Review = mongoose.model('Review');
  const Business = mongoose.model('Business');
  const stats = await Review.aggregate([
    { $match: { business: businessId, isApproved: true } },
    { $group: { _id: '$business', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Business.findByIdAndUpdate(businessId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  } else {
    await Business.findByIdAndUpdate(businessId, { avgRating: 0, totalReviews: 0 });
  }
}

reviewSchema.post('save', function () { updateBusinessRating(this.business); });
reviewSchema.post('remove', function () { updateBusinessRating(this.business); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) updateBusinessRating(doc.business); });

module.exports = mongoose.model('Review', reviewSchema);
