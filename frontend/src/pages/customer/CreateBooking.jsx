import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking, getWallet, linkBankAccount, topUpWallet, calculatePrice as calculatePriceAPI } from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import LeafletMap from '../../components/LeafletMap';

const BANKS = [
  'Vietcombank', 'BIDV', 'Agribank', 'Techcombank', 'VPBank',
  'MB Bank', 'ACB', 'Sacombank', 'TPBank', 'VIB'
];

export default function CreateBooking() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectMode, setSelectMode] = useState(null);
  const navigate = useNavigate();

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await getWallet();
      setWallet(data.wallet);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    }
  };

  const calculatePrice = async (distanceMeters) => {
    try {
      const { data } = await calculatePriceAPI(distanceMeters);
      return data.totalPrice;
    } catch (err) {
      console.error('Error calculating price:', err);
      // Fallback to default calculation
      const km = distanceMeters / 1000;
      return Math.round((10000 + km * 10000) / 1000) * 1000;
    }
  };

  const handleRouteCalculated = async (info) => {
    const price = await calculatePrice(info.distance);
    setRouteInfo({
      ...info,
      price
    });
  };

  const handleMapClick = (location, mode) => {
    if (mode === 'pickup') setPickup(location);
    else if (mode === 'dropoff') setDropoff(location);
    setSelectMode(null);
  };

  const handleProceedToPayment = () => {
    if (!pickup || !dropoff || !routeInfo) {
      setError('Vui lòng chọn điểm đón và điểm đến');
      return;
    }
    setError('');
    setShowPaymentModal(true);
  };

  const handleLinkBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setWalletLoading(true);
    try {
      const { data } = await linkBankAccount(bankForm);
      setWallet(data.wallet);
      setShowLinkBank(false);
      setBankForm({ bankName: '', accountNumber: '', accountHolder: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Liên kết thất bại');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    if (!amount || amount < 10000) {
      setError('Số tiền nạp tối thiểu 10,000đ');
      return;
    }
    setWalletLoading(true);
    try {
      const { data } = await topUpWallet({ amount });
      setWallet(data.wallet);
      setShowTopUp(false);
      setTopUpAmount('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Nạp tiền thất bại');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!paymentMethod) {
      setError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (paymentMethod === 'CHUYEN_KHOAN') {
      if (!wallet?.isLinked) {
        setError('Vui lòng liên kết tài khoản ngân hàng');
        return;
      }
      if (wallet.balance < routeInfo.price) {
        setError(`Số dư không đủ. Cần ${routeInfo.price.toLocaleString()}đ, hiện có ${wallet.balance.toLocaleString()}đ`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      await createBooking({
        pickup,
        dropoff,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        price: routeInfo.price,
        paymentMethod
      });
      setSuccess(true);
      setTimeout(() => navigate('/customer/trips'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt xe thất bại');
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentMethod(null);
    setShowLinkBank(false);
    setShowTopUp(false);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              🚕
            </span>
            Đặt xe
          </h1>
          <p className="text-gray-500 mt-2 ml-15">Chọn điểm đón và điểm đến của bạn</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">✅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Đặt xe thành công!</h3>
              <p className="text-gray-500">Đang chuyển đến trang theo dõi...</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Pickup */}
            <div className="bg-white rounded-2xl p-5 shadow-lg card-hover animate-fade-in relative z-30" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Điểm đón</p>
                    <p className="text-xs text-gray-400">Bạn đang ở đâu?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectMode(selectMode === 'pickup' ? null : 'pickup')}
                  className={`p-2 rounded-lg transition-all ${
                    selectMode === 'pickup' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                  }`}
                  title="Chọn trên bản đồ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <LocationPicker placeholder="Tìm địa chỉ đón..." onSelect={setPickup} value={pickup} />
              {pickup && <p className="mt-2 text-sm text-gray-500 truncate">📍 {pickup.address}</p>}
            </div>

            {/* Dropoff */}
            <div className="bg-white rounded-2xl p-5 shadow-lg card-hover animate-fade-in relative z-20" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Điểm đến</p>
                    <p className="text-xs text-gray-400">Bạn muốn đến đâu?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectMode(selectMode === 'dropoff' ? null : 'dropoff')}
                  className={`p-2 rounded-lg transition-all ${
                    selectMode === 'dropoff' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                  }`}
                  title="Chọn trên bản đồ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <LocationPicker placeholder="Tìm địa chỉ đến..." onSelect={setDropoff} value={dropoff} />
              {dropoff && <p className="mt-2 text-sm text-gray-500 truncate">🎯 {dropoff.address}</p>}
            </div>

            {/* Route Info */}
            {routeInfo && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl animate-fade-in" style={{animationDelay: '0.3s'}}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <p className="text-white/70 text-xs mb-1">Khoảng cách</p>
                    <p className="text-xl font-bold">{routeInfo.distanceText}</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <p className="text-white/70 text-xs mb-1">Thời gian</p>
                    <p className="text-xl font-bold">{routeInfo.durationText}</p>
                  </div>
                </div>
                <div className="bg-white/20 rounded-xl p-4 text-center">
                  <p className="text-white/70 text-sm mb-1">Tổng tiền</p>
                  <p className="text-3xl font-bold">{routeInfo.price.toLocaleString()}đ</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && !showPaymentModal && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={!pickup || !dropoff || loading}
              className="w-full btn-success py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 animate-fade-in"
              style={{animationDelay: '0.4s'}}
            >
              <span className="text-2xl">💳</span>
              <span>Chọn thanh toán & Đặt xe</span>
            </button>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-3 animate-fade-in relative z-10" style={{animationDelay: '0.2s'}}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[550px] lg:h-[650px]">
              <LeafletMap
                pickup={pickup}
                dropoff={dropoff}
                showRoute={pickup && dropoff}
                onRouteCalculated={handleRouteCalculated}
                onMapClick={handleMapClick}
                selectMode={selectMode}
                height="100%"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center">
              <span className="text-5xl block mb-2">💳</span>
              <h3 className="text-2xl font-bold">Chọn phương thức thanh toán</h3>
              <p className="text-white/80 mt-1">Tổng tiền: {routeInfo?.price.toLocaleString()}đ</p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {/* Link Bank Form */}
              {showLinkBank && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl space-y-3">
                  <h4 className="font-semibold text-gray-800">🏦 Liên kết tài khoản ngân hàng</h4>
                  <select
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn ngân hàng</option>
                    {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Số tài khoản"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Tên chủ tài khoản"
                    value={bankForm.accountHolder}
                    onChange={(e) => setBankForm({...bankForm, accountHolder: e.target.value})}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowLinkBank(false)} className="flex-1 py-2 bg-gray-100 rounded-xl">Hủy</button>
                    <button onClick={handleLinkBank} disabled={walletLoading} className="flex-1 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-50">
                      {walletLoading ? 'Đang xử lý...' : 'Liên kết'}
                    </button>
                  </div>
                </div>
              )}

              {/* Top Up Form */}
              {showTopUp && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl space-y-3">
                  <h4 className="font-semibold text-gray-800">💰 Nạp tiền vào ví</h4>
                  <input
                    type="number"
                    placeholder="Số tiền nạp (VNĐ)"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {[50000, 100000, 200000, 500000].map(amt => (
                      <button key={amt} onClick={() => setTopUpAmount(amt.toString())} className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-green-100">
                        {amt.toLocaleString()}đ
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowTopUp(false)} className="flex-1 py-2 bg-gray-100 rounded-xl">Hủy</button>
                    <button onClick={handleTopUp} disabled={walletLoading} className="flex-1 py-2 bg-green-500 text-white rounded-xl disabled:opacity-50">
                      {walletLoading ? 'Đang xử lý...' : 'Nạp tiền'}
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {!showLinkBank && !showTopUp && (
                <div className="space-y-3">
                  {/* Cash */}
                  <button
                    onClick={() => { setPaymentMethod('TIEN_MAT'); setError(''); }}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all border-2 ${
                      paymentMethod === 'TIEN_MAT' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    <span className="text-3xl">💵</span>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-800">Tiền mặt</p>
                      <p className="text-sm text-gray-500">Thanh toán trực tiếp cho tài xế</p>
                    </div>
                    {paymentMethod === 'TIEN_MAT' && <span className="text-amber-500 text-xl">✓</span>}
                  </button>

                  {/* Bank Transfer */}
                  <div className={`rounded-xl border-2 transition-all ${
                    paymentMethod === 'CHUYEN_KHOAN' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <button
                      onClick={() => { setPaymentMethod('CHUYEN_KHOAN'); setError(''); }}
                      className="w-full p-4 flex items-center gap-4"
                    >
                      <span className="text-3xl">🏦</span>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-800">Chuyển khoản (Ví liên kết)</p>
                        <p className="text-sm text-gray-500">
                          {wallet?.isLinked 
                            ? `Số dư: ${wallet.balance.toLocaleString()}đ` 
                            : 'Chưa liên kết tài khoản'}
                        </p>
                      </div>
                      {paymentMethod === 'CHUYEN_KHOAN' && <span className="text-blue-500 text-xl">✓</span>}
                    </button>

                    {/* Wallet Info */}
                    {paymentMethod === 'CHUYEN_KHOAN' && (
                      <div className="px-4 pb-4 space-y-2">
                        {wallet?.isLinked ? (
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">{wallet.bankAccount.bankName}</span> - {wallet.bankAccount.accountNumber}
                            </p>
                            <p className="text-sm text-gray-500">{wallet.bankAccount.accountHolder}</p>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => setShowTopUp(true)} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                + Nạp tiền
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowLinkBank(true)} className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200">
                            + Liên kết tài khoản ngân hàng
                          </button>
                        )}
                        {wallet?.isLinked && wallet.balance < (routeInfo?.price || 0) && (
                          <p className="text-xs text-red-500">⚠️ Số dư không đủ, vui lòng nạp thêm</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!showLinkBank && !showTopUp && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!paymentMethod || loading || (paymentMethod === 'CHUYEN_KHOAN' && (!wallet?.isLinked || wallet.balance < routeInfo?.price))}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>🚗</span>
                        <span>Xác nhận đặt xe</span>
                      </>
                    )}
                  </button>
                  <button onClick={closePaymentModal} className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors">
                    Quay lại
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
