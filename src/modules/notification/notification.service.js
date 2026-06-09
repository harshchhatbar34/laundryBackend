const Notification = require('./notification.model');

const createNotification = async (userId, { title, body, type = 'system', refId = null }) => {
  return Notification.create({ user: userId, title, body, type, refId });
};

const getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);
  return { notifications, total, unreadCount, page, limit };
};

const markAsRead = async (notificationId, userId) => {
  const n = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  if (!n) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  return n;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
};

module.exports = { createNotification, getUserNotifications, markAsRead, markAllAsRead };
