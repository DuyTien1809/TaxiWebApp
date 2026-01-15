const Booking = require('../models/Booking');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Payment = require('../models/Payment');
const { createEarning } = require('./driverEarningController');
const { calculateDistance } = require('../utils/distance');

const MAX_PICKUP_DISTANCE_KM = 15; // Khoảng cách tối đa từ tài xế đến điểm đón (km)

exports.createBooking = async (req, res) => {
  try {
    const { pickup, dropoff, distance, duration, price, paymentMethod } = req.body;
    
    // Kiểm tra có booking chưa hoàn thành không
    const pendingBooking = await Booking.findOne({
      customerId: req.user._id,
      status: { $in: ['MOI_TAO', 'DA_NHAN', 'DANG_CHAY'] }
    });
    
    if (pendingBooking) {
      return res.status(400).json({ 
        message: 'Bạn đang có chuyến chưa hoàn thành. Vui lòng hoàn thành hoặc hủy chuyến hiện tại trước khi đặt chuyến mới.',
        code: 'PENDING_BOOKING_EXISTS'
      });
    }
    
    // Validate payment method
    if (!paymentMethod || !['TIEN_MAT', 'CHUYEN_KHOAN'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Vui lòng chọn phương thức thanh toán' });
    }
    
    // Nếu chọn chuyển khoản, kiểm tra ví đã liên kết và đủ tiền
    if (paymentMethod === 'CHUYEN_KHOAN') {
      const wallet = await Wallet.findOne({ userId: req.user._id });
      
      if (!wallet || !wallet.isLinked) {
        return res.status(400).json({ 
          message: 'Vui lòng liên kết tài khoản ngân hàng trước khi thanh toán chuyển khoản',
          code: 'WALLET_NOT_LINKED'
        });
      }
      
      if (wallet.balance < price) {
        return res.status(400).json({ 
          message: `Số dư ví không đủ. Số dư hiện tại: ${wallet.balance.toLocaleString()}đ`,
          code: 'INSUFFICIENT_BALANCE'
        });
      }
      
      // Trừ tiền từ ví
      wallet.balance -= price;
      wallet.transactions.push({
        type: 'THANH_TOAN',
        amount: -price,
        description: `Thanh toán chuyến xe: ${pickup.address} → ${dropoff.address}`
      });
      await wallet.save();
    }
    
    const booking = await Booking.create({
      customerId: req.user._id,
      pickup,
      dropoff,
      distance,
      duration,
      price,
      paymentMethod,
      paymentStatus: paymentMethod === 'CHUYEN_KHOAN' ? 'DA_THANH_TOAN' : 'CHUA_THANH_TOAN'
    });
    
    // Tạo payment record
    await Payment.create({
      bookingId: booking._id,
      amount: price,
      method: paymentMethod,
      status: paymentMethod === 'CHUYEN_KHOAN' ? 'DA_THANH_TOAN' : 'CHO_THANH_TOAN',
      paidAt: paymentMethod === 'CHUYEN_KHOAN' ? new Date() : null
    });
    
    res.status(201).json({ message: 'Tạo booking thành công', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    let filter = {};
    let bookings;
    
    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user._id;
      bookings = await Booking.find(filter)
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'DRIVER') {
      // Lấy vị trí hiện tại của tài xế
      const driver = await User.findById(req.user._id);
      const driverLocation = driver.currentLocation;
      
      // Lấy booking của tài xế hoặc booking mới
      const allBookings = await Booking.find({
        $or: [{ driverId: req.user._id }, { status: 'MOI_TAO' }]
      })
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone')
        .sort({ createdAt: -1 });
      
      // Lọc booking MOI_TAO theo khoảng cách
      bookings = allBookings.filter(b => {
        // Nếu là booking của tài xế này thì luôn hiển thị
        if (b.driverId && b.driverId._id.toString() === req.user._id.toString()) {
          return true;
        }
        
        // Nếu là booking MOI_TAO, kiểm tra khoảng cách
        if (b.status === 'MOI_TAO') {
          // Kiểm tra tài xế đã từ chối chuyến này chưa
          if (b.rejectedDrivers && b.rejectedDrivers.some(
            r => r.driverId && r.driverId.toString() === req.user._id.toString()
          )) {
            return false; // Không hiển thị chuyến đã từ chối
          }
          
          // Nếu tài xế chưa có vị trí, không hiển thị booking mới
          if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
            return false;
          }
          
          // Tính khoảng cách từ tài xế đến điểm đón
          const distance = calculateDistance(
            driverLocation.lat,
            driverLocation.lng,
            b.pickup.lat,
            b.pickup.lng
          );
          
          // Chỉ hiển thị nếu trong bán kính cho phép
          return distance <= MAX_PICKUP_DISTANCE_KM;
        }
        
        return false;
      });
      
      // Thêm thông tin khoảng cách vào mỗi booking MOI_TAO
      bookings = bookings.map(b => {
        const bookingObj = b.toObject();
        if (b.status === 'MOI_TAO' && driverLocation && driverLocation.lat) {
          bookingObj.distanceToPickup = calculateDistance(
            driverLocation.lat,
            driverLocation.lng,
            b.pickup.lat,
            b.pickup.lng
          );
        }
        return bookingObj;
      });
    } else {
      // Admin: xem tất cả
      bookings = await Booking.find()
        .populate('customerId', 'name phone')
        .populate('driverId', 'name phone')
        .sort({ createdAt: -1 });
    }
    
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone');
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    res.status(200).json({ booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    if (booking.status !== 'MOI_TAO') {
      return res.status(400).json({ message: 'Booking đã được nhận hoặc đã hủy' });
    }
    booking.driverId = req.user._id;
    booking.status = 'DA_NHAN';
    await booking.save();
    await User.findByIdAndUpdate(req.user._id, { driverStatus: 'BAN' });
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone');
    
    res.status(200).json({ message: 'Nhận booking thành công', booking: populatedBooking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.startTrip = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    if (booking.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không phải driver của booking này' });
    }
    if (booking.status !== 'DA_NHAN') {
      return res.status(400).json({ message: 'Không thể bắt đầu chuyến này' });
    }
    booking.status = 'DANG_CHAY';
    await booking.save();
    res.status(200).json({ message: 'Bắt đầu chuyến thành công', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDriverLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    if (booking.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không phải driver của booking này' });
    }
    booking.driverLocation = { lat, lng };
    await booking.save();
    res.status(200).json({ message: 'Cập nhật vị trí thành công', driverLocation: booking.driverLocation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    if (booking.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không phải driver của booking này' });
    }
    if (booking.status !== 'DA_NHAN' && booking.status !== 'DANG_CHAY') {
      return res.status(400).json({ message: 'Không thể hoàn thành booking này' });
    }
    booking.status = 'HOAN_THANH';
    await booking.save();
    await User.findByIdAndUpdate(req.user._id, { driverStatus: 'RANH' });
    
    // Tạo earning cho tài xế
    await createEarning(booking);
    
    res.status(200).json({ message: 'Hoàn thành booking thành công', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    if (booking.status === 'HOAN_THANH' || booking.status === 'HUY') {
      return res.status(400).json({ message: 'Không thể hủy booking này' });
    }
    if (booking.driverId) {
      await User.findByIdAndUpdate(booking.driverId, { driverStatus: 'RANH' });
    }
    booking.status = 'HUY';
    await booking.save();
    res.status(200).json({ message: 'Hủy booking thành công', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tài xế từ chối chuyến (sau khi đã nhận) - chuyến quay lại tìm tài xế mới
exports.rejectBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    
    // Chỉ tài xế đã nhận chuyến mới có thể từ chối
    if (!booking.driverId || booking.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không phải tài xế của chuyến này' });
    }
    
    // Chỉ có thể từ chối khi đang ở trạng thái DA_NHAN (chưa bắt đầu chạy)
    if (booking.status !== 'DA_NHAN') {
      return res.status(400).json({ 
        message: 'Chỉ có thể từ chối chuyến khi chưa bắt đầu di chuyển' 
      });
    }
    
    // Lưu lịch sử tài xế đã từ chối
    if (!booking.rejectedDrivers) {
      booking.rejectedDrivers = [];
    }
    booking.rejectedDrivers.push({
      driverId: req.user._id,
      reason: reason || '',
      rejectedAt: new Date()
    });
    
    // Reset booking về trạng thái tìm tài xế
    booking.driverId = null;
    booking.status = 'MOI_TAO';
    booking.driverLocation = undefined;
    await booking.save();
    
    // Cập nhật trạng thái tài xế về rảnh
    await User.findByIdAndUpdate(req.user._id, { driverStatus: 'RANH' });
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customerId', 'name phone');
    
    res.status(200).json({ 
      message: 'Đã từ chối chuyến. Chuyến sẽ được gửi đến tài xế khác.',
      booking: populatedBooking
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
