import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendRegisterOTP } from '../services/api';
import api from '../services/api';

export default function Register({ setUser }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [form, setForm] = useState({
    username: '', password: '', name: '', role: 'CUSTOMER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendRegisterOTP(phone);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await sendRegisterOTP(phone);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Xác thực OTP và đăng ký luôn
      const { data } = await api.post('/otp/register/verify', {
        phone,
        code,
        ...form
      });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Tài xế mới đăng ký -> chuyển đến trang onboarding
      if (data.user.role === 'DRIVER') {
        navigate('/driver/onboarding');
      } else if (data.user.role === 'CUSTOMER') {
        navigate('/customer/booking');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1511527844068-006b95d162c2?q=80&w=1920" alt="Taxi Driver" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90"></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">Tham gia ngay</h1>
          <p className="text-xl text-white/80 mb-8 animate-fade-in" style={{animationDelay: '0.1s'}}>Trở thành thành viên của TaxiGo</p>
          <div className="space-y-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">📱</div>
              <span>Xác thực số điện thoại an toàn</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">💵</div>
              <span>Thu nhập hấp dẫn cho tài xế</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">🛡️</div>
              <span>An toàn và đáng tin cậy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-3xl">🚕</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">TaxiGo</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && <div className={`w-16 h-1 mx-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
            {/* Step 1: Phone + User Info */}
            {step === 1 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Đăng ký tài khoản</h2>
                  <p className="text-gray-500 mt-2">Nhập thông tin để tạo tài khoản</p>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSendOTP} className="space-y-4">
                  {/* Role Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setForm({ ...form, role: 'CUSTOMER' })} className={`p-4 rounded-xl border-2 transition-all ${form.role === 'CUSTOMER' ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 hover:border-green-300'}`}>
                      <span className="text-2xl block mb-1">🧑</span>
                      <span className={`text-sm font-medium ${form.role === 'CUSTOMER' ? 'text-green-700' : 'text-gray-600'}`}>Khách hàng</span>
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, role: 'DRIVER' })} className={`p-4 rounded-xl border-2 transition-all ${form.role === 'DRIVER' ? 'border-green-500 bg-green-50 shadow-lg' : 'border-gray-200 hover:border-green-300'}`}>
                      <span className="text-2xl block mb-1">🚗</span>
                      <span className={`text-sm font-medium ${form.role === 'DRIVER' ? 'text-green-700' : 'text-gray-600'}`}>Tài xế</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 bg-gray-100 border-2 border-r-0 border-gray-100 rounded-l-xl text-gray-600 font-medium">+84</span>
                      <input
                        type="tel"
                        placeholder="901234567"
                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-r-xl text-gray-800 placeholder-gray-400 transition-all focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none"
                        value={phone.startsWith('0') ? phone.slice(1) : phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPhone(val.startsWith('0') ? val : '0' + val);
                        }}
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                    <input type="text" placeholder="Nguyễn Văn A" className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
                    <input type="text" placeholder="username" className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required minLength={3} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} placeholder="Ít nhất 6 ký tự" className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none pr-12" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading || phone.length < 9 || !form.name || !form.username || form.password.length < 6} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg><span>Đang gửi...</span></> : <span>Gửi mã OTP</span>}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔐</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Nhập mã OTP</h2>
                  <p className="text-gray-500 mt-2">Mã đã gửi đến <span className="font-semibold text-gray-700">{phone}</span></p>
                  <button onClick={() => { setStep(1); setError(''); }} className="text-green-600 text-sm mt-1 hover:underline">Quay lại</button>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOTP}>
                  <div className="flex justify-center gap-2 mb-6">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      />
                    ))}
                  </div>

                  <div className="text-center mb-6">
                    {countdown > 0 ? (
                      <p className="text-gray-500">Gửi lại sau <span className="font-semibold text-green-600">{countdown}s</span></p>
                    ) : (
                      <button type="button" onClick={handleResendOTP} disabled={loading} className="text-green-600 font-semibold hover:underline">Gửi lại mã OTP</button>
                    )}
                  </div>

                  <button type="submit" disabled={loading || otp.join('').length !== 6} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg><span>Đang xác thực...</span></> : <><span>Tạo tài khoản</span><span>🚀</span></>}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">Đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
