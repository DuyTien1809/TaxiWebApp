import { useState, useEffect } from 'react';
import { getBookings } from '../../services/api';
import LeafletMap from '../../components/LeafletMap';

const statusConfig = {
  MOI_TAO: { text: 'Đang chờ tài xế', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  DA_NHAN: { text: 'Đã nhận', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  DANG_CHAY: { text: 'Đang chạy', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  HUY: { text: 'Đã hủy', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getBookings();
        setBookings(data.bookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'MOI_TAO').length,
    active: bookings.filter(b => ['DA_NHAN', 'DANG_CHAY'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'HOAN_THANH').length,
    cancelled: bookings.filter(b => b.status === 'HUY').length,
    revenue: bookings.filter(b => b.status === 'HOAN_THANH').reduce((sum, b) => sum + b.price, 0)
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-100 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
              📊
            </span>
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Quản lý và theo dõi hệ thống</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="Tổng chuyến"
            value={stats.total}
            icon="📦"
            color="from-slate-500 to-slate-600"
            delay="0.1s"
          />
          <StatCard
            title="Đang chờ"
            value={stats.pending}
            icon="🔍"
            color="from-amber-500 to-orange-500"
            delay="0.15s"
          />
          <StatCard
            title="Đang chạy"
            value={stats.active}
            icon="🚗"
            color="from-blue-500 to-indigo-500"
            delay="0.2s"
          />
          <StatCard
            title="Hoàn thành"
            value={stats.completed}
            icon="✅"
            color="from-green-500 to-emerald-500"
            delay="0.25s"
          />
          <StatCard
            title="Đã hủy"
            value={stats.cancelled}
            icon="❌"
            color="from-red-500 to-rose-500"
            delay="0.3s"
          />
          <StatCard
            title="Doanh thu"
            value={`${(stats.revenue / 1000000).toFixed(1)}M`}
            icon="💰"
            color="from-purple-500 to-pink-500"
            delay="0.35s"
          />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Booking List */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl p-2 shadow-lg mb-4 flex gap-1 overflow-x-auto animate-fade-in">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'MOI_TAO', label: 'Chờ' },
                { key: 'DA_NHAN', label: 'Đã nhận' },
                { key: 'DANG_CHAY', label: 'Đang chạy' },
                { key: 'HOAN_THANH', label: 'Xong' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    filter === tab.key
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bookings */}
            <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-2">
              {filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <span className="text-4xl block mb-2">📭</span>
                  <p className="text-gray-500">Không có dữ liệu</p>
                </div>
              ) : (
                filteredBookings.map((b, index) => (
                  <div
                    key={b._id}
                    onClick={() => setSelectedBooking(b)}
                    className={`bg-white rounded-2xl p-4 shadow-lg cursor-pointer transition-all duration-300 animate-fade-in ${
                      selectedBooking?._id === b._id
                        ? 'ring-2 ring-indigo-500 shadow-indigo-100'
                        : 'hover:shadow-xl hover:-translate-y-1'
                    }`}
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`badge ${statusConfig[b.status].color}`}>
                        <span className={`w-2 h-2 rounded-full ${statusConfig[b.status].dot}`}></span>
                        {statusConfig[b.status].text}
                      </div>
                      <span className="font-bold text-green-600">{b.price.toLocaleString()}đ</span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="truncate">{b.pickup?.address}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="truncate">{b.dropoff?.address}</span>
                      </p>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>👤 {b.customerId?.name || '-'}</span>
                      <span>🚗 {b.driverId?.name || 'Chưa có'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map & Details */}
          <div className="lg:col-span-3 animate-fade-in" style={{animationDelay: '0.2s'}}>
            {selectedBooking ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white/70 text-sm">Chi tiết chuyến</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full bg-white animate-pulse`}></span>
                        <span className="font-semibold">{statusConfig[selectedBooking.status].text}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm">Tổng tiền</p>
                      <p className="text-2xl font-bold">{selectedBooking.price.toLocaleString()}đ</p>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="h-[300px]">
                  <LeafletMap
                    pickup={selectedBooking.pickup}
                    dropoff={selectedBooking.dropoff}
                    driverLocation={selectedBooking.driverLocation}
                    showRoute={true}
                    height="100%"
                  />
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  {/* Customer & Driver */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-600 font-medium mb-1">KHÁCH HÀNG</p>
                      <p className="font-semibold text-gray-800">{selectedBooking.customerId?.name}</p>
                      <p className="text-sm text-gray-500">{selectedBooking.customerId?.phone}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                      <p className="text-xs text-green-600 font-medium mb-1">TÀI XẾ</p>
                      <p className="font-semibold text-gray-800">{selectedBooking.driverId?.name || 'Chưa có'}</p>
                      <p className="text-sm text-gray-500">{selectedBooking.driverId?.phone || '-'}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Điểm đón</p>
                        <p className="text-sm text-gray-700">{selectedBooking.pickup?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Điểm đến</p>
                        <p className="text-sm text-gray-700">{selectedBooking.dropoff?.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-800">{(selectedBooking.distance / 1000).toFixed(1)}</p>
                      <p className="text-xs text-gray-500">km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-800">{Math.round(selectedBooking.duration / 60)}</p>
                      <p className="text-xs text-gray-500">phút</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{(selectedBooking.price / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-gray-500">VND</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl h-[500px] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <span className="text-6xl block mb-4">🗺️</span>
                  <p className="text-lg">Chọn một chuyến để xem chi tiết</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, delay }) {
  return (
    <div 
      className="bg-white rounded-2xl p-4 shadow-lg card-hover animate-fade-in"
      style={{animationDelay: delay}}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl mb-3 shadow-lg`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}
