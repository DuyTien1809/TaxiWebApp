const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/auth');

router.post('/', protect, restrictTo('CUSTOMER'), paymentController.createPayment);
router.get('/:bookingId', protect, paymentController.getPaymentByBooking);
router.put('/:bookingId/xac-nhan-tien-mat', protect, restrictTo('DRIVER'), paymentController.confirmCashPayment);

module.exports = router;
