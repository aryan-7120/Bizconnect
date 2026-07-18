const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
  day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
  isOpen: { type: Boolean, default: true },
  open: { type: String, default: '09:00' },
  close: { type: String, default: '18:00' },
});

const businessSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: [true, 'Business name is required'], trim: true, maxlength: 150 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, default: '', maxlength: 2000 },
    tagline: { type: String, default: '', maxlength: 200 },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: { lat: Number, lng: Number },
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    workingHours: [workingHoursSchema],
    images: {
      logo: { type: String, default: '' },
      cover: { type: String, default: '' },
      gallery: [String],
    },
    socialLinks: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
    },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true }, // Businesses auto-publish on creation (no admin approval required)
    isSuspended: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    blockedDates: [Date],
    priceRange: { type: String, enum: ['$', '$$', '$$$', '$$$$'], default: '$$' },
    tags: [String],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual: services
businessSchema.virtual('services', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'business',
});

// Text search index
businessSchema.index({ name: 'text', description: 'text', tags: 'text' });
businessSchema.index({ 'address.city': 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ avgRating: -1 });

module.exports = mongoose.model('Business', businessSchema);
