import { useState, useEffect } from 'react';
import { getBookings, acceptBooking, completeBooking, setDriverFree, setDriverBusy } from '../../services/api';
import api from '../../services/api';
import GoogleMap from '../../components/GoogleMap';

const statusConfig = {
  MOI_TAO: { text: 'Chờ nhận', color: 'bg-amber-100 text-amber-700' },
  DA_NHAN: { text: 'Đã nhận', color: 'bg-blue-100 text-blue-700' },
  DANG_CHAY: { text: 'Đang chạy', color: 'bg-purple-100 text-purple-700' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  HUY: { text: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

export default function DriverDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState('RANH');
  const [activeBooking, setActiveBooking] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

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

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          if (activeBooking) {
            api.put(`/bookings/${activeBooking._id}/vi-tri`, loc).catch(console.error);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeBooking]);

  useEffect(() => {
    fetchBookings();
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

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeBooking(activeBooking._id);
      setActiveBooking(null);
      setDriverStatus('RANH');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Hoàn thành thất bại');
    } finally {
      setActionLoading(false);
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

  // Active Trip View
  if (activeBooking) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Map Full Screen - Tăng kích thước */}
        <div className="relative h-[55vh]">
          <GoogleMap
            key={activeBooking._id}
            pickup={activeBooking.pickup}
            dropoff={activeBooking.dropoff}
            driverLocation={currentLocation}
            showRoute={true}
            height="100%"
          />
          {/* Status Overlay */}
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

        {/* Trip Details Panel */}
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 min-h-[50vh] p-6 animate-slide-in">
          {/* Customer Info */}
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
            <a
              href={`tel:${activeBooking.customerId?.phone}`}
              className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg hover:bg-green-600 transition-colors"
            >
              📞
            </a>
          </div>

          {/* Route Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium mb-1">ĐIỂM ĐÓN</p>
                <p className="text-gray-800 font-medium">{activeBooking.pickup?.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium mb-1">ĐIỂM ĐẾN</p>
                <p className="text-gray-800 font-medium">{activeBooking.dropoff?.address}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{(activeBooking.distance / 1000).toFixed(1)}</p>
              <p className="text-xs text-gray-500">km</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{Math.round(activeBooking.duration / 60)}</p>
              <p className="text-xs text-gray-500">phút</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{(activeBooking.price / 1000).toFixed(0)}k</p>
              <p className="text-xs text-gray-500">VND</p>
            </div>
          </div>

          {/* Action Button */}
          {activeBooking.status === 'DA_NHAN' ? (
            <button
              onClick={handleStartTrip}
              disabled={actionLoading}
              className="w-full py-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {actionLoading ? (
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Đã đón khách - Bắt đầu chuyến</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {actionLoading ? (
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <span>✅</span>
                  <span>Hoàn thành chuyến</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Pending Bookings View
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                🚗
              </span>
              Tài xế Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Xin chào, {user.name}!</p>
          </div>
          <button
            onClick={toggleStatus}
            className={`px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg ${
              driverStatus === 'RANH'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${driverStatus === 'RANH' ? 'bg-white' : 'bg-white'} animate-pulse`}></span>
            {driverStatus === 'RANH' ? 'Đang rảnh' : 'Đang bận'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-lg animate-fade-in" style={{animationDelay: '0.1s'}}>
            <p className="text-3xl font-bold text-amber-500">{pendingBookings.length}</p>
            <p className="text-gray-500 text-sm">Chờ nhận</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg animate-fade-in" style={{animationDelay: '0.2s'}}>
            <p className="text-3xl font-bold text-green-500">
              {bookings.filter(b => b.status === 'HOAN_THANH' && (b.driverId?._id === user.id || b.driverId === user.id)).length}
            </p>
            <p className="text-gray-500 text-sm">Hoàn thành</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg animate-fade-in" style={{animationDelay: '0.3s'}}>
            <p className="text-3xl font-bold text-indigo-500">
              {bookings
                .filter(b => b.status === 'HOAN_THANH' && (b.driverId?._id === user.id || b.driverId === user.id))
                .reduce((sum, b) => sum + b.price, 0)
                .toLocaleString()}đ
            </p>
            <p className="text-gray-500 text-sm">Thu nhập</p>
          </div>
        </div>

        {/* Pending Bookings */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Chuyến chờ nhận
        </h2>

        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg animate-fade-in">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🔍</span>
            </div>
            <p className="text-gray-500 text-lg">Không có chuyến nào đang chờ</p>
            <p className="text-gray-400 text-sm mt-2">Các chuyến mới sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBookings.map((b, index) => (
              <div
                key={b._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover animate-fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="grid md:grid-cols-2">
                  {/* Info */}
                  <div className="p-5">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-sm text-gray-600">{b.pickup?.address}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                        <p className="text-sm text-gray-600">{b.dropoff?.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>📏 {(b.distance / 1000).toFixed(1)} km</span>
                        <span>⏱️ {Math.round(b.duration / 60)} phút</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">{b.price.toLocaleString()}đ</span>
                      <button
                        onClick={() => handleAccept(b._id)}
                        disabled={actionLoading}
                        className="btn-primary disabled:opacity-50"
                      >
                        Nhận chuyến
                      </button>
                    </div>
                  </div>

                  {/* Mini Map - Tăng kích thước */}
                  <div className="hidden md:block h-[250px]">
                    <GoogleMap
                      key={b._id}
                      pickup={b.pickup}
                      dropoff={b.dropoff}
                      showRoute={true}
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
