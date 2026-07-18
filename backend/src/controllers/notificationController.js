const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
};

exports.markAsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
};

exports.markOneAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
};

exports.deleteNotification = async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notification deleted.' });
};
