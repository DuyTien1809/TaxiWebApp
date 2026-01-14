const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ message: 'Tạo user thành công', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar, birthday, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone, avatar, birthday, address },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ message: 'Cập nhật thông tin thành công', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.setDriverFree = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({ message: 'Driver không tồn tại' });
    }
    driver.driverStatus = 'RANH';
    await driver.save();
    res.status(200).json({ message: 'Cập nhật trạng thái RẢNH thành công', driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.setDriverBusy = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id);
    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({ message: 'Driver không tồn tại' });
    }
    driver.driverStatus = 'BAN';
    await driver.save();
    res.status(200).json({ message: 'Cập nhật trạng thái BẬN thành công', driver });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
