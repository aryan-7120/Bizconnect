const Favorite = require('../models/Favorite');

exports.getFavorites = async (req, res) => {
  const favorites = await Favorite.find({ customer: req.user._id })
    .populate({
      path: 'business',
      select: 'name images.logo images.cover avgRating totalReviews address category priceRange isVerified',
      populate: { path: 'category', select: 'name icon' },
    })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: favorites });
};

exports.toggleFavorite = async (req, res) => {
  const { businessId } = req.body;
  const existing = await Favorite.findOne({ customer: req.user._id, business: businessId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, isFavorite: false, message: 'Removed from favorites.' });
  }
  await Favorite.create({ customer: req.user._id, business: businessId });
  res.json({ success: true, isFavorite: true, message: 'Added to favorites.' });
};

exports.checkFavorite = async (req, res) => {
  const exists = await Favorite.findOne({ customer: req.user._id, business: req.params.businessId });
  res.json({ success: true, isFavorite: !!exists });
};
