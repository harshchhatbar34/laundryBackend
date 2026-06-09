const { getUserNotifications, markAsRead, markAllAsRead } = require('./notification.service');
const { sendSuccess, sendPaginated } = require('../../utils/apiResponse');

const list = async (req, res, next) => {
  try {
    const result = await getUserNotifications(req.user._id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    sendPaginated(res, 'Notifications fetched', result.notifications, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      unreadCount: result.unreadCount,
    });
  } catch (e) { next(e); }
};

const readOne = async (req, res, next) => {
  try {
    const n = await markAsRead(req.params.id, req.user._id);
    sendSuccess(res, 200, 'Marked as read', { notification: n });
  } catch (e) { next(e); }
};

const readAll = async (req, res, next) => {
  try {
    await markAllAsRead(req.user._id);
    sendSuccess(res, 200, 'All notifications marked as read');
  } catch (e) { next(e); }
};

module.exports = { list, readOne, readAll };
