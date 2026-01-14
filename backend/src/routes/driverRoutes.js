const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/auth');

router.put('/:id/free', protect, restrictTo('DRIVER', 'ADMIN'), userController.setDriverFree);
router.put('/:id/busy', protect, restrictTo('DRIVER', 'ADMIN'), userController.setDriverBusy);

module.exports = router;
