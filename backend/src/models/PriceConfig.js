const mongoose = require('mongoose');

const priceConfigSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  pricePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  basePrice: {
    type: Number,
    default: 10000, // Giá mở cửa
    min: 0
  },
  minPrice: {
    type: Number,
    default: 15000, // Giá tối thiểu
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index để tìm kiếm nhanh theo tháng/năm
priceConfigSchema.index({ year: 1, month: 1 });

module.exports = mongoose.model('PriceConfig', priceConfigSchema);
