import { useState, useEffect } from 'react';
import { getBookings, cancelBooking, createPayment, getWallet, linkBankAccount, topUpWallet } from '../../services/api';
import LeafletMap from '../../components/LeafletMap';

const statusConfig = {
  MOI_TAO: { text: 'Đang tìm tài xế', color: 'bg-amber-100 text-amber-700', icon: '🔍', pulse: true },
  DA_NHAN: { text: 'Tài xế đang đến', color: 'bg-blue-100 text-blue-700', icon: '🚗', pulse: true },
  DANG_CHAY: { text: 'Đang di chuyển', color: 'bg-purple-100 text-purple-700', icon: '🛣️', pulse: true },
  HOAN_THANH: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: '✅', pulse: false },
  HUY: { text: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: '❌', pulse: false },
};

const paymentStatusConfig = {
  CHUA_THANH_TOAN: { text: 'Chưa thanh toán', color: 'bg-red-100 text-red-700', icon: '💰' },
  CHO_XAC_NHAN: { text: 'Chờ tài xế xác nhận', color: 'bg-amber-100 text-amber-700', icon: '⏳' },
  DA_THANH_TOAN: { text: 'Đã thanh toán', color: 'bg-green-100 text-green-700', icon: '✅' },
};

const paymentMethodConfig = {
  TIEN_MAT: { text: 'Tiền mặt', icon: '💵' },
  CHUYEN_KHOAN: { text: 'Chuyển khoản', icon: '🏦' },
};

const BANKS = [
  'Vietcombank', 'BIDV', 'Agribank', 'Techcombank', 'VPBank',
  'MB Bank', 'ACB', 'Sacombank', 'TPBank', 'VIB'
];

export default function MyTrips() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  const [topUpAmount, setTopUpAmount] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const { data } = await getBookings();
      setBookings(data.bookings);
      const active = data.bookings.find(b => ['MOI_TAO', 'DA_NHAN', 'DANG_CHAY'].includes(b.status));
      if (active && !selectedBooking) setSelectedBooking(active);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data } = await getWallet();
      setWallet(data.wallet);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchWallet();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy chuyến?')) return;
    try {
      await cancelBooking(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Hủy thất bại');
    }
  };

  const handleLinkBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setPaymentLoading(true);
    try {
      const { data } = await linkBankAccount(bankForm);
      setWallet(data.wallet);
      setShowLinkBank(false);
      setBankForm({ bankName: '', accountNumber: '', accountHolder: '' });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Liên kết thất bại');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    if (!amount || amount < 10000) {
      setError('Số tiền nạp tối thiểu 10,000đ');
      return;
    }
    setPaymentLoading(true);
    try {
      const { data } = await topUpWallet({ amount });
      setWallet(data.wallet);
      setShowTopUp(false);
      setTopUpAmount('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Nạp tiền thất bại');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = async (method) => {
    if (method === 'CHUYEN_KHOAN') {
      if (!wallet?.isLinked) {
        setError('Vui lòng liên kết tài khoản ngân hàng');
        return;
      }
      if (wallet.balance < paymentModal.price) {
        setError(`Số dư không đủ. Cần ${paymentModal.price.toLocaleString()}đ`);
        return;
      }
    }
    
    setPaymentLoading(true);
    setError('');
    try {
      const { data } = await createPayment({ bookingId: paymentModal._id, method });
      setPaymentResult({
        success: true,
        method,
        message: data.message
      });
      fetchBookings();
      fetchWallet();
    } catch (err) {
      setPaymentResult({
        success: false,
        message: err.response?.data?.message || 'Thanh toán thất bại'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const closePaymentModal = () => {
    setPaymentModal(null);
    setPaymentResult(null);
    setShowLinkBank(false);
    setShowTopUp(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              📋
            </span>
            Chuyến đi của tôi
          </h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Booking List */}
          <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg animate-fade-in">
                <span className="text-6xl block mb-4">🚕</span>
                <p className="text-gray-500">Chưa có chuyến đi nào</p>
              </div>
            ) : (
              bookings.map((b, index) => (
                <div
                  key={b._id}
                  onClick={() => setSelectedBooking(b)}
                  className={`bg-white rounded-2xl p-4 shadow-lg cursor-pointer transition-all duration-300 animate-fade-in ${
                    selectedBooking?._id === b._id 
                      ? 'ring-2 ring-indigo-500 shadow-indigo-100' 
                      : 'hover:shadow-xl hover:-translate-y-1'
                  }`}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className={`badge ${statusConfig[b.status].color} ${statusConfig[b.status].pulse ? 'relative' : ''}`}>
                      {statusConfig[b.status].pulse && (
                        <span className="absolute -left-1 -top-1 w-2 h-2 bg-current rounded-full animate-ping"></span>
                      )}
                      <span>{statusConfig[b.status].icon}</span>
                      <span>{statusConfig[b.status].text}</span>
                    </div>
                    <span className="font-bold text-green-600 text-lg">
                      {b.price.toLocaleString()}đ
                    </span>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-600 line-clamp-1">{b.pickup?.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-600 line-clamp-1">{b.dropoff?.address}</p>
                    </div>
                  </div>

                  {/* Driver Info */}
                  {b.driverId && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {b.driverId.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{b.driverId.name}</p>
                        <p className="text-sm text-blue-600">📞 {b.driverId.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {b.status === 'MOI_TAO' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancel(b._id); }}
                        className="flex-1 py-2 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        Hủy chuyến
                      </button>
                    )}
                    {/* Show payment method badge */}
                    {b.paymentMethod && (
                      <div className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-1 ${
                        b.paymentMethod === 'CHUYEN_KHOAN' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span>{paymentMethodConfig[b.paymentMethod]?.icon}</span>
                        <span>{paymentMethodConfig[b.paymentMethod]?.text}</span>
                      </div>
                    )}
                    {b.status === 'HOAN_THANH' && b.paymentStatus === 'CHO_XAC_NHAN' && (
                      <div className="flex-1 py-2 px-4 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                        <span>⏳</span> Chờ tài xế xác nhận
                      </div>
                    )}
                    {b.status === 'HOAN_THANH' && b.paymentStatus === 'DA_THANH_TOAN' && (
                      <div className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                        <span>✅</span> Đã thanh toán
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Map */}
          <div className="lg:col-span-3 animate-fade-in" style={{animationDelay: '0.2s'}}>
            {selectedBooking ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Trip Info Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/70 text-sm">Chi tiết chuyến đi</p>
                      <p className="font-bold text-lg">{statusConfig[selectedBooking.status].text}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm">Tổng tiền</p>
                      <p className="font-bold text-xl">{selectedBooking.price.toLocaleString()}đ</p>
                    </div>
                  </div>
                </div>

                {/* Map - Tăng kích thước */}
                <div className="h-[500px] lg:h-[550px]">
                  <LeafletMap
                    key={selectedBooking._id}
                    pickup={selectedBooking.pickup}
                    dropoff={selectedBooking.dropoff}
                    driverLocation={selectedBooking.driverLocation}
                    showRoute={true}
                    height="100%"
                  />
                </div>

                {/* Trip Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">📏</span>
                    <span className="text-gray-600">Khoảng cách:</span>
                    <span className="font-medium">{(selectedBooking.distance / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">⏱️</span>
                    <span className="text-gray-600">Thời gian:</span>
                    <span className="font-medium">{Math.round(selectedBooking.duration / 60)} phút</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <span className="text-6xl block mb-4">🗺️</span>
                  <p>Chọn một chuyến để xem bản đồ</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            {paymentResult ? (
              // Kết quả thanh toán
              <div className="p-6 text-center">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  paymentResult.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className="text-5xl">{paymentResult.success ? '✅' : '❌'}</span>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  paymentResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {paymentResult.success ? 'Thành công!' : 'Thất bại!'}
                </h3>
                <p className="text-gray-600 mb-6">{paymentResult.message}</p>
                {paymentResult.success && paymentResult.method === 'TIEN_MAT' && (
                  <div className="bg-amber-50 p-4 rounded-xl mb-4">
                    <p className="text-amber-700 text-sm">
                      💡 Vui lòng thanh toán <strong>{paymentModal.price.toLocaleString()}đ</strong> cho tài xế. 
                      Trạng thái sẽ cập nhật khi tài xế xác nhận.
                    </p>
                  </div>
                )}
                <button
                  onClick={closePaymentModal}
                  className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                >
                  Đóng
                </button>
              </div>
            ) : (
              // Form chọn phương thức
              <>
                <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center">
                  <span className="text-5xl block mb-2">💳</span>
                  <h3 className="text-2xl font-bold">Thanh toán</h3>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-500 mb-1">Số tiền cần thanh toán</p>
                    <p className="text-4xl font-bold text-gray-800">{paymentModal.price.toLocaleString()}đ</p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Link Bank Form */}
                  {showLinkBank && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-xl space-y-3">
                      <h4 className="font-semibold text-gray-800">🏦 Liên kết tài khoản</h4>
                      <select
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                        className="w-full p-3 border rounded-xl"
                      >
                        <option value="">Chọn ngân hàng</option>
                        {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                      </select>
                      <input
                        type="text"
                        placeholder="Số tài khoản"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                        className="w-full p-3 border rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Tên chủ tài khoản"
                        value={bankForm.accountHolder}
                        onChange={(e) => setBankForm({...bankForm, accountHolder: e.target.value})}
                        className="w-full p-3 border rounded-xl"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowLinkBank(false)} className="flex-1 py-2 bg-gray-100 rounded-xl">Hủy</button>
                        <button onClick={handleLinkBank} disabled={paymentLoading} className="flex-1 py-2 bg-blue-500 text-white rounded-xl disabled:opacity-50">
                          {paymentLoading ? 'Đang xử lý...' : 'Liên kết'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Top Up Form */}
                  {showTopUp && (
                    <div className="mb-4 p-4 bg-green-50 rounded-xl space-y-3">
                      <h4 className="font-semibold text-gray-800">💰 Nạp tiền</h4>
                      <input
                        type="number"
                        placeholder="Số tiền nạp"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                        className="w-full p-3 border rounded-xl"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {[50000, 100000, 200000].map(amt => (
                          <button key={amt} onClick={() => setTopUpAmount(amt.toString())} className="px-3 py-1 bg-white border rounded-lg text-sm">
                            {amt.toLocaleString()}đ
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowTopUp(false)} className="flex-1 py-2 bg-gray-100 rounded-xl">Hủy</button>
                        <button onClick={handleTopUp} disabled={paymentLoading} className="flex-1 py-2 bg-green-500 text-white rounded-xl disabled:opacity-50">
                          {paymentLoading ? 'Đang xử lý...' : 'Nạp tiền'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {paymentModal.paymentStatus === 'CHO_XAC_NHAN' ? (
                    <div className="text-center">
                      <div className="bg-amber-50 p-4 rounded-xl mb-4">
                        <span className="text-4xl block mb-2">⏳</span>
                        <p className="text-amber-700 font-medium">Đang chờ tài xế xác nhận</p>
                        <p className="text-amber-600 text-sm mt-1">
                          Bạn đã chọn thanh toán tiền mặt. Vui lòng thanh toán cho tài xế.
                        </p>
                      </div>
                      <button
                        onClick={closePaymentModal}
                        className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  ) : !showLinkBank && !showTopUp && (
                    <div className="space-y-3">
                      <button
                        onClick={() => handlePayment('TIEN_MAT')}
                        disabled={paymentLoading}
                        className="w-full p-4 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-4 transition-colors disabled:opacity-50"
                      >
                        <span className="text-3xl">💵</span>
                        <div className="text-left">
                          <p className="font-semibold text-gray-800">Tiền mặt</p>
                          <p className="text-sm text-gray-500">Thanh toán trực tiếp cho tài xế</p>
                        </div>
                      </button>
                      
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-3xl">🏦</span>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-gray-800">Chuyển khoản</p>
                            <p className="text-sm text-gray-500">
                              {wallet?.isLinked ? `Số dư: ${wallet.balance.toLocaleString()}đ` : 'Chưa liên kết'}
                            </p>
                          </div>
                        </div>
                        {wallet?.isLinked ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600">{wallet.bankAccount.bankName} - {wallet.bankAccount.accountNumber}</p>
                            <div className="flex gap-2">
                              <button onClick={() => setShowTopUp(true)} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg">+ Nạp tiền</button>
                              <button 
                                onClick={() => handlePayment('CHUYEN_KHOAN')} 
                                disabled={paymentLoading || wallet.balance < paymentModal.price}
                                className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                {paymentLoading ? 'Đang xử lý...' : 'Thanh toán'}
                              </button>
                            </div>
                            {wallet.balance < paymentModal.price && (
                              <p className="text-xs text-red-500">⚠️ Số dư không đủ</p>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => setShowLinkBank(true)} className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                            + Liên kết tài khoản
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={closePaymentModal}
                        className="w-full p-3 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
