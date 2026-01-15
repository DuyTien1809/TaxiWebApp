const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { protect } = require('../middlewares/auth');

// Public routes - Đăng ký với OTP
router.post('/register/send', otpController.sendRegisterOTP);
router.post('/register/verify', otpController.verifyRegisterOTP);

// Public routes - Quên mật khẩu
router.post('/forgot-password/send', otpController.sendResetPasswordOTP);
router.post('/forgot-password/verify', otpController.verifyResetPasswordOTP);
router.post('/reset-password', otpController.resetPassword);

// Protected routes - Xác thực số điện thoại cho user đã đăng ký
router.post('/verify-phone/send', protect, otpController.sendVerifyPhoneOTP);
router.post('/verify-phone/verify', protect, otpController.verifyPhone);

module.exports = router;
