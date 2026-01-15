const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { username, password, role, name, phone, email, isPhoneVerified } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username đã được sử dụng' });
    }

    // Kiểm tra số điện thoại đã đăng ký chưa
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
    }

    const userData = { 
      username, 
      password, 
      role, 
      name, 
      phone, 
      email,
      isPhoneVerified: isPhoneVerified || false
    };

    // Nếu là tài xế, set trạng thái chờ duyệt
    if (role === 'DRIVER') {
      userData.driverApprovalStatus = 'PENDING';
    }

    const user = await User.create(userData);
    const token = signToken(user._id);

    res.status(201).json({
      message: role === 'DRIVER' 
        ? 'Đăng ký thành công. Vui lòng hoàn tất hồ sơ tài xế.' 
        : 'Đăng ký thành công',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role, 
        name: user.name,
        driverApprovalStatus: user.driverApprovalStatus
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập username và password' });
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Username hoặc password không đúng' });
    }

    // Kiểm tra tài khoản bị khóa
    if (user.isLocked) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị khóa',
        reason: user.lockReason || 'Vui lòng liên hệ admin để biết thêm chi tiết',
        lockedAt: user.lockedAt
      });
    }

    // Kiểm tra tài xế chưa được duyệt
    if (user.role === 'DRIVER' && user.driverApprovalStatus !== 'APPROVED') {
      const token = signToken(user._id);
      return res.status(200).json({
        message: user.driverApprovalStatus === 'PENDING' 
          ? 'Tài khoản đang chờ duyệt' 
          : 'Tài khoản bị từ chối',
        token,
        user: { 
          id: user._id, 
          username: user.username, 
          role: user.role, 
          name: user.name,
          driverApprovalStatus: user.driverApprovalStatus,
          agreedToRules: user.agreedToRules,
          rejectionReason: user.rejectionReason
        },
        requiresApproval: true
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Kiểm tra số điện thoại đã đăng ký chưa
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    res.status(200).json({ exists: !!user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reset password bằng số điện thoại (sau khi đã xác thực Firebase OTP)
exports.resetPasswordByPhone = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với số điện thoại này' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
