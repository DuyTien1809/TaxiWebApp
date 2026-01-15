const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getEarningSummary,
  getEarningDetail,
  addTip,
  addBonus,
  getCompletedTrips
} = require('../controllers/driverEarningController');

router.use(protect);

router.get('/summary', getEarningSummary);
router.get('/trips', getCompletedTrips);
router.get('/:id', getEarningDetail);
router.post('/tip', addTip);
router.post('/bonus', addBonus);

module.exports = router;
