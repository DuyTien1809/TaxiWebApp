const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createRating,
  getUserRatings,
  getBookingRatings,
  getPendingRatingsCount
} = require('../controllers/ratingController');

router.use(protect);

router.post('/', createRating);
router.get('/pending-count', getPendingRatingsCount);
router.get('/user/:userId', getUserRatings);
router.get('/booking/:bookingId', getBookingRatings);

module.exports = router;
