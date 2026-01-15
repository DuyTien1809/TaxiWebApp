const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  // Người đánh giá (khách hàng)
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Người được đánh giá (tài xế)
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Loại đánh giá: chỉ khách đánh giá tài xế
  type: {
    type: String,
    enum: ['CUSTOMER_TO_DRIVER'],
    default: 'CUSTOMER_TO_DRIVER'
  },
  // Số sao (1-5)
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Nhận xét
  comment: {
    type: String,
    default: '',
    maxlength: 500
  },
  // Tags đánh giá nhanh cho tài xế
  tags: [{
    type: String,
    enum: [
      // Tags tích cực
      'THAN_THIEN', 'CHUYEN_NGHIEP', 'AN_TOAN', 'DUNG_GIO', 'XE_SACH', 'GIAO_TIEP_TOT',
      // Tags tiêu cực
      'DI_CHAM', 'THAI_DO_XAU', 'XE_BAN', 'LAI_XE_AU', 'KHONG_LICH_SU'
    ]
  }]
}, { timestamps: true });

// Index để tìm kiếm nhanh
ratingSchema.index({ toUserId: 1 });
ratingSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
