const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pickup: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  dropoff: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  distance: { type: Number, default: 0 }, // meters
  duration: { type: Number, default: 0 }, // seconds
  price: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['MOI_TAO', 'DA_NHAN', 'DANG_CHAY', 'HOAN_THANH', 'HUY'],
    default: 'MOI_TAO'
  },
  driverLocation: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
