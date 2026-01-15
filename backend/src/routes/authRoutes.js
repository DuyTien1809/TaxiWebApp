const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/check-phone', authController.checkPhone);
router.post('/reset-password-by-phone', authController.resetPasswordByPhone);

module.exports = router;
