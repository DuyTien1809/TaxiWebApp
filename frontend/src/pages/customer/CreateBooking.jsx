import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import LeafletMap from '../../components/LeafletMap';

const PRICE_PER_KM = 10000;

export default function CreateBooking() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectMode, setSelectMode] = useState(null); // 'pickup' | 'dropoff' | null
  const navigate = useNavigate();

  const calculatePrice = (distanceMeters) => {
    const km = distanceMeters / 1000;
    return Math.round(km * PRICE_PER_KM);
  };

  const handleRouteCalculated = (info) => {
    setRouteInfo({
      ...info,
      price: calculatePrice(info.distance)
    });
  };

  const handleMapClick = (location, mode) => {
    if (mode === 'pickup') {
      setPickup(location);
    } else if (mode === 'dropoff') {
      setDropoff(location);
    }
    setSelectMode(null);
  };

  const handleSubmit = async () => {
    if (!pickup || !dropoff || !routeInfo) {
      setError('Vui lòng chọn điểm đón và điểm đến');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createBooking({
        pickup,
        dropoff,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
        price: routeInfo.price
      });
      setSuccess(true);
      setTimeout(() => navigate('/customer/trips'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt xe thất bại');
    } finally {
      setLoading(false);
    }
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
                    selectMode === 'pickup' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                  }`}
                  title="Chọn trên bản đồ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <LocationPicker
                placeholder="Tìm địa chỉ đón..."
                onSelect={setPickup}
                value={pickup}
              />
              {pickup && (
                <p className="mt-2 text-sm text-gray-500 truncate">📍 {pickup.address}</p>
              )}
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
                    selectMode === 'dropoff' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                  }`}
                  title="Chọn trên bản đồ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <LocationPicker
                placeholder="Tìm địa chỉ đến..."
                onSelect={setDropoff}
                value={dropoff}
              />
              {dropoff && (
                <p className="mt-2 text-sm text-gray-500 truncate">🎯 {dropoff.address}</p>
              )}
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
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fade-in">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!pickup || !dropoff || loading}
              className="w-full btn-success py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 animate-fade-in"
              style={{animationDelay: '0.4s'}}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🚗</span>
                  <span>Đặt xe ngay</span>
                </>
              )}
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
    </div>
  );
}
