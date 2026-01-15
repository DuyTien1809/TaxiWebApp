import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreeToRules, updateDriverProfile, getDriverProfile } from '../../services/api';

const RULES = [
  'Luôn giữ thái độ lịch sự, thân thiện với khách hàng',
  'Đảm bảo xe sạch sẽ, gọn gàng trước mỗi chuyến đi',
  'Tuân thủ luật giao thông, không vượt đèn đỏ, không chạy quá tốc độ',
  'Không sử dụng điện thoại khi đang lái xe',
  'Không hút thuốc, uống rượu bia khi làm việc',
  'Đón khách đúng giờ, không để khách chờ quá 5 phút',
  'Hỗ trợ khách hàng với hành lý khi cần thiết',
  'Không từ chối chuyến đi vô lý, không yêu cầu thêm tiền ngoài giá hiển thị',
  'Bảo mật thông tin cá nhân của khách hàng',
  'Báo cáo ngay cho hệ thống khi có sự cố xảy ra'
];

const VEHICLE_TYPES = [
  { value: 'XE_MAY', label: 'Xe máy' },
  { value: 'XE_4_CHO', label: 'Xe 4 chỗ' },
  { value: 'XE_7_CHO', label: 'Xe 7 chỗ' }
];

export default function DriverOnboarding({ user, setUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: rules, 2: profile, 3: waiting
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedRules, setAgreedRules] = useState(false);
  
  const [form, setForm] = useState({
    birthday: '',
    address: '',
    idNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicleType: 'XE_4_CHO',
    vehicleBrand: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleYear: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await getDriverProfile();
      const driver = data.user;
      
      // Xác định step dựa trên trạng thái
      if (driver.driverApprovalStatus === 'APPROVED') {
        navigate('/driver');
        return;
      }
      
      if (!driver.agreedToRules) {
        setStep(1);
      } else if (!driver.driverInfo?.idNumber) {
        setStep(2);
      } else {
        setStep(3);
      }

      // Load existing data
      if (driver.driverInfo) {
        setForm({
          birthday: driver.birthday ? driver.birthday.split('T')[0] : '',
          address: driver.address || '',
          idNumber: driver.driverInfo.idNumber || '',
          licenseNumber: driver.driverInfo.licenseNumber || '',
          licenseExpiry: driver.driverInfo.licenseExpiry ? driver.driverInfo.licenseExpiry.split('T')[0] : '',
          vehicleType: driver.driverInfo.vehicleType || 'XE_4_CHO',
          vehicleBrand: driver.driverInfo.vehicleBrand || '',
          vehicleModel: driver.driverInfo.vehicleModel || '',
          vehiclePlate: driver.driverInfo.vehiclePlate || '',
          vehicleYear: driver.driverInfo.vehicleYear || '',
          emergencyContact: driver.driverInfo.emergencyContact || '',
          emergencyPhone: driver.driverInfo.emergencyPhone || ''
        });
      }
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgreeRules = async () => {
    if (!agreedRules) {
      setError('Vui lòng đọc và đồng ý với nội quy');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      await agreeToRules();
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate
    if (!form.idNumber || !form.licenseNumber || !form.vehiclePlate) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      setSubmitting(false);
      return;
    }

    try {
      await updateDriverProfile({
        birthday: form.birthday,
        address: form.address,
        driverInfo: {
          idNumber: form.idNumber,
          licenseNumber: form.licenseNumber,
          licenseExpiry: form.licenseExpiry,
          vehicleType: form.vehicleType,
          vehicleBrand: form.vehicleBrand,
          vehicleModel: form.vehicleModel,
          vehiclePlate: form.vehiclePlate,
          vehicleYear: form.vehicleYear ? parseInt(form.vehicleYear) : null,
          emergencyContact: form.emergencyContact,
          emergencyPhone: form.emergencyPhone
        }
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Đăng ký tài xế</h1>
          <p className="text-gray-500 mt-2">Xin chào, {user?.name}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {s === 3 ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 px-4">
          <span className={`text-sm ${step >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>Nội quy</span>
          <span className={`text-sm ${step >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>Hồ sơ</span>
          <span className={`text-sm ${step >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>Chờ duyệt</span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Rules */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Nội quy tài xế</h2>
            <p className="text-gray-600 mb-4">Vui lòng đọc kỹ và đồng ý với các nội quy sau:</p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-80 overflow-y-auto">
              <ol className="space-y-3">
                {RULES.map((rule, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>

            <label className="flex items-center gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedRules}
                onChange={(e) => setAgreedRules(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">Tôi đã đọc và đồng ý với tất cả nội quy trên</span>
            </label>

            <button
              onClick={handleAgreeRules}
              disabled={submitting || !agreedRules}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
          </div>
        )}

        {/* Step 2: Profile Form */}
        {step === 2 && (
          <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📝 Thông tin cá nhân</h2>
            
            {/* Personal Info */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">👤</span> Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(e) => setForm({...form, birthday: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({...form, address: e.target.value})}
                    placeholder="Nhập địa chỉ"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* ID & License */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🪪</span> Giấy tờ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Số CMND/CCCD <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.idNumber}
                    onChange={(e) => setForm({...form, idNumber: e.target.value})}
                    placeholder="Nhập số CMND/CCCD"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Số bằng lái xe <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={(e) => setForm({...form, licenseNumber: e.target.value})}
                    placeholder="Nhập số bằng lái"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ngày hết hạn bằng lái</label>
                  <input
                    type="date"
                    value={form.licenseExpiry}
                    onChange={(e) => setForm({...form, licenseExpiry: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🚗</span> Thông tin xe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Loại xe <span className="text-red-500">*</span></label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({...form, vehicleType: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {VEHICLE_TYPES.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Biển số xe <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.vehiclePlate}
                    onChange={(e) => setForm({...form, vehiclePlate: e.target.value.toUpperCase()})}
                    placeholder="VD: 51A-12345"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hãng xe</label>
                  <input
                    type="text"
                    value={form.vehicleBrand}
                    onChange={(e) => setForm({...form, vehicleBrand: e.target.value})}
                    placeholder="VD: Toyota, Honda..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Dòng xe</label>
                  <input
                    type="text"
                    value={form.vehicleModel}
                    onChange={(e) => setForm({...form, vehicleModel: e.target.value})}
                    placeholder="VD: Vios, City..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Năm sản xuất</label>
                  <input
                    type="number"
                    value={form.vehicleYear}
                    onChange={(e) => setForm({...form, vehicleYear: e.target.value})}
                    placeholder="VD: 2020"
                    min="2000"
                    max="2026"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">📞</span> Liên hệ khẩn cấp
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tên người liên hệ</label>
                  <input
                    type="text"
                    value={form.emergencyContact}
                    onChange={(e) => setForm({...form, emergencyContact: e.target.value})}
                    placeholder="Nhập tên"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({...form, emergencyPhone: e.target.value})}
                    placeholder="Nhập số điện thoại"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi hồ sơ'}
            </button>
          </form>
        )}

        {/* Step 3: Waiting */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⏳</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Hồ sơ đang chờ duyệt</h2>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã đăng ký làm tài xế. Hồ sơ của bạn đang được xem xét. 
              Chúng tôi sẽ thông báo khi có kết quả.
            </p>
            
            {user?.rejectionReason && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                <p className="text-red-700 font-medium mb-1">Hồ sơ bị từ chối</p>
                <p className="text-red-600 text-sm">Lý do: {user.rejectionReason}</p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-3 text-indigo-600 font-medium text-sm hover:underline"
                >
                  Cập nhật hồ sơ →
                </button>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={loadProfile}
                className="px-6 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200"
              >
                Kiểm tra trạng thái
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
