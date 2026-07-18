const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    timeSlot: {
      start: { type: String, required: true }, // HH:mm
      end: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    cancelledBy: { type: String, enum: ['customer', 'business', 'admin', ''], default: '' },
    cancellationReason: { type: String, default: '' },
    totalAmount: { type: Number, default: 0 },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent double booking: same business, same date, same time slot, not cancelled
appointmentSchema.index(
  { business: 1, date: 1, 'timeSlot.start': 1, status: 1 },
  { unique: false }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
