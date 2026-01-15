const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Tạo đánh giá (chỉ khách hàng đánh giá tài xế)
exports.createRating = async (req, res) => {
  try {
    const { bookingId, stars, comment, tags } = req.body;
    const fromUserId = req.user._id;

    // Kiểm tra booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến xe' });
    }

    if (booking.status !== 'HOAN_THANH') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá chuyến đã hoàn thành' });
    }

    // Chỉ khách hàng mới được đánh giá
    if (booking.customerId.toString() !== fromUserId.toString()) {
      return res.status(403).json({ message: 'Chỉ khách hàng mới có thể đánh giá tài xế' });
    }

    // Kiểm tra đã đánh giá chưa
    const existingRating = await Rating.findOne({ bookingId, fromUserId });
    if (existingRating) {
      return res.status(400).json({ message: 'Bạn đã đánh giá chuyến này rồi' });
    }

    const rating = await Rating.create({
      bookingId,
      fromUserId,
      toUserId: booking.driverId,
      type: 'CUSTOMER_TO_DRIVER',
      stars,
      comment,
      tags: tags || []
    });

    // Đánh dấu đã đánh giá trong booking
    await Booking.findByIdAndUpdate(bookingId, { customerRated: true });

    res.status(201).json({ message: 'Đánh giá thành công', rating });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy đánh giá của một user
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // CUSTOMER_TO_DRIVER hoặc DRIVER_TO_CUSTOMER

    const query = { toUserId: userId };
    if (type) query.type = type;

    const ratings = await Rating.find(query)
      .populate('fromUserId', 'name avatar')
      .populate('bookingId', 'pickup dropoff price createdAt')
      .sort({ createdAt: -1 });

    // Tính điểm trung bình
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
      : 0;

    // Thống kê theo số sao
    const starStats = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: ratings.filter(r => r.stars === star).length
    }));

    res.status(200).json({ ratings, avgRating: parseFloat(avgRating), starStats, total: ratings.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy đánh giá của booking
exports.getBookingRatings = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const ratings = await Rating.find({ bookingId })
      .populate('fromUserId', 'name avatar role')
      .populate('toUserId', 'name avatar role');

    res.status(200).json({ ratings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Lấy số chuyến chưa đánh giá của khách hàng
exports.getPendingRatingsCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Chỉ khách hàng mới có chức năng đánh giá
    const count = await Booking.countDocuments({
      customerId: userId,
      status: 'HOAN_THANH',
      customerRated: false
    });

    res.status(200).json({ count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
