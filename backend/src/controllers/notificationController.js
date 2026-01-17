const Notification = require('../models/Notification');
const User = require('../models/User');

// Tạo thông báo cho nhiều người dùng
exports.createNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notificationData
    }));
    
    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error creating notifications:', error);
    return { success: false, error: error.message };
  }
};

// Tạo thông báo cho tất cả khách hàng
exports.notifyAllCustomers = async (notificationData) => {
  try {
    const customers = await User.find({ role: 'CUSTOMER' }).select('_id');
    const customerIds = customers.map(c => c._id);
    
    return await exports.createNotifications(customerIds, notificationData);
  } catch (error) {
    console.error('Error notifying customers:', error);
    return { success: false, error: error.message };
  }
};

// Lấy thông báo của user
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    
    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });
    
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Đếm số thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.status(200).json({ message: 'Đã đánh dấu đọc', notification });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Đánh dấu tất cả đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.status(200).json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    res.status(200).json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa tất cả thông báo đã đọc
exports.deleteAllRead = async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });
    
    res.status(200).json({ message: 'Đã xóa tất cả thông báo đã đọc' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
