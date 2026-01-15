/**
 * SMS Service - Gửi tin nhắn OTP
 * Hỗ trợ: Twilio, hoặc mock cho development
 */

// Tạo mã OTP ngẫu nhiên 6 số
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Mock SMS cho development
const sendMockSMS = async (phone, message) => {
  console.log('========== MOCK SMS ==========');
  console.log(`To: ${phone}`);
  console.log(`Message: ${message}`);
  console.log('==============================');
  return { success: true, provider: 'mock' };
};

// Gửi SMS qua Twilio
const sendTwilioSMS = async (phone, message) => {
  try {
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    return { success: true, provider: 'twilio', sid: result.sid };
  } catch (error) {
    console.error('Twilio error:', error.message);
    throw new Error('Không thể gửi SMS. Vui lòng thử lại sau.');
  }
};

// Gửi OTP
const sendOTP = async (phone, code, type) => {
  const messages = {
    REGISTER: `[TaxiApp] Ma xac thuc dang ky cua ban la: ${code}. Ma co hieu luc trong 5 phut.`,
    RESET_PASSWORD: `[TaxiApp] Ma xac thuc dat lai mat khau: ${code}. Ma co hieu luc trong 5 phut.`,
    VERIFY_PHONE: `[TaxiApp] Ma xac thuc so dien thoai: ${code}. Ma co hieu luc trong 5 phut.`
  };

  const message = messages[type] || `[TaxiApp] Ma OTP cua ban la: ${code}`;

  // Sử dụng mock trong development, Twilio trong production
  if (process.env.NODE_ENV === 'production' && process.env.TWILIO_ACCOUNT_SID) {
    return sendTwilioSMS(phone, message);
  }
  
  return sendMockSMS(phone, message);
};

module.exports = {
  generateOTP,
  sendOTP
};
