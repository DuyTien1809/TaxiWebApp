const express = require('express');
const router = express.Router();
const priceConfigController = require('../controllers/priceConfigController');
const { protect, restrictTo } = require('../middlewares/auth');

// Public routes
router.get('/current', priceConfigController.getCurrentPrice);
router.post('/calculate', priceConfigController.calculatePrice);

// Admin only routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', priceConfigController.getAllPriceConfigs);
router.get('/:year/:month', priceConfigController.getPriceByMonth);
router.post('/', priceConfigController.createOrUpdatePrice);
router.delete('/:id', priceConfigController.deletePriceConfig);

module.exports = router;
