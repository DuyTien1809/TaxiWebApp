const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middlewares/auth');

router.post('/', protect, restrictTo('CUSTOMER'), bookingController.createBooking);
router.get('/', protect, bookingController.getBookings);
router.get('/:id', protect, bookingController.getBookingById);
router.put('/:id/nhan', protect, restrictTo('DRIVER'), bookingController.acceptBooking);
router.put('/:id/bat-dau', protect, restrictTo('DRIVER'), bookingController.startTrip);
router.put('/:id/vi-tri', protect, restrictTo('DRIVER'), bookingController.updateDriverLocation);
router.put('/:id/hoan-thanh', protect, restrictTo('DRIVER'), bookingController.completeBooking);
router.put('/:id/huy', protect, bookingController.cancelBooking);

module.exports = router;
