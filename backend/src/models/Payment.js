const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  method: {
    type: String,
    enum: ['TIEN_MAT', 'ONLINE'],
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['CHO_THANH_TOAN', 'DA_THANH_TOAN', 'THAT_BAI'],
    default: 'CHO_THANH_TOAN'
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
