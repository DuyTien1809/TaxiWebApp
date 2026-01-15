const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/auth');

router.post('/', userController.createUser);
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/change-password', protect, userController.changePassword);
router.put('/location', protect, userController.updateDriverLocation);
router.get('/location', protect, userController.getDriverLocation);

// Routes cho đăng ký tài xế
router.post('/driver/agree-rules', protect, restrictTo('DRIVER'), userController.agreeToRules);
router.put('/driver/profile', protect, restrictTo('DRIVER'), userController.updateDriverProfile);
router.get('/driver/profile', protect, restrictTo('DRIVER'), userController.getDriverProfile);

router.get('/:id', protect, userController.getUser);

module.exports = router;
