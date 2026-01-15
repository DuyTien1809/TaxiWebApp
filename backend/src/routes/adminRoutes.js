const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth');
const {
  getDashboardStats,
  getAllUsers,
  getAllBookings,
  getAllDrivers,
  getDriverDetail,
  updateDriverStatus,
  lockDriver,
  unlockDriver,
  getServiceQualityStats,
  getPendingDrivers,
  getPendingDriverDetail,
  approveDriver,
  rejectDriver
} = require('../controllers/adminController');

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/bookings', getAllBookings);

// Quản lý tài xế
router.get('/drivers', getAllDrivers);
router.get('/drivers/:driverId', getDriverDetail);
router.put('/drivers/:driverId/status', updateDriverStatus);
router.put('/drivers/:driverId/lock', lockDriver);
router.put('/drivers/:driverId/unlock', unlockDriver);

// Duyệt tài xế mới
router.get('/pending-drivers', getPendingDrivers);
router.get('/pending-drivers/:driverId', getPendingDriverDetail);
router.put('/pending-drivers/:driverId/approve', approveDriver);
router.put('/pending-drivers/:driverId/reject', rejectDriver);

// Chất lượng dịch vụ
router.get('/service-quality', getServiceQualityStats);

module.exports = router;
