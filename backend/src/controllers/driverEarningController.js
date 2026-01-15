const DriverEarning = require('../models/DriverEarning');
const Booking = require('../models/Booking');
const { addDriverEarning } = require('./walletController');

const PLATFORM_FEE_PERCENT = 20; // 20% chiết khấu

// Tạo earning khi booking hoàn thành (gọi từ bookingController)
exports.createEarning = async (booking) => {
  const fareAmount = booking.price;
  const platformFeeAmount = Math.round(fareAmount * PLATFORM_FEE_PERCENT / 100);
  const netEarning = fareAmount - platformFeeAmount;
  
  const earning = await DriverEarning.create({
    driverId: booking.driverId,
    bookingId: booking._id,
    fareAmount,
    platformFeePercent: PLATFORM_FEE_PERCENT,
    platformFeeAmount,
    netEarning,
    totalEarning: netEarning,
    distance: booking.distance,
    duration: booking.duration
  });
  
  // Thêm tiền vào ví tài xế
  await addDriverEarning(
    booking.driverId,
    netEarning,
    `Thu nhập chuyến xe #${booking._id.toString().slice(-6)}`,
    booking._id
  );
  
  return earning;
};

// Lấy tổng quan thu nhập của tài xế
exports.getEarningSummary = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    // Lấy tất cả earnings
    const earnings = await DriverEarning.find({ driverId })
      .populate('bookingId', 'pickup dropoff status paymentStatus paymentMethod createdAt')
      .sort({ createdAt: -1 });
    
    // Tính tổng
    const totalFare = earnings.reduce((sum, e) => sum + e.fareAmount, 0);
    const totalPlatformFee = earnings.reduce((sum, e) => sum + e.platformFeeAmount, 0);
    const totalNetEarning = earnings.reduce((sum, e) => sum + e.netEarning, 0);
    const totalBonus = earnings.reduce((sum, e) => sum + e.bonus, 0);
    const totalTip = earnings.reduce((sum, e) => sum + e.tip, 0);
    const totalEarning = earnings.reduce((sum, e) => sum + e.totalEarning, 0);
    const totalDistance = earnings.reduce((sum, e) => sum + e.distance, 0);
    const totalDuration = earnings.reduce((sum, e) => sum + e.duration, 0);
    const totalTrips = earnings.length;

    // Thống kê theo ngày (7 ngày gần nhất)
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayEarnings = earnings.filter(e => {
        const eDate = new Date(e.createdAt);
        return eDate >= date && eDate < nextDate;
      });
      
      last7Days.push({
        date: date.toISOString().split('T')[0],
        dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
        trips: dayEarnings.length,
        earning: dayEarnings.reduce((sum, e) => sum + e.totalEarning, 0)
      });
    }

    // Thống kê hôm nay
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEarnings = earnings.filter(e => new Date(e.createdAt) >= todayStart);
    const todayStats = {
      trips: todayEarnings.length,
      fare: todayEarnings.reduce((sum, e) => sum + e.fareAmount, 0),
      netEarning: todayEarnings.reduce((sum, e) => sum + e.netEarning, 0),
      bonus: todayEarnings.reduce((sum, e) => sum + e.bonus, 0),
      tip: todayEarnings.reduce((sum, e) => sum + e.tip, 0),
      total: todayEarnings.reduce((sum, e) => sum + e.totalEarning, 0),
      distance: todayEarnings.reduce((sum, e) => sum + e.distance, 0)
    };

    res.status(200).json({
      summary: {
        totalFare,
        totalPlatformFee,
        totalNetEarning,
        totalBonus,
        totalTip,
        totalEarning,
        totalDistance,
        totalDuration,
        totalTrips,
        platformFeePercent: PLATFORM_FEE_PERCENT
      },
      todayStats,
      last7Days,
      earnings
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Lấy chi tiết một earning
exports.getEarningDetail = async (req, res) => {
  try {
    const earning = await DriverEarning.findById(req.params.id)
      .populate('bookingId')
      .populate('driverId', 'name phone');
    
    if (!earning) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thu nhập' });
    }
    
    if (earning.driverId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền xem thông tin này' });
    }
    
    res.status(200).json({ earning });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Thêm tip cho tài xế (từ khách)
exports.addTip = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Số tiền tip không hợp lệ' });
    }
    
    const earning = await DriverEarning.findOne({ bookingId });
    if (!earning) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin chuyến' });
    }
    
    earning.tip += amount;
    earning.totalEarning = earning.netEarning + earning.bonus + earning.tip;
    await earning.save();
    
    res.status(200).json({ message: 'Thêm tip thành công', earning });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Thêm bonus cho tài xế (admin)
exports.addBonus = async (req, res) => {
  try {
    const { earningId, amount, reason } = req.body;
    
    const earning = await DriverEarning.findById(earningId);
    if (!earning) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin thu nhập' });
    }
    
    earning.bonus += amount;
    earning.bonusReason = reason || earning.bonusReason;
    earning.totalEarning = earning.netEarning + earning.bonus + earning.tip;
    await earning.save();
    
    res.status(200).json({ message: 'Thêm bonus thành công', earning });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy lịch sử chuyến đã hoàn thành của tài xế
exports.getCompletedTrips = async (req, res) => {
  try {
    const driverId = req.user._id;
    
    const earnings = await DriverEarning.find({ driverId })
      .populate({
        path: 'bookingId',
        populate: { path: 'customerId', select: 'name phone' }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ trips: earnings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
