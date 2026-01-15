import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPendingDrivers, getPendingDriverDetail, approveDriver, rejectDriver } from '../../services/api';

const VEHICLE_TYPES = {
  XE_MAY: 'Xe máy',
  XE_4_CHO: 'Xe 4 chỗ',
  XE_7_CHO: 'Xe 7 chỗ'
};

export default function PendingDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const { data } = await getPendingDrivers();
      setDrivers(data.drivers);
    } catch (err) {
      console.error('Load pending drivers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDriverDetail = async (driverId) => {
    setDetailLoading(true);
    try {
      const { data } = await getPendingDriverDetail(driverId);
      setSelectedDriver(data.driver);
    } catch (err) {
      console.error('Load driver detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDriver) return;
    setActionLoading(true);
    try {
      await approveDriver(selectedDriver._id);
      setDrivers(drivers.filter(d => d._id !== selectedDriver._id));
      setSelectedDriver(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDriver || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await rejectDriver(selectedDriver._id, rejectReason);
      setDrivers(drivers.filter(d => d._id !== selectedDriver._id));
      setSelectedDriver(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Duyệt tài xế mới</h1>
            <p className="text-gray-500">{drivers.length} hồ sơ đang chờ duyệt</p>
          </div>
          <Link
            to="/admin/drivers"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
          >
            ← Quản lý tài xế
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Danh sách chờ duyệt</h2>
              </div>
              
              {drivers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl mb-3 block">✅</span>
                  Không có hồ sơ nào chờ duyệt
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {drivers.map(driver => (
                    <button
                      key={driver._id}
                      onClick={() => loadDriverDetail(driver._id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedDriver?._id === driver._id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {driver.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{driver.name}</p>
                          <p className="text-sm text-gray-500">{driver.phone}</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(driver.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Driver Detail */}
          <div className="lg:col-span-2">
            {detailLoading ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : selectedDriver ? (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                      {selectedDriver.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedDriver.name}</h2>
                      <p className="text-white/80">{selectedDriver.phone}</p>
                      {selectedDriver.email && (
                        <p className="text-white/60 text-sm">{selectedDriver.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>👤</span> Thông tin cá nhân
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Ngày sinh:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.birthday 
                            ? new Date(selectedDriver.birthday).toLocaleDateString('vi-VN')
                            : 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Địa chỉ:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.address || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ID & License */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>🪪</span> Giấy tờ
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">CMND/CCCD:</span>
                        <span className="ml-2 text-gray-800 font-medium">
                          {selectedDriver.driverInfo?.idNumber || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Số bằng lái:</span>
                        <span className="ml-2 text-gray-800 font-medium">
                          {selectedDriver.driverInfo?.licenseNumber || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Hạn bằng lái:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.driverInfo?.licenseExpiry 
                            ? new Date(selectedDriver.driverInfo.licenseExpiry).toLocaleDateString('vi-VN')
                            : 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>🚗</span> Thông tin xe
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Loại xe:</span>
                        <span className="ml-2 text-gray-800">
                          {VEHICLE_TYPES[selectedDriver.driverInfo?.vehicleType] || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Biển số:</span>
                        <span className="ml-2 text-gray-800 font-medium">
                          {selectedDriver.driverInfo?.vehiclePlate || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Hãng xe:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.driverInfo?.vehicleBrand || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Dòng xe:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.driverInfo?.vehicleModel || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Năm SX:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.driverInfo?.vehicleYear || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>📞</span> Liên hệ khẩn cấp
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Tên:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.driverInfo?.emergencyContact || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">SĐT:</span>
                        <span className="ml-2 text-gray-800">
                          {selectedDriver.driverInfo?.emergencyPhone || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rules Agreement */}
                  <div className="flex items-center gap-2 text-sm">
                    {selectedDriver.agreedToRules ? (
                      <>
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-600">
                          Đã đồng ý nội quy lúc {new Date(selectedDriver.agreedToRulesAt).toLocaleString('vi-VN')}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-500">✗</span>
                        <span className="text-gray-600">Chưa đồng ý nội quy</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading ? 'Đang xử lý...' : '✓ Duyệt tài xế'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50"
                  >
                    ✗ Từ chối
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
                <span className="text-4xl mb-3 block">👈</span>
                Chọn một tài xế để xem chi tiết
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Từ chối hồ sơ</h3>
            <p className="text-gray-600 mb-4">
              Vui lòng nhập lý do từ chối để tài xế có thể cập nhật hồ sơ:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
