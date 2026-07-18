const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: [true, 'Service name is required'], trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 5 }, // in minutes
    isActive: { type: Boolean, default: true },
    category: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
