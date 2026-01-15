import { useState, useEffect } from 'react';
import { getAdminDrivers, getDriverDetail, updateDriverStatus, lockDriver, unlockDriver, getServiceQualityStats } from '../../services/api';

const TAG_LABELS = {
  THAN_THIEN: 'Thân thiện', CHUYEN_NGHIEP: 'Chuyên nghiệp', AN_TOAN: 'An toàn',
  DUNG_GIO: 'Đúng giờ', XE_SACH: 'Xe sạch', GIAO_TIEP_TOT: 'Giao tiếp tốt',
  DI_CHAM: 'Đi chậm', THAI_DO_XAU: 'Thái độ xấu', XE_BAN: 'Xe bẩn',
  LAI_XE_AU: 'Lái xe ẩu', KHONG_LICH_SU: 'Không lịch sự'
};

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetail, setDriverDetail] = useState(null);
  const [qualityStats, setQualityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // list, detail, quality
  const [detailTab, setDetailTab] = useState('overview'); // overview, trips, ratings
  const [lockModal, setLockModal] = useState(null); // { driverId, driverName }
  const [lockReason, setLockReason] = useState('');

  useEffect(() => {
    fetchDrivers();
    fetchQualityStats();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await getAdminDrivers();
      setDrivers(res.data.drivers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQualityStats = async () => {
    try {
      const res = await getServiceQualityStats();
      setQualityStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDriverDetail = async (driverId) => {
    try {
      setLoading(true);
      const res = await getDriverDetail(driverId);
      setDriverDetail(res.data);
      setActiveTab('detail');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (driverId, status) => {
    try {
      await updateDriverStatus(driverId, status);
      fetchDrivers();
      if (driverDetail?.driver._id === driverId) {
        fetchDriverDetail(driverId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLockDriver = async (driverId, reason) => {
    try {
      await lockDriver(driverId, reason);
      fetchDrivers();
      if (driverDetail?.driver._id === driverId) {
        fetchDriverDetail(driverId);
      }
      setLockModal(null);
      setLockReason('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlockDriver = async (driverId) => {
    try {
      await unlockDriver(driverId);
      fetchDrivers();
      if (driverDetail?.driver._id === driverId) {
        fetchDriverDetail(driverId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !drivers.length) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-100 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">🚗</span>
              Quản lý tài xế
            </h1>
            <p className="text-gray-500 mt-1">Hồ sơ, thu nhập, đánh giá và chất lượng dịch vụ</p>
          </div>
          
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-lg">
            {[
              { key: 'list', label: '👥 Danh sách' },
              { key: 'quality', label: '⭐ Chất lượng' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedDriver(null); }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.key || (activeTab === 'detail' && tab.key === 'list')
                    ? 'bg-green-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách tài xế */}
        {activeTab === 'list' && (
          <div className="grid gap-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Tổng tài xế" value={drivers.length} icon="👥" color="from-blue-500 to-cyan-600" />
              <StatCard title="Đang rảnh" value={drivers.filter(d => d.driverStatus === 'RANH' && !d.isLocked).length} icon="✅" color="from-green-500 to-emerald-600" />
              <StatCard title="Đang bận" value={drivers.filter(d => d.driverStatus === 'BAN' && !d.isLocked).length} icon="🚗" color="from-orange-500 to-red-500" />
              <StatCard title="Bị khóa" value={drivers.filter(d => d.isLocked).length} icon="🔒" color="from-red-500 to-pink-600" />
              <StatCard title="Đánh giá TB" value={qualityStats?.overview?.avgRating?.toFixed(1) || '0'} icon="⭐" color="from-yellow-500 to-amber-600" />
            </div>

            {/* Driver List */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tài xế</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Trạng thái</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Tài khoản</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Chuyến</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Từ chối</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Thu nhập</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Đánh giá</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {drivers.map(driver => (
                      <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                              {driver.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{driver.name}</p>
                              <p className="text-sm text-gray-500">{driver.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            driver.isLocked ? 'bg-gray-300 text-gray-600' :
                            driver.driverStatus === 'RANH' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {driver.isLocked ? '⛔ Đã khóa' : driver.driverStatus === 'RANH' ? '🟢 Rảnh' : '🟠 Bận'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {driver.isLocked ? (
                            <div>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">🔒 Bị khóa</span>
                              {driver.lockReason && (
                                <p className="text-xs text-gray-500 mt-1" title={driver.lockReason}>
                                  {driver.lockReason.slice(0, 20)}{driver.lockReason.length > 20 ? '...' : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ Hoạt động</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className="font-semibold text-gray-800">{driver.stats?.totalTrips || 0}</p>
                          <p className="text-xs text-gray-500">chuyến</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className={`font-semibold ${(driver.stats?.rejectedCount || 0) > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                            {driver.stats?.rejectedCount || 0}
                          </p>
                          <p className="text-xs text-gray-500">lần</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className="font-semibold text-green-600">{(driver.stats?.totalEarning || 0).toLocaleString()}đ</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold">{driver.stats?.avgRating || 0}</span>
                            <span className="text-xs text-gray-500">({driver.stats?.totalRatings || 0})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => fetchDriverDetail(driver._id)}
                              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                            >
                              Chi tiết
                            </button>
                            {!driver.isLocked && (
                              <select
                                value={driver.driverStatus}
                                onChange={(e) => handleStatusChange(driver._id, e.target.value)}
                                className="px-2 py-1 border rounded-lg text-sm"
                              >
                                <option value="RANH">Rảnh</option>
                                <option value="BAN">Bận</option>
                              </select>
                            )}
                            {driver.isLocked ? (
                              <button
                                onClick={() => handleUnlockDriver(driver._id)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                              >
                                🔓 Mở khóa
                              </button>
                            ) : (
                              <button
                                onClick={() => setLockModal({ driverId: driver._id, driverName: driver.name })}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                              >
                                🔒 Khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Chi tiết tài xế */}
        {activeTab === 'detail' && driverDetail && (
          <DriverDetailView 
            data={driverDetail} 
            onBack={() => setActiveTab('list')}
            detailTab={detailTab}
            setDetailTab={setDetailTab}
          />
        )}

        {/* Chất lượng dịch vụ */}
        {activeTab === 'quality' && qualityStats && (
          <ServiceQualityView stats={qualityStats} onViewDriver={fetchDriverDetail} />
        )}
      </div>

      {/* Lock Driver Modal */}
      {lockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white text-center">
              <span className="text-5xl block mb-2">🔒</span>
              <h3 className="text-2xl font-bold">Khóa tài khoản</h3>
              <p className="text-white/80 text-sm mt-1">{lockModal.driverName}</p>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Bạn đang khóa tài khoản tài xế <strong>{lockModal.driverName}</strong>. 
                Tài xế sẽ không thể đăng nhập và nhận chuyến cho đến khi được mở khóa.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do khóa tài khoản <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Nhập lý do khóa tài khoản..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Quick reasons */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">Lý do nhanh:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Vi phạm quy định',
                    'Đánh giá thấp liên tục',
                    'Hành vi không phù hợp',
                    'Gian lận',
                    'Yêu cầu từ khách hàng'
                  ].map(reason => (
                    <button
                      key={reason}
                      onClick={() => setLockReason(reason)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setLockModal(null);
                    setLockReason('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleLockDriver(lockModal.driverId, lockReason)}
                  disabled={!lockReason.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔒 Xác nhận khóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Component chi tiết tài xế
function DriverDetailView({ data, onBack, detailTab, setDetailTab }) {
  const { driver, trips, earnings, ratingsFromCustomers, rejectionHistory, stats, monthlyStats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2">
          ← Quay lại danh sách
        </button>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-4xl text-white font-bold shadow-lg">
            {driver.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">{driver.name}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                driver.driverStatus === 'RANH' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {driver.driverStatus === 'RANH' ? '🟢 Đang rảnh' : '🟠 Đang bận'}
              </span>
            </div>
            <p className="text-gray-500">📞 {driver.phone} • 📧 {driver.email || 'Chưa có email'}</p>
            <p className="text-gray-500">📍 {driver.address || 'Chưa cập nhật địa chỉ'}</p>
            <p className="text-gray-400 text-sm mt-1">Tham gia: {new Date(driver.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-3xl font-bold text-yellow-600">⭐ {stats.avgRating}</p>
              <p className="text-sm text-gray-500">{stats.totalRatings} đánh giá</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard title="Tổng chuyến" value={stats.totalTrips} icon="🚗" color="from-blue-500 to-cyan-600" />
        <StatCard title="Đã hủy" value={stats.cancelledTrips} icon="❌" color="from-red-500 to-pink-600" />
        <StatCard title="Từ chối" value={stats.rejectedCount || 0} icon="🚫" color="from-orange-500 to-red-500" />
        <StatCard title="Quãng đường" value={`${(stats.totalDistance / 1000).toFixed(0)}km`} icon="🛣️" color="from-purple-500 to-indigo-600" />
        <StatCard title="Thu nhập" value={`${((stats.totalEarning || 0) / 1000000).toFixed(1)}M`} icon="💰" color="from-green-500 to-emerald-600" />
        <StatCard title="Tip nhận" value={`${((stats.totalTip || 0) / 1000).toFixed(0)}k`} icon="🎁" color="from-yellow-500 to-amber-600" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-lg flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: '📊 Tổng quan' },
          { key: 'trips', label: '🚗 Lịch sử chuyến' },
          { key: 'ratings', label: '⭐ Đánh giá' },
          { key: 'rejections', label: `🚫 Từ chối (${stats.rejectedCount || 0})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setDetailTab(tab.key)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              detailTab === tab.key ? 'bg-green-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {detailTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Chart */}
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-4">📈 Thu nhập 6 tháng</h3>
            <div className="flex items-end justify-between gap-3 h-48">
              {monthlyStats.map((month, i) => {
                const maxEarning = Math.max(...monthlyStats.map(m => m.earning), 1);
                const height = (month.earning / maxEarning) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <p className="text-xs text-gray-500 mb-1">{month.trips}</p>
                    <div className="w-full bg-gray-100 rounded-t-lg relative" style={{height: '140px'}}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all duration-500" 
                        style={{height: `${height}%`}}
                      ></div>
                    </div>
                    <p className="text-xs font-medium text-gray-600 mt-2">{month.month}</p>
                    <p className="text-xs text-gray-400">{(month.earning / 1000000).toFixed(1)}M</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-4">⭐ Phân bố đánh giá</h3>
            <div className="space-y-3">
              {stats.starStats?.map(({ star, count }) => {
                const percent = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium">{star} ⭐</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{width: `${percent}%`}}></div>
                    </div>
                    <span className="w-12 text-sm text-gray-500 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Earnings */}
          <div className="bg-white rounded-2xl p-5 shadow-lg md:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4">💰 Thu nhập gần đây</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {earnings.slice(0, 10).map(e => (
                <div key={e._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">{e.bookingId?.pickup?.address?.slice(0, 30)}...</p>
                    <p className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{e.totalEarning.toLocaleString()}đ</p>
                    <p className="text-xs text-gray-500">Chiết khấu: {e.platformFeeAmount.toLocaleString()}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {detailTab === 'trips' && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Điểm đón</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Điểm trả</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Khách</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trips.map(trip => (
                  <tr key={trip._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(trip.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{trip.pickup?.address?.slice(0, 25)}...</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{trip.dropoff?.address?.slice(0, 25)}...</td>
                    <td className="px-4 py-3 text-center text-sm">{trip.customerId?.name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trip.status === 'HOAN_THANH' ? 'bg-green-100 text-green-700' :
                        trip.status === 'HUY' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {trip.status === 'HOAN_THANH' ? 'Hoàn thành' : trip.status === 'HUY' ? 'Đã hủy' : trip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{trip.price.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailTab === 'ratings' && (
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">👤 Khách đánh giá tài xế</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {ratingsFromCustomers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Chưa có đánh giá</p>
            ) : (
              ratingsFromCustomers.map(r => (
                <RatingCard key={r._id} rating={r} />
              ))
            )}
          </div>
        </div>
      )}

      {detailTab === 'rejections' && (
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">🚫 Lịch sử từ chối đơn ({rejectionHistory?.length || 0} lần)</h3>
          {!rejectionHistory || rejectionHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-gray-500">Tài xế chưa từ chối đơn nào</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {rejectionHistory.map((rejection, index) => (
                <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚫</span>
                      <div>
                        <p className="font-medium text-gray-800">Khách: {rejection.customer?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{rejection.customer?.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600">{rejection.price?.toLocaleString()}đ</p>
                      <p className="text-xs text-gray-500">{new Date(rejection.rejectedAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-green-500">●</span>
                      <p className="text-gray-600 line-clamp-1">{rejection.pickup?.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-500">●</span>
                      <p className="text-gray-600 line-clamp-1">{rejection.dropoff?.address}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Lý do: </span>
                      <span className={`${rejection.reason === 'Không có lý do' ? 'text-gray-400 italic' : 'text-orange-700'}`}>
                        {rejection.reason}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// Component chất lượng dịch vụ
function ServiceQualityView({ stats, onViewDriver }) {
  const { overview, ratingDistribution, popularTags, lowRatedDrivers, topRatedDrivers, dailyStats } = stats;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Tổng đánh giá" value={overview.totalRatings} icon="📝" color="from-blue-500 to-cyan-600" />
        <StatCard title="Điểm trung bình" value={overview.avgRating} icon="⭐" color="from-yellow-500 to-amber-600" />
        <StatCard title="Tỷ lệ hủy" value={`${overview.cancellationRate}%`} icon="❌" color="from-red-500 to-pink-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">📊 Phân bố đánh giá</h3>
          <div className="space-y-3">
            {ratingDistribution.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium">{star} sao</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      star >= 4 ? 'bg-green-400' : star === 3 ? 'bg-yellow-400' : 'bg-red-400'
                    }`} 
                    style={{width: `${percent}%`}}
                  ></div>
                </div>
                <span className="w-16 text-sm text-gray-500 text-right">{count} ({percent}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Rating Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">📈 Xu hướng 7 ngày</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {dailyStats.map((day, i) => {
              const height = (day.avgRating / 5) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-1">{day.totalRatings}</p>
                  <div className="w-full bg-gray-100 rounded-t-lg relative" style={{height: '120px'}}>
                    <div 
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                        day.avgRating >= 4 ? 'bg-gradient-to-t from-green-500 to-emerald-400' :
                        day.avgRating >= 3 ? 'bg-gradient-to-t from-yellow-500 to-amber-400' :
                        'bg-gradient-to-t from-red-500 to-pink-400'
                      }`}
                      style={{height: `${height}%`}}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-2">{day.dayName}</p>
                  <p className="text-xs text-gray-400">{day.avgRating}⭐</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Tags */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">🏷️ Tags phổ biến</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(({ tag, count }) => {
              const isPositive = ['THAN_THIEN', 'CHUYEN_NGHIEP', 'AN_TOAN', 'DUNG_GIO', 'XE_SACH', 'GIAO_TIEP_TOT'].includes(tag);
              return (
                <span 
                  key={tag} 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {TAG_LABELS[tag] || tag} ({count})
                </span>
              );
            })}
          </div>
        </div>

        {/* Top & Low Rated Drivers */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-gray-800 mb-4">🏆 Tài xế xuất sắc</h3>
          <div className="space-y-2 mb-6">
            {topRatedDrivers.length === 0 ? (
              <p className="text-gray-500 text-center py-2">Chưa có dữ liệu</p>
            ) : (
              topRatedDrivers.map((d, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => onViewDriver(d.driver?._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <div>
                      <p className="font-medium text-gray-800">{d.driver?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{d.totalRatings} đánh giá</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">⭐ {d.avgRating}</span>
                </div>
              ))
            )}
          </div>

          <h3 className="font-bold text-gray-800 mb-4">⚠️ Cần cải thiện</h3>
          <div className="space-y-2">
            {lowRatedDrivers.length === 0 ? (
              <p className="text-gray-500 text-center py-2">Không có tài xế nào</p>
            ) : (
              lowRatedDrivers.map((d, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => onViewDriver(d.driver?._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-gray-800">{d.driver?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{d.totalRatings} đánh giá</p>
                    </div>
                  </div>
                  <span className="font-bold text-red-600">⭐ {d.avgRating}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-3 shadow-lg`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function RatingCard({ rating }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">
            {rating.fromUserId?.name?.charAt(0) || '?'}
          </div>
          <span className="font-medium text-gray-800">
            {rating.fromUserId?.name || 'Ẩn danh'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className={star <= rating.stars ? 'text-yellow-400' : 'text-gray-300'}>★</span>
          ))}
        </div>
      </div>
      {rating.comment && <p className="text-sm text-gray-600 mb-2">{rating.comment}</p>}
      {rating.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rating.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
              {TAG_LABELS[tag] || tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">{new Date(rating.createdAt).toLocaleString('vi-VN')}</p>
    </div>
  );
}
