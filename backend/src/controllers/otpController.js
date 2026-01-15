const OTP = require('../models/OTP');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTP } = require('../utils/smsService');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Gửi OTP đăng ký
exports.sendRegisterOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    }

    // Kiểm tra số điện thoại đã đăng ký chưa
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Số điện thoại đã được đăng ký' });
    }

    // Kiểm tra rate limit - không gửi quá 3 OTP trong 10 phút
    const recentOTPs = await OTP.countDocuments({
      phone,
      type: 'REGISTER',
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({ 
        message: 'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 10 phút.' 
      });
    }

    // Tạo và gửi OTP
    const code = generateOTP();
    await OTP.create({ phone, code, type: 'REGISTER' });
    await sendOTP(phone, code, 'REGISTER');

    res.status(200).json({ 
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
      expiresIn: 300 // 5 phút
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xác thực OTP và hoàn tất đăng ký
exports.verifyRegisterOTP = async (req, res) => {
  try {
    const { phone, code, username, password, name, role, email } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mã OTP' });
    }

    // Tìm OTP mới nhất
    const otp = await OTP.findOne({ 
      phone, 
      type: 'REGISTER',
      isUsed: false 
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ message: 'Mã OTP không tồn tại. Vui lòng yêu cầu mã mới.' });
    }

    if (!otp.isValid()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc đã sử dụng' });
    }

    // Tăng số lần thử
    otp.attempts += 1;
    await otp.save();

    if (otp.code !== code) {
      const remaining = otp.maxAttempts - otp.attempts;
      return res.status(400).json({ 
        message: `Mã OTP không đúng. Còn ${remaining} lần thử.` 
      });
    }

    // Đánh dấu OTP đã sử dụng
    otp.isUsed = true;
    await otp.save();

    // Kiểm tra username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username đã được sử dụng' });
    }

    // Tạo user mới với phone đã xác thực
    const userData = {
      username,
      password,
      name,
      phone,
      email,
      role: role || 'CUSTOMER',
      isPhoneVerified: true
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
        phone: user.phone,
        driverApprovalStatus: user.driverApprovalStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gửi OTP quên mật khẩu
exports.sendResetPasswordOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    }

    // Kiểm tra user tồn tại
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Số điện thoại chưa được đăng ký' });
    }

    if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    // Rate limit
    const recentOTPs = await OTP.countDocuments({
      phone,
      type: 'RESET_PASSWORD',
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({ 
        message: 'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 10 phút.' 
      });
    }

    const code = generateOTP();
    await OTP.create({ phone, code, type: 'RESET_PASSWORD' });
    await sendOTP(phone, code, 'RESET_PASSWORD');

    res.status(200).json({ 
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
      expiresIn: 300
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xác thực OTP reset password
exports.verifyResetPasswordOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mã OTP' });
    }

    const otp = await OTP.findOne({ 
      phone, 
      type: 'RESET_PASSWORD',
      isUsed: false 
    }).sort({ createdAt: -1 });

    if (!otp || !otp.isValid()) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    otp.attempts += 1;
    await otp.save();

    if (otp.code !== code) {
      const remaining = otp.maxAttempts - otp.attempts;
      return res.status(400).json({ 
        message: `Mã OTP không đúng. Còn ${remaining} lần thử.` 
      });
    }

    // Tạo reset token tạm thời (15 phút)
    const resetToken = jwt.sign(
      { phone, purpose: 'reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Đánh dấu OTP đã sử dụng
    otp.isUsed = true;
    await otp.save();

    res.status(200).json({ 
      message: 'Xác thực thành công',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    if (decoded.purpose !== 'reset_password') {
      return res.status(400).json({ message: 'Token không hợp lệ' });
    }

    const user = await User.findOne({ phone: decoded.phone });
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Cập nhật mật khẩu
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Gửi OTP xác thực số điện thoại (cho user đã đăng ký)
exports.sendVerifyPhoneOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user.isPhoneVerified) {
      return res.status(400).json({ message: 'Số điện thoại đã được xác thực' });
    }

    const recentOTPs = await OTP.countDocuments({
      phone: user.phone,
      type: 'VERIFY_PHONE',
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    });

    if (recentOTPs >= 3) {
      return res.status(429).json({ 
        message: 'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 10 phút.' 
      });
    }

    const code = generateOTP();
    await OTP.create({ phone: user.phone, code, type: 'VERIFY_PHONE' });
    await sendOTP(user.phone, code, 'VERIFY_PHONE');

    res.status(200).json({ 
      message: 'Mã OTP đã được gửi',
      expiresIn: 300
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xác thực số điện thoại
exports.verifyPhone = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const otp = await OTP.findOne({ 
      phone: user.phone, 
      type: 'VERIFY_PHONE',
      isUsed: false 
    }).sort({ createdAt: -1 });

    if (!otp || !otp.isValid()) {
      return res.status(400).json({ message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
    }

    otp.attempts += 1;
    await otp.save();

    if (otp.code !== code) {
      const remaining = otp.maxAttempts - otp.attempts;
      return res.status(400).json({ 
        message: `Mã OTP không đúng. Còn ${remaining} lần thử.` 
      });
    }

    otp.isUsed = true;
    await otp.save();

    user.isPhoneVerified = true;
    await user.save();

    res.status(200).json({ message: 'Xác thực số điện thoại thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
