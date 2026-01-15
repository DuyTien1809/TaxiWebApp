import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getAdminBookings } from '../../services/api';
import LeafletMap from '../../components/LeafletMap';

const statusConfig = {
  MOI_TAO: { text: 'Đang chờ', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  DA_NHAN: { text: 'Đã nhận', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  DANG_CHAY: { text: 'Đang chạy', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  HOAN_THANH: { text: 'Hoàn thành', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  HUY: { text: 'Đã hủy', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, bookings, users
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        getAdminStats(),
        getAdminBookings()
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-100 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">📊</span>
              Admin Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Quản lý và theo dõi hệ thống</p>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-lg">
            {[
              { key: 'overview', label: '📈 Tổng quan', icon: '📈' },
              { key: 'bookings', label: '🚗 Chuyến xe', icon: '🚗' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.key ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <Link
              to="/admin/drivers"
              className="px-4 py-2 rounded-xl font-medium transition-all text-gray-600 hover:bg-gray-100 flex items-center gap-1"
            >
              👥 Quản lý tài xế
            </Link>
            <Link
              to="/admin/pending-drivers"
              className="px-4 py-2 rounded-xl font-medium transition-all text-gray-600 hover:bg-gray-100 flex items-center gap-1"
            >
              📋 Duyệt tài xế
            </Link>
          </div>
        </div>

        {activeTab === 'overview' && stats && (
          <div className="space-y-6 animate-fade-in">
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Tổng doanh thu" value={`${(stats.revenue.totalRevenue / 1000000).toFixed(1)}M`} subtitle="VNĐ" icon="💰" color="from-green-500 to-emerald-600" />
              <StatCard title="Lợi nhuận nền tảng" value={`${(stats.revenue.totalPlatformFee / 1000000).toFixed(1)}M`} subtitle="20% chiết khấu" icon="🏦" color="from-purple-500 to-indigo-600" />
              <StatCard title="Tổng chuyến" value={stats.bookings.completedBookings} subtitle="Hoàn thành" icon="✅" color="from-blue-500 to-cyan-600" />
              <StatCard title="Tổng km" value={stats.revenue.totalDistance} subtitle="Quãng đường" icon="🛣️" color="from-orange-500 to-red-500" />
            </div>

            {/* User & Booking Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Users */}
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">👥 Người dùng</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.users.totalCustomers}</p>
                    <p className="text-sm text-gray-500">Khách hàng</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.users.totalDrivers}</p>
                    <p className="text-sm text-gray-500">Tài xế</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl text-center col-span-2">
                    <p className="text-3xl font-bold text-purple-600">{stats.users.activeDrivers}</p>
                    <p className="text-sm text-gray-500">Tài xế đang rảnh</p>
                  </div>
                </div>
              </div>

              {/* Bookings */}
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🚗 Trạng thái chuyến</h3>
                <div className="space-y-3">
                  <ProgressBar label="Đang chờ" value={stats.bookings.pendingBookings} total={stats.bookings.totalBookings} color="bg-amber-500" />
                  <ProgressBar label="Đang chạy" value={stats.bookings.activeBookings} total={stats.bookings.totalBookings} color="bg-blue-500" />
                  <ProgressBar label="Hoàn thành" value={stats.bookings.completedBookings} total={stats.bookings.totalBookings} color="bg-green-500" />
                  <ProgressBar label="Đã hủy" value={stats.bookings.cancelledBookings} total={stats.bookings.totalBookings} color="bg-red-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 7 Days Revenue Chart */}
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">📈 Doanh thu 7 ngày qua</h3>
                <div className="flex items-end justify-between gap-2 h-48">
                  {stats.charts.last7Days.map((day, i) => {
                    const maxRevenue = Math.max(...stats.charts.last7Days.map(d => d.revenue), 1);
                    const height = (day.revenue / maxRevenue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <p className="text-xs text-gray-500 mb-1">{day.bookings}</p>
                        <div className="w-full bg-gray-100 rounded-t-lg relative" style={{height: '140px'}}>
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-500" 
                            style={{height: `${height}%`}}
                          ></div>
                        </div>
                        <p className="text-xs font-medium text-gray-600 mt-2">{day.dayName}</p>
                        <p className="text-xs text-gray-400">{(day.revenue / 1000).toFixed(0)}k</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6 Months Chart */}
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">📊 Doanh thu 6 tháng</h3>
                <div className="flex items-end justify-between gap-3 h-48">
                  {stats.charts.last6Months.map((month, i) => {
                    const maxRevenue = Math.max(...stats.charts.last6Months.map(m => m.revenue), 1);
                    const height = (month.revenue / maxRevenue) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <p className="text-xs text-gray-500 mb-1">{month.bookings}</p>
                        <div className="w-full bg-gray-100 rounded-t-lg relative" style={{height: '140px'}}>
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all duration-500" 
                            style={{height: `${height}%`}}
                          ></div>
                        </div>
                        <p className="text-xs font-medium text-gray-600 mt-2">{month.month}</p>
                        <p className="text-xs text-gray-400">{(month.revenue / 1000000).toFixed(1)}M</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Payment Methods & Top Drivers */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">💳 Phương thức thanh toán</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="16" />
                      <circle 
                        cx="64" cy="64" r="56" fill="none" stroke="#f59e0b" strokeWidth="16"
                        strokeDasharray={`${(stats.payments.cashPayments / (stats.payments.cashPayments + stats.payments.transferPayments || 1)) * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{stats.payments.cashPayments + stats.payments.transferPayments}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                        <span className="text-gray-600">Tiền mặt</span>
                      </div>
                      <span className="font-bold">{stats.payments.cashPayments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span className="text-gray-600">Chuyển khoản</span>
                      </div>
                      <span className="font-bold">{stats.payments.transferPayments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Drivers */}
              <div className="bg-white rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🏆 Top tài xế</h3>
                <div className="space-y-3">
                  {stats.topDrivers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
                  ) : (
                    stats.topDrivers.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{d.driver?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{d.totalTrips} chuyến</p>
                        </div>
                        <p className="font-bold text-green-600">{d.totalEarning.toLocaleString()}đ</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="grid lg:grid-cols-5 gap-6 animate-fade-in">
            {/* Booking List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-2 shadow-lg mb-4 flex gap-1 overflow-x-auto">
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
                      filter === tab.key ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
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
                      className={`bg-white rounded-2xl p-4 shadow-lg cursor-pointer transition-all duration-300 ${
                        selectedBooking?._id === b._id ? 'ring-2 ring-indigo-500' : 'hover:shadow-xl hover:-translate-y-1'
                      }`}
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
            <div className="lg:col-span-3">
              {selectedBooking ? (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white/70 text-sm">Chi tiết chuyến</p>
                        <span className="font-semibold">{statusConfig[selectedBooking.status].text}</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedBooking.price.toLocaleString()}đ</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <LeafletMap pickup={selectedBooking.pickup} dropoff={selectedBooking.dropoff} driverLocation={selectedBooking.driverLocation} showRoute={true} height="100%" />
                  </div>
                  <div className="p-5 space-y-4">
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
        )}
      </div>
    </div>
  );
}


function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg card-hover animate-fade-in">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-3 shadow-lg`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{width: `${percent}%`}}></div>
      </div>
    </div>
  );
}
