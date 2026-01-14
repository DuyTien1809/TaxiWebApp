const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { username, password, role, name, phone, email } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username đã được sử dụng' });
    }

    const user = await User.create({ username, password, role, name, phone, email });
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập username và password' });
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Username hoặc password không đúng' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
