import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, acceptBooking, completeBooking, setDriverFree, setDriverBusy, getEarningSummary, updateDriverLocation, rejectBooking, getDriverProfile } from '../../services/api';
import api from '../../services/api';
import LeafletMap from '../../components/LeafletMap';

const statusConfig = {
  MOI_TAO: { text: 'Chờ nhận', color: 'bg-amber-100 text-amber-700' },
  DA_NHAN: { text: 'Đã nhận', color: 'bg-blue-100 text-blue-700' },
  DANG_CHAY: { text: 'Đang chạy', color: 'bg-purple-100 text-purple-700' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  HUY: { text: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState('RANH');
  const [activeBooking, setActiveBooking] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed' | 'earnings'
  const [earningData, setEarningData] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading' | 'granted' | 'denied'
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  // Kiểm tra trạng thái duyệt tài xế
  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        const { data } = await getDriverProfile();
        if (data.user.driverApprovalStatus !== 'APPROVED') {
          navigate('/driver/onboarding');
        }
      } catch (err) {
        console.error('Check approval error:', err);
      }
    };
    checkApprovalStatus();
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const { data } = await getBookings();
      setBookings(data.bookings);
      const active = data.bookings.find(b => 
        (b.driverId?._id === user.id || b.driverId === user.id) && 
        ['DA_NHAN', 'DANG_CHAY'].includes(b.status)
      );
      setActiveBooking(active);
      if (active) setDriverStatus('BAN');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const { data } = await getEarningSummary();
      setEarningData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Lấy và cập nhật vị trí tài xế
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          setLocationStatus('granted');
          // Gửi vị trí lên server
          try {
            await updateDriverLocation(loc);
          } catch (err) {
            console.error('Error updating location:', err);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationStatus('denied');
        },
        { enableHighAccuracy: true }
      );
      
      // Theo dõi vị trí liên tục
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          // Cập nhật vị trí lên server mỗi 30 giây
          if (activeBooking) {
            api.put(`/bookings/${activeBooking._id}/vi-tri`, loc).catch(console.error);
          }
          // Cập nhật vị trí tài xế
          try {
            await updateDriverLocation(loc);
          } catch (err) {
            console.error('Error updating location:', err);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 30000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationStatus('denied');
    }
  }, [activeBooking]);

  useEffect(() => {
    fetchBookings();
    fetchEarnings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (id) => {
    setActionLoading(true);
    try {
      const { data } = await acceptBooking(id);
      setActiveBooking(data.booking);
      setDriverStatus('BAN');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Nhận chuyến thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      await api.put(`/bookings/${activeBooking._id}/bat-dau`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Bắt đầu chuyến thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async () => {
    setActionLoading(true);
    try {
      await rejectBooking(activeBooking._id, rejectReason);
      setActiveBooking(null);
      setDriverStatus('RANH');
      setShowRejectModal(false);
      setRejectReason('');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Từ chối chuyến thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeBooking(activeBooking._id);
      setActiveBooking(null);
      setDriverStatus('RANH');
      fetchBookings();
      fetchEarnings();
    } catch (err) {
      alert(err.response?.data?.message || 'Hoàn thành thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCashPayment = async (bookingId) => {
    setConfirmingPayment(bookingId);
    try {
      await api.put(`/payments/${bookingId}/xac-nhan-tien-mat`);
      alert('Xác nhận nhận tiền thành công!');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Xác nhận thất bại');
    } finally {
      setConfirmingPayment(null);
    }
  };

  const toggleStatus = async () => {
    try {
      if (driverStatus === 'RANH') {
        await setDriverBusy(user.id);
        setDriverStatus('BAN');
      } else {
        await setDriverFree(user.id);
        setDriverStatus('RANH');
      }
    } catch (err) {
      alert('Cập nhật trạng thái thất bại');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'MOI_TAO');
  const completedBookings = bookings.filter(b => 
    b.status === 'HOAN_THANH' && 
    (b.driverId?._id === user.id || b.driverId === user.id)
  );
  const pendingCashPayments = bookings.filter(b => 
    b.status === 'HOAN_THANH' && 
    b.paymentStatus === 'CHO_XAC_NHAN' &&
    b.paymentMethod === 'TIEN_MAT' &&
    (b.driverId?._id === user.id || b.driverId === user.id)
  );

  // Active Trip View
  if (activeBooking) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="relative h-[55vh]">
          <LeafletMap
            key={activeBooking._id}
            pickup={activeBooking.pickup}
            dropoff={activeBooking.dropoff}
            driverLocation={currentLocation}
            showRoute={true}
            height="100%"
          />
          <div className="absolute top-4 left-4 right-4">
            <div className="glass rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${activeBooking.status === 'DA_NHAN' ? 'bg-blue-500' : 'bg-purple-500'} animate-pulse`}></div>
                <span className="font-semibold text-gray-800">
                  {activeBooking.status === 'DA_NHAN' ? 'Đang đến đón khách' : 'Đang di chuyển'}
                </span>
              </div>
              <span className="font-bold text-green-600 text-lg">{activeBooking.price.toLocaleString()}đ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 min-h-[50vh] p-6 animate-slide-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {activeBooking.customerId?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">{activeBooking.customerId?.name}</h3>
              <a href={`tel:${activeBooking.customerId?.phone}`} className="text-indigo-600 font-medium flex items-center gap-2">
                <span>📞</span> {activeBooking.customerId?.phone}
              </a>
            </div>
            <a href={`tel:${activeBooking.customerId?.phone}`} className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg hover:bg-green-600 transition-colors">📞</a>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white"><div className="w-3 h-3 bg-white rounded-full"></div></div>
              <div><p className="text-xs text-green-600 font-medium mb-1">ĐIỂM ĐÓN</p><p className="text-gray-800 font-medium">{activeBooking.pickup?.address}</p></div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white"><div className="w-3 h-3 bg-white rounded-full"></div></div>
              <div><p className="text-xs text-red-600 font-medium mb-1">ĐIỂM ĐẾN</p><p className="text-gray-800 font-medium">{activeBooking.dropoff?.address}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-gray-800">{(activeBooking.distance / 1000).toFixed(1)}</p><p className="text-xs text-gray-500">km</p></div>
            <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-gray-800">{Math.round(activeBooking.duration / 60)}</p><p className="text-xs text-gray-500">phút</p></div>
            <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-2xl font-bold text-green-600">{(activeBooking.price / 1000).toFixed(0)}k</p><p className="text-xs text-gray-500">VND</p></div>
          </div>

          {activeBooking.status === 'DA_NHAN' ? (
            <div className="space-y-3">
              <button onClick={handleStartTrip} disabled={actionLoading} className="w-full py-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
                {actionLoading ? <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg> : <><span>🚀</span><span>Đã đón khách - Bắt đầu chuyến</span></>}
              </button>
              <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className="w-full py-4 bg-white border-2 border-red-400 text-red-500 rounded-2xl font-bold text-lg hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-3 transition-colors">
                <span>✕</span><span>Từ chối chuyến</span>
              </button>
            </div>
          ) : (
            <button onClick={handleComplete} disabled={actionLoading} className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-3">
              {actionLoading ? <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg> : <><span>✅</span><span>Hoàn thành chuyến</span></>}
            </button>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-slide-in">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Từ chối chuyến?</h3>
                <p className="text-gray-500 mt-2">Chuyến sẽ được gửi đến tài xế khác</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lý do từ chối (không bắt buộc)</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none transition-colors"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Quá xa điểm đón">Quá xa điểm đón</option>
                  <option value="Kẹt xe, không thể đến">Kẹt xe, không thể đến</option>
                  <option value="Xe gặp sự cố">Xe gặp sự cố</option>
                  <option value="Khách không liên lạc được">Khách không liên lạc được</option>
                  <option value="Lý do cá nhân">Lý do cá nhân</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRejectBooking}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  ) : (
                    <>Xác nhận từ chối</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">🚗</span>
              Tài xế Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Xin chào, {user.name}!</p>
          </div>
          <button onClick={toggleStatus} className={`px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg ${driverStatus === 'RANH' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'}`}>
            <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
            {driverStatus === 'RANH' ? 'Đang rảnh' : 'Đang bận'}
          </button>
        </div>

        {/* Today Stats */}
        {earningData && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 mb-6 text-white shadow-xl animate-fade-in">
            <p className="text-white/70 text-sm mb-2">Thu nhập hôm nay</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold">{earningData.todayStats.total.toLocaleString()}đ</p>
                <p className="text-white/70 text-sm mt-1">{earningData.todayStats.trips} chuyến • {(earningData.todayStats.distance / 1000).toFixed(1)} km</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/70">Tiền cuốc: {earningData.todayStats.fare.toLocaleString()}đ</p>
                <p className="text-sm text-white/70">Thực nhận: {earningData.todayStats.netEarning.toLocaleString()}đ</p>
                {earningData.todayStats.tip > 0 && <p className="text-sm text-yellow-300">Tip: +{earningData.todayStats.tip.toLocaleString()}đ</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-lg">
          <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'pending' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            Chờ nhận ({pendingBookings.length})
          </button>
          <button onClick={() => setActiveTab('completed')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'completed' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            Đã hoàn thành ({completedBookings.length})
          </button>
          <button onClick={() => setActiveTab('earnings')} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'earnings' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
            Thu nhập
          </button>
        </div>

        {/* Location Warning */}
        {locationStatus === 'denied' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 animate-fade-in">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-medium text-amber-800">Chưa bật định vị</p>
              <p className="text-sm text-amber-600">Vui lòng bật định vị để nhận đơn hàng gần bạn (trong bán kính 15km)</p>
            </div>
          </div>
        )}

        {/* Pending Cash Payments Alert */}
        {pendingCashPayments.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2"><span>💵</span> Chờ xác nhận tiền mặt</h2>
            <div className="space-y-3">
              {pendingCashPayments.map((b) => (
                <div key={b._id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{b.customerId?.name}</p>
                    <p className="text-sm text-gray-500">{b.pickup?.address?.substring(0, 30)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{b.price.toLocaleString()}đ</p>
                    <button onClick={() => handleConfirmCashPayment(b._id)} disabled={confirmingPayment === b._id} className="mt-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
                      {confirmingPayment === b._id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>✅ Đã nhận tiền</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Pending */}
        {activeTab === 'pending' && (
          <div className="animate-fade-in">
            {pendingBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-5xl">🔍</span></div>
                <p className="text-gray-500 text-lg">Không có chuyến nào đang chờ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map((b, index) => (
                  <div key={b._id} className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="grid md:grid-cols-2">
                      <div className="p-5">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-green-500 rounded-full"></div></div>
                            <p className="text-sm text-gray-600">{b.pickup?.address}</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"><div className="w-2 h-2 bg-red-500 rounded-full"></div></div>
                            <p className="text-sm text-gray-600">{b.dropoff?.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>📏 {(b.distance / 1000).toFixed(1)} km</span>
                            <span>⏱️ {Math.round(b.duration / 60)} phút</span>
                            {b.distanceToPickup !== undefined && (
                              <span className="text-indigo-600 font-medium">📍 Cách {b.distanceToPickup.toFixed(1)} km</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-green-600">{b.price.toLocaleString()}đ</span>
                          <button onClick={() => handleAccept(b._id)} disabled={actionLoading} className="btn-primary disabled:opacity-50">Nhận chuyến</button>
                        </div>
                      </div>
                      <div className="hidden md:block h-[250px]">
                        <LeafletMap key={b._id} pickup={b.pickup} dropoff={b.dropoff} showRoute={true} height="100%" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Completed */}
        {activeTab === 'completed' && (
          <div className="animate-fade-in">
            {completedBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-5xl">📋</span></div>
                <p className="text-gray-500 text-lg">Chưa có chuyến hoàn thành</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedBookings.map((b, index) => (
                  <div key={b._id} className="bg-white rounded-2xl shadow-lg p-4 animate-fade-in" style={{animationDelay: `${index * 0.05}s`}}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><span className="text-lg">✅</span></div>
                        <div>
                          <p className="font-medium text-gray-800">{b.customerId?.name}</p>
                          <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{b.price.toLocaleString()}đ</p>
                        <span className={`text-xs px-2 py-1 rounded-lg ${b.paymentMethod === 'CHUYEN_KHOAN' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {b.paymentMethod === 'CHUYEN_KHOAN' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">●</span>
                        <p className="text-gray-600 line-clamp-1">{b.pickup?.address}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-500">●</span>
                        <p className="text-gray-600 line-clamp-1">{b.dropoff?.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-3 pt-3 border-t text-sm text-gray-500">
                      <span>📏 {(b.distance / 1000).toFixed(1)} km</span>
                      <span>⏱️ {Math.round(b.duration / 60)} phút</span>
                      <span className={`ml-auto ${b.paymentStatus === 'DA_THANH_TOAN' ? 'text-green-600' : 'text-amber-600'}`}>
                        {b.paymentStatus === 'DA_THANH_TOAN' ? '✅ Đã thanh toán' : '⏳ Chờ xác nhận'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Earnings */}
        {activeTab === 'earnings' && earningData && (
          <div className="animate-fade-in space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <p className="text-gray-500 text-sm">Tổng chuyến</p>
                <p className="text-3xl font-bold text-indigo-600">{earningData.summary.totalTrips}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <p className="text-gray-500 text-sm">Tổng km</p>
                <p className="text-3xl font-bold text-blue-600">{(earningData.summary.totalDistance / 1000).toFixed(1)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <p className="text-gray-500 text-sm">Tiền cuốc</p>
                <p className="text-2xl font-bold text-gray-800">{earningData.summary.totalFare.toLocaleString()}đ</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <p className="text-gray-500 text-sm">Thực nhận</p>
                <p className="text-2xl font-bold text-green-600">{earningData.summary.totalEarning.toLocaleString()}đ</p>
              </div>
            </div>

            {/* Earning Breakdown */}
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4">📊 Chi tiết thu nhập</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">💰 Tiền cuốc xe (khách trả)</span>
                  <span className="font-semibold">{earningData.summary.totalFare.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b text-red-600">
                  <span>📉 Chiết khấu nền tảng ({earningData.summary.platformFeePercent}%)</span>
                  <span className="font-semibold">-{earningData.summary.totalPlatformFee.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">💵 Thu nhập sau chiết khấu</span>
                  <span className="font-semibold">{earningData.summary.totalNetEarning.toLocaleString()}đ</span>
                </div>
                {earningData.summary.totalBonus > 0 && (
                  <div className="flex justify-between items-center py-2 border-b text-purple-600">
                    <span>🎁 Tiền thưởng</span>
                    <span className="font-semibold">+{earningData.summary.totalBonus.toLocaleString()}đ</span>
                  </div>
                )}
                {earningData.summary.totalTip > 0 && (
                  <div className="flex justify-between items-center py-2 border-b text-yellow-600">
                    <span>💝 Tiền tip từ khách</span>
                    <span className="font-semibold">+{earningData.summary.totalTip.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-xl px-3 mt-2">
                  <span className="font-bold text-green-700">✅ TỔNG THU NHẬP THỰC NHẬN</span>
                  <span className="font-bold text-xl text-green-700">{earningData.summary.totalEarning.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            {/* 7 Days Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4">📈 Thu nhập 7 ngày qua</h3>
              <div className="flex items-end justify-between gap-2 h-40">
                {earningData.last7Days.map((day, i) => {
                  const maxEarning = Math.max(...earningData.last7Days.map(d => d.earning), 1);
                  const height = (day.earning / maxEarning) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <p className="text-xs text-gray-500 mb-1">{day.trips} chuyến</p>
                      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{height: '100px'}}>
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all" style={{height: `${height}%`}}></div>
                      </div>
                      <p className="text-xs font-medium text-gray-600 mt-2">{day.dayName}</p>
                      <p className="text-xs text-gray-400">{(day.earning / 1000).toFixed(0)}k</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Earnings */}
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h3 className="font-bold text-gray-800 mb-4">📋 Chi tiết từng chuyến</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {earningData.earnings.slice(0, 10).map((e, i) => (
                  <div key={e._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{e.bookingId?.pickup?.address?.substring(0, 25)}...</p>
                      <p className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleString('vi-VN')}</p>
                      <p className="text-xs text-gray-500">{(e.distance / 1000).toFixed(1)} km • {Math.round(e.duration / 60)} phút</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 line-through">{e.fareAmount.toLocaleString()}đ</p>
                      <p className="font-bold text-green-600">{e.totalEarning.toLocaleString()}đ</p>
                      {e.tip > 0 && <p className="text-xs text-yellow-600">+{e.tip.toLocaleString()}đ tip</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
