const Booking = require('../models/Booking');
const User = require('../models/User');

exports.createBooking = async (req, res) => {
  try {
    const { pickup, dropoff, distance, duration, price } = req.body;
    const booking = await Booking.create({
      customerId: req.user._id,
      pickup,
      dropoff,
      distance,
      duration,
      price
    });
    res.status(201).json({ message: 'Tạo booking thành công', booking });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'DRIVER') {
      filter.$or = [{ driverId: req.user._id }, { status: 'MOI_TAO' }];
    }
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });
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
