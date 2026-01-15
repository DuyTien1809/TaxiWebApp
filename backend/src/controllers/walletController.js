const Wallet = require('../models/Wallet');

// Lấy thông tin ví
exports.getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    
    res.status(200).json({ wallet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Liên kết tài khoản ngân hàng
exports.linkBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountHolder } = req.body;
    
    if (!bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    
    wallet.bankAccount = { bankName, accountNumber, accountHolder };
    wallet.isLinked = true;
    await wallet.save();
    
    res.status(200).json({ message: 'Liên kết tài khoản thành công', wallet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hủy liên kết tài khoản
exports.unlinkBankAccount = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Ví không tồn tại' });
    }
    
    wallet.bankAccount = { bankName: '', accountNumber: '', accountHolder: '' };
    wallet.isLinked = false;
    await wallet.save();
    
    res.status(200).json({ message: 'Hủy liên kết thành công', wallet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Nạp tiền vào ví (giả lập)
exports.topUp = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }
    
    let wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }
    
    wallet.balance += amount;
    wallet.transactions.push({
      type: 'NAP_TIEN',
      amount,
      description: 'Nạp tiền vào ví'
    });
    await wallet.save();
    
    res.status(200).json({ message: 'Nạp tiền thành công', wallet });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy lịch sử giao dịch
exports.getTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      return res.status(200).json({ transactions: [] });
    }
    
    const transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json({ transactions, balance: wallet.balance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Rút tiền về tài khoản ngân hàng (cho tài xế)
exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }
    
    if (amount < 50000) {
      return res.status(400).json({ message: 'Số tiền rút tối thiểu là 50,000đ' });
    }
    
    const wallet = await Wallet.findOne({ userId: req.user._id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Ví không tồn tại' });
    }
    
    if (!wallet.isLinked) {
      return res.status(400).json({ message: 'Vui lòng liên kết tài khoản ngân hàng trước khi rút tiền' });
    }
    
    if (wallet.balance < amount) {
      return res.status(400).json({ message: `Số dư không đủ. Số dư hiện tại: ${wallet.balance.toLocaleString()}đ` });
    }
    
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'RUT_TIEN',
      amount: -amount,
      description: `Rút tiền về ${wallet.bankAccount.bankName} - ${wallet.bankAccount.accountNumber}`
    });
    await wallet.save();
    
    res.status(200).json({ 
      message: `Rút ${amount.toLocaleString()}đ thành công. Tiền sẽ về tài khoản trong 1-3 ngày làm việc.`, 
      wallet 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Thêm thu nhập vào ví tài xế (gọi từ driverEarningController)
exports.addDriverEarning = async (driverId, amount, description, bookingId) => {
  try {
    let wallet = await Wallet.findOne({ userId: driverId });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId: driverId });
    }
    
    wallet.balance += amount;
    wallet.transactions.push({
      type: 'THU_NHAP',
      amount,
      description,
      bookingId
    });
    await wallet.save();
    
    return wallet;
  } catch (error) {
    console.error('Error adding driver earning:', error);
    throw error;
  }
};
