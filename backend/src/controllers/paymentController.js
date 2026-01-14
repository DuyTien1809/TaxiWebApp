const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

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

    const existingPayment = await Payment.findOne({ bookingId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Booking này đã có payment' });
    }

    const payment = await Payment.create({
      bookingId,
      amount: booking.price,
      method
    });

    if (method === 'TIEN_MAT') {
      payment.status = 'DA_THANH_TOAN';
      payment.paidAt = new Date();
    } else {
      const isSuccess = Math.random() > 0.2;
      payment.status = isSuccess ? 'DA_THANH_TOAN' : 'THAT_BAI';
      if (isSuccess) payment.paidAt = new Date();
    }
    await payment.save();

    res.status(201).json({ message: 'Tạo payment thành công', payment });
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
