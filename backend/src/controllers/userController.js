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
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar, birthday, address } = req.body;
    
    const updateData = { name, phone };
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;
    if (birthday) updateData.birthday = birthday;
    if (address) updateData.address = address;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    
    res.status(200).json({ message: 'Cập nhật thông tin thành công', user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: error.message });
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

// Cập nhật vị trí tài xế
exports.updateDriverLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp vị trí' });
    }
    
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ message: 'Chỉ tài xế mới có thể cập nhật vị trí' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        currentLocation: { 
          lat, 
          lng, 
          updatedAt: new Date() 
        } 
      },
      { new: true }
    );
    
    res.status(200).json({ 
      message: 'Cập nhật vị trí thành công', 
      currentLocation: user.currentLocation 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy vị trí tài xế
exports.getDriverLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ currentLocation: user.currentLocation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ========== ĐĂNG KÝ TÀI XẾ ==========

// Tài xế đồng ý nội quy
exports.agreeToRules = async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ message: 'Chỉ tài xế mới có thể thực hiện' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        agreedToRules: true,
        agreedToRulesAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({ 
      message: 'Đã đồng ý nội quy',
      user: {
        id: user._id,
        agreedToRules: user.agreedToRules,
        driverApprovalStatus: user.driverApprovalStatus
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tài xế cập nhật hồ sơ
exports.updateDriverProfile = async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') {
      return res.status(403).json({ message: 'Chỉ tài xế mới có thể thực hiện' });
    }

    const { driverInfo, birthday, address } = req.body;

    const updateData = {
      driverInfo,
      driverApprovalStatus: 'PENDING' // Reset về pending khi cập nhật
    };
    
    if (birthday) updateData.birthday = birthday;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    res.status(200).json({ 
      message: 'Cập nhật hồ sơ thành công. Vui lòng chờ admin duyệt.',
      user
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy thông tin hồ sơ tài xế
exports.getDriverProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({ 
      user: {
        ...user.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
