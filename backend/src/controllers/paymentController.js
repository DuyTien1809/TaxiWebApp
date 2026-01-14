const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// Customer tạo thanh toán
exports.createPayment = async (req, res) => {
  try {
    const { bookingId, method } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không phải customer của booking này' });
    }

    if (booking.status !== 'HOAN_THANH') {
      return res.status(400).json({ message: 'Chỉ có thể thanh toán booking đã hoàn thành' });
    }

    if (booking.paymentStatus === 'DA_THANH_TOAN') {
      return res.status(400).json({ message: 'Booking này đã được thanh toán' });
    }

    // Kiểm tra payment đã tồn tại
    let payment = await Payment.findOne({ bookingId });
    
    if (payment && payment.status === 'DA_THANH_TOAN') {
      return res.status(400).json({ message: 'Booking này đã có payment thành công' });
    }

    // Tạo hoặc cập nhật payment
    if (!payment) {
      payment = await Payment.create({
        bookingId,
        amount: booking.price,
        method,
        status: 'CHO_THANH_TOAN'
      });
    } else {
      payment.method = method;
      payment.status = 'CHO_THANH_TOAN';
    }

    // Xử lý theo phương thức thanh toán
    if (method === 'TIEN_MAT') {
      // Tiền mặt: chờ tài xế xác nhận
      payment.status = 'CHO_THANH_TOAN';
      booking.paymentStatus = 'CHO_XAC_NHAN';
      booking.paymentMethod = 'TIEN_MAT';
    } else {
      // Online: giả lập thanh toán thành công (trong thực tế sẽ redirect đến cổng thanh toán)
      payment.status = 'DA_THANH_TOAN';
      payment.paidAt = new Date();
      booking.paymentStatus = 'DA_THANH_TOAN';
      booking.paymentMethod = 'ONLINE';
    }
    
    await payment.save();
    await booking.save();

    res.status(201).json({ 
      message: method === 'TIEN_MAT' 
        ? 'Vui lòng thanh toán tiền mặt cho tài xế' 
        : 'Thanh toán online thành công',
      payment,
      booking
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tài xế xác nhận đã nhận tiền mặt
exports.confirmCashPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }

    // Kiểm tra tài xế
    if (booking.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không phải tài xế của booking này' });
    }

    if (booking.paymentMethod !== 'TIEN_MAT') {
      return res.status(400).json({ message: 'Booking này không thanh toán tiền mặt' });
    }

    if (booking.paymentStatus === 'DA_THANH_TOAN') {
      return res.status(400).json({ message: 'Booking này đã được xác nhận thanh toán' });
    }

    // Cập nhật payment
    const payment = await Payment.findOne({ bookingId });
    if (payment) {
      payment.status = 'DA_THANH_TOAN';
      payment.paidAt = new Date();
      await payment.save();
    }

    // Cập nhật booking
    booking.paymentStatus = 'DA_THANH_TOAN';
    await booking.save();

    res.status(200).json({ 
      message: 'Xác nhận nhận tiền thành công',
      booking,
      payment
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPaymentByBooking = async (req, res) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId })
      .populate('bookingId');

    if (!payment) {
      return res.status(404).json({ message: 'Payment không tồn tại' });
    }

    res.status(200).json({ payment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
