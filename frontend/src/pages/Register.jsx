import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

export default function Register({ setUser }) {
  const [form, setForm] = useState({
    username: '', password: '', name: '', phone: '', role: 'CUSTOMER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      if (data.user.role === 'CUSTOMER') navigate('/customer/booking');
      else if (data.user.role === 'DRIVER') navigate('/driver');
      else navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511527844068-006b95d162c2?q=80&w=1920"
          alt="Taxi Driver"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 "></div>
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">
            Tham gia ngay
          </h1>
          <p className="text-xl text-white/80 mb-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
            Trở thành thành viên của TaxiGo
          </p>
          <div className="space-y-4 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                📱
              </div>
              <span>Đặt xe mọi lúc mọi nơi</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                💵
              </div>
              <span>Thu nhập hấp dẫn cho tài xế</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                🛡️
              </div>
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

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Tạo tài khoản</h2>
              <p className="text-gray-500 mt-2">Tham gia cùng TaxiGo ngay hôm nay</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in">
                <span className="text-red-500 flex-shrink-0">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'CUSTOMER' })}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    form.role === 'CUSTOMER'
                      ? 'border-green-500 bg-green-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">🧑</span>
                  <span className={`text-sm font-medium ${form.role === 'CUSTOMER' ? 'text-green-700' : 'text-gray-600'}`}>
                    Khách hàng
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'DRIVER' })}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    form.role === 'DRIVER'
                      ? 'border-green-500 bg-green-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">🚗</span>
                  <span className={`text-sm font-medium ${form.role === 'DRIVER' ? 'text-green-700' : 'text-gray-600'}`}>
                    Tài xế
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    placeholder="username"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    minLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none pr-12"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 transition-all duration-300 focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo tài khoản</span>
                    <span>🚀</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
