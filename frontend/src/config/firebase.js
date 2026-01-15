import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-1BND4tEOKlQjjAeJrwVPcjSA1kQD7PI",
  authDomain: "taxiapp-f5be5.firebaseapp.com",
  projectId: "taxiapp-f5be5",
  storageBucket: "taxiapp-f5be5.firebasestorage.app",
  messagingSenderId: "383960804142",
  appId: "1:383960804142:web:0c624cdac7cdd999f728bf",
  measurementId: "G-G06ZC628D1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'vi';

// Gửi OTP
export const sendOTP = async (phoneNumber, recaptchaContainerId = 'recaptcha-container') => {
  try {
    // Format số điện thoại VN: 0901234567 -> +84901234567
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '+84' + phoneNumber.slice(1);
    } else if (!phoneNumber.startsWith('+')) {
      formattedPhone = '+84' + phoneNumber;
    }

    // Clear reCAPTCHA cũ nếu có
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.log('Clear recaptcha:', e);
      }
      window.recaptchaVerifier = null;
    }

    // Clear container
    const container = document.getElementById(recaptchaContainerId);
    if (container) {
      container.innerHTML = '';
    }

    // Tạo reCAPTCHA mới
    window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      }
    });

    await window.recaptchaVerifier.render();
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
    window.confirmationResult = confirmationResult;
    
    return { success: true };
  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Reset nếu lỗi
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
    
    throw error;
  }
};

// Xác thực OTP
export const verifyOTP = async (otp) => {
  try {
    if (!window.confirmationResult) {
      throw new Error('Vui lòng gửi OTP trước');
    }
    const result = await window.confirmationResult.confirm(otp);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

// Reset reCAPTCHA (gọi khi chuyển trang hoặc cần reset)
export const resetRecaptcha = () => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
    window.recaptchaVerifier = null;
  }
  window.confirmationResult = null;
};

export { auth };
