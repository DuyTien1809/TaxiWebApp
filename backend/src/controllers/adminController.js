const User = require('../models/User');
const Booking = require('../models/Booking');
const DriverEarning = require('../models/DriverEarning');
const Rating = require('../models/Rating');

// Lấy thống kê tổng quan
exports.getDashboardStats = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
    const totalDrivers = await User.countDocuments({ role: 'DRIVER' });
    const activeDrivers = await User.countDocuments({ role: 'DRIVER', driverStatus: 'RANH' });

    // Booking stats
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'MOI_TAO' });
    const activeBookings = await Booking.countDocuments({ status: { $in: ['DA_NHAN', 'DANG_CHAY'] } });
    const completedBookings = await Booking.countDocuments({ status: 'HOAN_THANH' });
    const cancelledBookings = await Booking.countDocuments({ status: 'HUY' });

    // Revenue stats
    const completedBookingsList = await Booking.find({ status: 'HOAN_THANH' });
    const totalRevenue = completedBookingsList.reduce((sum, b) => sum + b.price, 0);
    const totalDistance = completedBookingsList.reduce((sum, b) => sum + b.distance, 0);

    // Platform earnings (20% of revenue)
    const earnings = await DriverEarning.find();
    const totalPlatformFee = earnings.reduce((sum, e) => sum + e.platformFeeAmount, 0);
    const totalDriverEarnings = earnings.reduce((sum, e) => sum + e.totalEarning, 0);

    // Payment method stats
    const cashPayments = await Booking.countDocuments({ status: 'HOAN_THANH', paymentMethod: 'TIEN_MAT' });
    const transferPayments = await Booking.countDocuments({ status: 'HOAN_THANH', paymentMethod: 'CHUYEN_KHOAN' });

    // Daily stats for last 7 days
    const last7Days = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - i);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      const dayBookings = await Booking.find({
        status: 'HOAN_THANH',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const dayRevenue = dayBookings.reduce((sum, b) => sum + b.price, 0);
      const dayPlatformFee = Math.round(dayRevenue * 0.2);

      last7Days.push({
        date: startDate.toISOString().split('T')[0],
        dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][startDate.getDay()],
        bookings: dayBookings.length,
        revenue: dayRevenue,
        platformFee: dayPlatformFee
      });
    }

    // Monthly stats for last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthBookings = await Booking.find({
        status: 'HOAN_THANH',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const monthRevenue = monthBookings.reduce((sum, b) => sum + b.price, 0);

      last6Months.push({
        month: `T${startDate.getMonth() + 1}`,
        year: startDate.getFullYear(),
        bookings: monthBookings.length,
        revenue: monthRevenue
      });
    }

    // Top drivers
    const topDrivers = await DriverEarning.aggregate([
      {
        $group: {
          _id: '$driverId',
          totalTrips: { $sum: 1 },
          totalEarning: { $sum: '$totalEarning' },
          totalFare: { $sum: '$fareAmount' }
        }
      },
      { $sort: { totalTrips: -1 } },
      { $limit: 5 }
    ]);

    // Populate driver info
    const populatedTopDrivers = await User.populate(topDrivers, { path: '_id', select: 'name phone' });

    res.status(200).json({
      users: { totalUsers, totalCustomers, totalDrivers, activeDrivers },
      bookings: { totalBookings, pendingBookings, activeBookings, completedBookings, cancelledBookings },
      revenue: { 
        totalRevenue, 
        totalPlatformFee, 
        totalDriverEarnings,
        totalDistance: Math.round(totalDistance / 1000) // in km
      },
      payments: { cashPayments, transferPayments },
      charts: { last7Days, last6Months },
      topDrivers: populatedTopDrivers.map(d => ({
        driver: d._id,
        totalTrips: d.totalTrips,
        totalEarning: d.totalEarning,
        totalFare: d.totalFare
      }))
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách tất cả users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy tất cả bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== QUẢN LÝ TÀI XẾ ====================

// Lấy danh sách tài xế với thống kê
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'DRIVER' }).select('-password').sort({ createdAt: -1 });

    // Lấy thống kê cho từng tài xế
    const driversWithStats = await Promise.all(drivers.map(async (driver) => {
      // Thống kê chuyến xe
      const totalTrips = await Booking.countDocuments({ driverId: driver._id, status: 'HOAN_THANH' });
      const cancelledTrips = await Booking.countDocuments({ driverId: driver._id, status: 'HUY' });

      // Thống kê số lần từ chối đơn
      const rejectedBookings = await Booking.find({
        'rejectedDrivers.driverId': driver._id
      });
      const rejectedCount = rejectedBookings.reduce((count, booking) => {
        return count + booking.rejectedDrivers.filter(r => r.driverId.toString() === driver._id.toString()).length;
      }, 0);

      // Thống kê thu nhập
      const earnings = await DriverEarning.aggregate([
        { $match: { driverId: driver._id } },
        { $group: { _id: null, total: { $sum: '$totalEarning' }, totalFare: { $sum: '$fareAmount' } } }
      ]);

      // Thống kê đánh giá
      const ratings = await Rating.find({ toUserId: driver._id, type: 'CUSTOMER_TO_DRIVER' });
      const avgRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
        : 0;

      return {
        ...driver.toObject(),
        stats: {
          totalTrips,
          cancelledTrips,
          rejectedCount,
          totalEarning: earnings[0]?.total || 0,
          totalFare: earnings[0]?.totalFare || 0,
          avgRating: parseFloat(avgRating),
          totalRatings: ratings.length
        }
      };
    }));

    res.status(200).json({ drivers: driversWithStats });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy chi tiết tài xế
exports.getDriverDetail = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await User.findById(driverId).select('-password');

    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    // Lịch sử chuyến xe
    const trips = await Booking.find({ driverId })
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);

    // Thu nhập chi tiết
    const earnings = await DriverEarning.find({ driverId })
      .populate('bookingId', 'pickup dropoff price')
      .sort({ createdAt: -1 })
      .limit(50);

    // Đánh giá từ khách
    const ratingsFromCustomers = await Rating.find({ toUserId: driverId, type: 'CUSTOMER_TO_DRIVER' })
      .populate('fromUserId', 'name avatar')
      .populate('bookingId', 'pickup dropoff createdAt')
      .sort({ createdAt: -1 })
      .limit(30);

    // Thống kê tổng hợp
    const totalTrips = await Booking.countDocuments({ driverId, status: 'HOAN_THANH' });
    const cancelledTrips = await Booking.countDocuments({ driverId, status: 'HUY' });
    
    // Lấy lịch sử từ chối đơn
    const rejectedBookings = await Booking.find({
      'rejectedDrivers.driverId': driver._id
    }).populate('customerId', 'name phone').sort({ createdAt: -1 });
    
    const rejectionHistory = [];
    rejectedBookings.forEach(booking => {
      booking.rejectedDrivers.forEach(rejection => {
        if (rejection.driverId.toString() === driver._id.toString()) {
          rejectionHistory.push({
            bookingId: booking._id,
            customer: booking.customerId,
            pickup: booking.pickup,
            dropoff: booking.dropoff,
            price: booking.price,
            reason: rejection.reason || 'Không có lý do',
            rejectedAt: rejection.rejectedAt
          });
        }
      });
    });
    // Sắp xếp theo thời gian mới nhất
    rejectionHistory.sort((a, b) => new Date(b.rejectedAt) - new Date(a.rejectedAt));
    
    const totalDistance = await Booking.aggregate([
      { $match: { driverId: driver._id, status: 'HOAN_THANH' } },
      { $group: { _id: null, total: { $sum: '$distance' } } }
    ]);

    const earningStats = await DriverEarning.aggregate([
      { $match: { driverId: driver._id } },
      { $group: { 
        _id: null, 
        totalEarning: { $sum: '$totalEarning' },
        totalFare: { $sum: '$fareAmount' },
        totalPlatformFee: { $sum: '$platformFeeAmount' },
        totalTip: { $sum: '$tip' },
        totalBonus: { $sum: '$bonus' }
      }}
    ]);

    // Điểm đánh giá
    const avgRating = ratingsFromCustomers.length > 0
      ? (ratingsFromCustomers.reduce((sum, r) => sum + r.stars, 0) / ratingsFromCustomers.length).toFixed(1)
      : 0;

    // Thống kê theo sao
    const starStats = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: ratingsFromCustomers.filter(r => r.stars === star).length
    }));

    // Thống kê theo tháng (6 tháng gần nhất)
    const monthlyStats = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthTrips = await Booking.countDocuments({
        driverId,
        status: 'HOAN_THANH',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const monthEarnings = await DriverEarning.aggregate([
        { $match: { driverId: driver._id, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$totalEarning' } } }
      ]);

      monthlyStats.push({
        month: `T${startDate.getMonth() + 1}`,
        year: startDate.getFullYear(),
        trips: monthTrips,
        earning: monthEarnings[0]?.total || 0
      });
    }

    res.status(200).json({
      driver,
      trips,
      earnings,
      ratingsFromCustomers,
      rejectionHistory,
      stats: {
        totalTrips,
        cancelledTrips,
        rejectedCount: rejectionHistory.length,
        totalDistance: totalDistance[0]?.total || 0,
        ...earningStats[0],
        avgRating: parseFloat(avgRating),
        totalRatings: ratingsFromCustomers.length,
        starStats
      },
      monthlyStats
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật trạng thái tài xế (online/offline)
exports.updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.body; // RANH hoặc BAN

    const driver = await User.findByIdAndUpdate(
      driverId,
      { driverStatus: status },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    res.status(200).json({ message: 'Cập nhật trạng thái thành công', driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Khóa tài khoản tài xế
exports.lockDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    const driver = await User.findByIdAndUpdate(
      driverId,
      { 
        isLocked: true, 
        lockedAt: new Date(),
        lockReason: reason || 'Vi phạm quy định',
        driverStatus: 'BAN' // Tự động chuyển sang bận khi khóa
      },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    res.status(200).json({ message: 'Đã khóa tài khoản tài xế', driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mở khóa tài khoản tài xế
exports.unlockDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findByIdAndUpdate(
      driverId,
      { 
        isLocked: false, 
        lockedAt: null,
        lockReason: ''
      },
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    res.status(200).json({ message: 'Đã mở khóa tài khoản tài xế', driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy thống kê chất lượng dịch vụ
exports.getServiceQualityStats = async (req, res) => {
  try {
    // Tổng quan đánh giá
    const allRatings = await Rating.find({ type: 'CUSTOMER_TO_DRIVER' });
    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length).toFixed(2)
      : 0;

    // Phân bố đánh giá
    const ratingDistribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: allRatings.filter(r => r.stars === star).length,
      percent: allRatings.length > 0 
        ? ((allRatings.filter(r => r.stars === star).length / allRatings.length) * 100).toFixed(1)
        : 0
    }));

    // Tags phổ biến
    const tagCounts = {};
    allRatings.forEach(r => {
      r.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tài xế có đánh giá thấp (dưới 3.5 sao trung bình)
    const driversWithLowRating = await Rating.aggregate([
      { $match: { type: 'CUSTOMER_TO_DRIVER' } },
      { $group: { _id: '$toUserId', avgRating: { $avg: '$stars' }, count: { $sum: 1 } } },
      { $match: { avgRating: { $lt: 3.5 }, count: { $gte: 3 } } },
      { $sort: { avgRating: 1 } },
      { $limit: 10 }
    ]);
    const lowRatedDrivers = await User.populate(driversWithLowRating, { path: '_id', select: 'name phone' });

    // Tài xế xuất sắc (trên 4.5 sao)
    const driversWithHighRating = await Rating.aggregate([
      { $match: { type: 'CUSTOMER_TO_DRIVER' } },
      { $group: { _id: '$toUserId', avgRating: { $avg: '$stars' }, count: { $sum: 1 } } },
      { $match: { avgRating: { $gte: 4.5 }, count: { $gte: 5 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 }
    ]);
    const topRatedDrivers = await User.populate(driversWithHighRating, { path: '_id', select: 'name phone' });

    // Tỷ lệ hủy chuyến
    const totalBookings = await Booking.countDocuments();
    const cancelledBookings = await Booking.countDocuments({ status: 'HUY' });
    const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;

    // Thống kê theo thời gian (7 ngày)
    const dailyStats = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - i);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      const dayRatings = await Rating.find({
        type: 'CUSTOMER_TO_DRIVER',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const dayAvg = dayRatings.length > 0
        ? (dayRatings.reduce((sum, r) => sum + r.stars, 0) / dayRatings.length).toFixed(1)
        : 0;

      dailyStats.push({
        date: startDate.toISOString().split('T')[0],
        dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][startDate.getDay()],
        totalRatings: dayRatings.length,
        avgRating: parseFloat(dayAvg)
      });
    }

    res.status(200).json({
      overview: {
        totalRatings: allRatings.length,
        avgRating: parseFloat(avgRating),
        cancellationRate: parseFloat(cancellationRate)
      },
      ratingDistribution,
      popularTags,
      lowRatedDrivers: lowRatedDrivers.map(d => ({
        driver: d._id,
        avgRating: d.avgRating.toFixed(1),
        totalRatings: d.count
      })),
      topRatedDrivers: topRatedDrivers.map(d => ({
        driver: d._id,
        avgRating: d.avgRating.toFixed(1),
        totalRatings: d.count
      })),
      dailyStats
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ========== DUYỆT TÀI XẾ ==========

// Lấy danh sách tài xế chờ duyệt
exports.getPendingDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ 
      role: 'DRIVER', 
      driverApprovalStatus: 'PENDING' 
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.status(200).json({ drivers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy chi tiết hồ sơ tài xế chờ duyệt
exports.getPendingDriverDetail = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await User.findById(driverId).select('-password');

    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    res.status(200).json({ driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Duyệt tài xế
exports.approveDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    if (driver.driverApprovalStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Tài xế đã được duyệt trước đó' });
    }

    driver.driverApprovalStatus = 'APPROVED';
    driver.approvedBy = req.user._id;
    driver.approvedAt = new Date();
    driver.rejectionReason = '';
    await driver.save();

    res.status(200).json({ 
      message: 'Duyệt tài xế thành công',
      driver
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Từ chối tài xế
exports.rejectDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;
    
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({ message: 'Không tìm thấy tài xế' });
    }

    driver.driverApprovalStatus = 'REJECTED';
    driver.rejectionReason = reason || 'Hồ sơ không đạt yêu cầu';
    await driver.save();

    res.status(200).json({ 
      message: 'Đã từ chối tài xế',
      driver
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
