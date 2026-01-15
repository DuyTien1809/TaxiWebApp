const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  bankAccount: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolder: { type: String, default: '' }
  },
  isLinked: {
    type: Boolean,
    default: false
  },
  transactions: [{
    type: {
      type: String,
      enum: ['NAP_TIEN', 'THANH_TOAN', 'HOAN_TIEN', 'THU_NHAP', 'RUT_TIEN'],
      required: true
    },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
