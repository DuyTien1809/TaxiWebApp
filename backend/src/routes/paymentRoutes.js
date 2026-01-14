const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/auth');

router.post('/', protect, restrictTo('CUSTOMER'), paymentController.createPayment);
router.get('/:bookingId', protect, paymentController.getPaymentByBooking);

module.exports = router;
