const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['REGISTER', 'RESET_PASSWORD', 'VERIFY_PHONE'],
    required: true
  },
  // Số lần thử sai
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  // Hết hạn sau 5 phút
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000)
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index để tự động xóa OTP hết hạn
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Kiểm tra OTP còn hiệu lực
otpSchema.methods.isValid = function() {
  return !this.isUsed && 
         this.attempts < this.maxAttempts && 
         new Date() < this.expiresAt;
};

module.exports = mongoose.model('OTP', otpSchema);
