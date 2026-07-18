const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ customer: 1, business: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
