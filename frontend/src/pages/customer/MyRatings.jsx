import { useState, useEffect } from 'react';
import { getBookings, createRating } from '../../services/api';

const TAG_OPTIONS = [
  { value: 'THAN_THIEN', label: 'Thân thiện', icon: '😊' },
  { value: 'CHUYEN_NGHIEP', label: 'Chuyên nghiệp', icon: '👔' },
  { value: 'AN_TOAN', label: 'An toàn', icon: '🛡️' },
  { value: 'DUNG_GIO', label: 'Đúng giờ', icon: '⏰' },
  { value: 'XE_SACH', label: 'Xe sạch', icon: '✨' },
  { value: 'GIAO_TIEP_TOT', label: 'Giao tiếp tốt', icon: '💬' },
];

const TAG_NEGATIVE = [
  { value: 'DI_CHAM', label: 'Đi chậm', icon: '🐢' },
  { value: 'THAI_DO_XAU', label: 'Thái độ xấu', icon: '😤' },
  { value: 'XE_BAN', label: 'Xe bẩn', icon: '🚗' },
  { value: 'LAI_XE_AU', label: 'Lái xe ẩu', icon: '⚠️' },
  { value: 'KHONG_LICH_SU', label: 'Không lịch sự', icon: '😒' },
];

export default function MyRatings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, rated
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingForm, setRatingForm] = useState({ stars: 5, comment: '', tags: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await getBookings();
      setBookings(data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc chuyến hoàn thành chưa đánh giá và đã đánh giá
  const completedBookings = bookings.filter(b => b.status === 'HOAN_THANH');
  const pendingRatings = completedBookings.filter(b => !b.customerRated);
  const ratedBookings = completedBookings.filter(b => b.customerRated);

  const handleSubmitRating = async () => {
    if (!ratingModal) return;
    setSubmitting(true);
    try {
      await createRating({
        bookingId: ratingModal._id,
        stars: ratingForm.stars,
        comment: ratingForm.comment,
        tags: ratingForm.tags
      });
      // Cập nhật local state
      setBookings(prev => prev.map(b => 
        b._id === ratingModal._id ? { ...b, customerRated: true } : b
      ));
      setRatingModal(null);
      setRatingForm({ stars: 5, comment: '', tags: [] });
    } catch (err) {
      alert(err.response?.data?.message || 'Đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tag) => {
    setRatingForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">⭐</span>
            Đánh giá chuyến đi
          </h1>
          <p className="text-gray-500 mt-1">Đánh giá tài xế để cải thiện chất lượng dịch vụ</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'pending' 
                ? 'bg-orange-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Chưa đánh giá
            {pendingRatings.length > 0 && (
              <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingRatings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rated')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'rated' 
                ? 'bg-green-500 text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Đã đánh giá ({ratedBookings.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRatings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                <span className="text-6xl block mb-4">✅</span>
                <p className="text-gray-500">Bạn đã đánh giá tất cả chuyến đi!</p>
              </div>
            ) : (
              pendingRatings.map(booking => (
                <BookingCard 
                  key={booking._id} 
                  booking={booking} 
                  onRate={() => setRatingModal(booking)}
                  isPending
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'rated' && (
          <div className="space-y-4">
            {ratedBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                <span className="text-6xl block mb-4">📝</span>
                <p className="text-gray-500">Chưa có đánh giá nào</p>
              </div>
            ) : (
              ratedBookings.map(booking => (
                <BookingCard key={booking._id} booking={booking} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-center flex-shrink-0">
              <span className="text-5xl block mb-2">⭐</span>
              <h3 className="text-2xl font-bold">Đánh giá chuyến đi</h3>
              <p className="text-white/80 text-sm mt-1">
                {ratingModal.driverId?.name || 'Tài xế'}
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Trip Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-sm text-gray-600 line-clamp-2">{ratingModal.pickup?.address}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-sm text-gray-600 line-clamp-2">{ratingModal.dropoff?.address}</p>
                </div>
                <p className="text-right text-green-600 font-bold mt-2">{ratingModal.price?.toLocaleString()}đ</p>
              </div>

              {/* Star Rating */}
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-3">Bạn đánh giá chuyến đi này như thế nào?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRatingForm(prev => ({ ...prev, stars: star }))}
                      className={`text-4xl transition-transform hover:scale-110 ${
                        star <= ratingForm.stars ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {ratingForm.stars === 5 ? 'Tuyệt vời!' : 
                   ratingForm.stars === 4 ? 'Rất tốt' :
                   ratingForm.stars === 3 ? 'Bình thường' :
                   ratingForm.stars === 2 ? 'Không hài lòng' : 'Rất tệ'}
                </p>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  {ratingForm.stars >= 4 ? 'Điều gì khiến bạn hài lòng?' : 'Điều gì cần cải thiện?'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(ratingForm.stars >= 4 ? TAG_OPTIONS : TAG_NEGATIVE).map(tag => (
                    <button
                      key={tag.value}
                      onClick={() => toggleTag(tag.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                        ratingForm.tags.includes(tag.value)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{tag.icon}</span>
                      <span>{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <textarea
                  placeholder="Viết nhận xét của bạn (không bắt buộc)..."
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="p-4 border-t bg-white flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRatingModal(null);
                    setRatingForm({ stars: 5, comment: '', tags: [] });
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, onRate, isPending }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-lg ${isPending ? 'border-2 border-orange-200' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">{new Date(booking.createdAt).toLocaleString('vi-VN')}</p>
          <p className="font-bold text-green-600 text-lg">{booking.price?.toLocaleString()}đ</p>
        </div>
        {isPending && (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium animate-pulse">
            ⏳ Chờ đánh giá
          </span>
        )}
      </div>

      {/* Driver Info */}
      {booking.driverId && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {booking.driverId.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{booking.driverId.name}</p>
            <p className="text-sm text-blue-600">📞 {booking.driverId.phone}</p>
          </div>
        </div>
      )}

      {/* Locations */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
          <p className="text-sm text-gray-600">{booking.pickup?.address}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
          <p className="text-sm text-gray-600">{booking.dropoff?.address}</p>
        </div>
      </div>

      {isPending ? (
        <button
          onClick={onRate}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>⭐</span> Đánh giá ngay
        </button>
      ) : (
        <div className="flex items-center gap-2 text-green-600">
          <span>✅</span>
          <span className="text-sm">Đã đánh giá</span>
        </div>
      )}
    </div>
  );
}
