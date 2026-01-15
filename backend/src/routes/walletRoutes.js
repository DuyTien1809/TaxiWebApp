const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getWallet,
  linkBankAccount,
  unlinkBankAccount,
  topUp,
  getTransactions,
  withdraw
} = require('../controllers/walletController');

router.use(protect);

router.get('/', getWallet);
router.post('/link-bank', linkBankAccount);
router.post('/unlink-bank', unlinkBankAccount);
router.post('/top-up', topUp);
router.post('/withdraw', withdraw);
router.get('/transactions', getTransactions);

module.exports = router;
