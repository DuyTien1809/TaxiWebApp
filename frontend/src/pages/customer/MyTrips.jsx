import { useState, useEffect } from 'react';
import { getBookings, cancelBooking, createPayment } from '../../services/api';
import GoogleMap from '../../components/GoogleMap';

const statusConfig = {
  MOI_TAO: { text: 'Đang tìm tài xế', color: 'bg-amber-100 text-amber-700', icon: '🔍', pulse: true },
  DA_NHAN: { text: 'Tài xế đang đến', color: 'bg-blue-100 text-blue-700', icon: '🚗', pulse: true },
  DANG_CHAY: { text: 'Đang di chuyển', color: 'bg-purple-100 text-purple-700', icon: '🛣️', pulse: true },
  HOAN_THANH: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: '✅', pulse: false },
  HUY: { text: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: '❌', pulse: false },
};

export default function MyTrips() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  useEffect(() => {
    fetchBookings();
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

  const handlePayment = async (method) => {
    setPaymentLoading(true);
    try {
      await createPayment({ bookingId: paymentModal._id, method });
      setPaymentModal(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setPaymentLoading(false);
    }
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
                    {b.status === 'HOAN_THANH' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPaymentModal(b); }}
                        className="flex-1 py-2 px-4 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>💳</span> Thanh toán
                      </button>
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
                  <GoogleMap
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center">
              <span className="text-5xl block mb-2">💳</span>
              <h3 className="text-2xl font-bold">Thanh toán</h3>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 mb-1">Số tiền cần thanh toán</p>
                <p className="text-4xl font-bold text-gray-800">{paymentModal.price.toLocaleString()}đ</p>
              </div>
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
                <button
                  onClick={() => handlePayment('ONLINE')}
                  disabled={paymentLoading}
                  className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-4 transition-colors disabled:opacity-50"
                >
                  <span className="text-3xl">💳</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Online</p>
                    <p className="text-sm text-gray-500">Thanh toán qua ví điện tử</p>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentModal(null)}
                  className="w-full p-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
