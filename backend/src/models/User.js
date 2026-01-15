const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['CUSTOMER', 'DRIVER', 'ADMIN'],
    default: 'CUSTOMER'
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  birthday: {
    type: Date,
    default: null
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  driverStatus: {
    type: String,
    enum: ['RANH', 'BAN'],
    default: 'RANH'
  },
  // Trạng thái khóa tài khoản
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lockReason: {
    type: String,
    default: ''
  },
  // Vị trí hiện tại của tài xế
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  // Xác thực số điện thoại
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // ========== THÔNG TIN TÀI XẾ ==========
  // Trạng thái duyệt tài xế
  driverApprovalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: null // null cho customer, PENDING cho driver mới đăng ký
  },
  // Đã đồng ý nội quy chưa
  agreedToRules: {
    type: Boolean,
    default: false
  },
  agreedToRulesAt: {
    type: Date,
    default: null
  },
  // Thông tin cá nhân tài xế
  driverInfo: {
    // CMND/CCCD
    idNumber: { type: String, default: '' },
    idFrontImage: { type: String, default: '' }, // URL ảnh mặt trước
    idBackImage: { type: String, default: '' },  // URL ảnh mặt sau
    // Bằng lái xe
    licenseNumber: { type: String, default: '' },
    licenseImage: { type: String, default: '' },
    licenseExpiry: { type: Date, default: null },
    // Thông tin xe
    vehicleType: { type: String, enum: ['XE_MAY', 'XE_4_CHO', 'XE_7_CHO'], default: 'XE_4_CHO' },
    vehicleBrand: { type: String, default: '' },
    vehicleModel: { type: String, default: '' },
    vehiclePlate: { type: String, default: '' },
    vehicleYear: { type: Number, default: null },
    vehicleImage: { type: String, default: '' },
    // Thông tin bổ sung
    emergencyContact: { type: String, default: '' },
    emergencyPhone: { type: String, default: '' }
  },
  // Admin duyệt
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
