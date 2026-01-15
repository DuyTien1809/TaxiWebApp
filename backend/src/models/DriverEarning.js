const mongoose = require('mongoose');

const driverEarningSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  // Thu nhập gốc từ cuốc xe (tiền khách trả)
  fareAmount: {
    type: Number,
    required: true
  },
  // Chiết khấu nền tảng (%)
  platformFeePercent: {
    type: Number,
    default: 20 // 20% chiết khấu
  },
  // Số tiền chiết khấu
  platformFeeAmount: {
    type: Number,
    required: true
  },
  // Thu nhập thực nhận (sau chiết khấu)
  netEarning: {
    type: Number,
    required: true
  },
  // Tiền thưởng
  bonus: {
    type: Number,
    default: 0
  },
  bonusReason: {
    type: String,
    default: ''
  },
  // Tiền tip từ khách
  tip: {
    type: Number,
    default: 0
  },
  // Tổng thu nhập (netEarning + bonus + tip)
  totalEarning: {
    type: Number,
    required: true
  },
  // Thông tin chuyến
  distance: { type: Number, default: 0 }, // meters
  duration: { type: Number, default: 0 }, // seconds
  // Trạng thái thanh toán cho tài xế
  status: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING'
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('DriverEarning', driverEarningSchema);
