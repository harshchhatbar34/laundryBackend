import Notification from './notification.model';
import type { Types } from 'mongoose';

interface CreateNotificationInput {
  title: string;
  body: string;
  type?: 'order' | 'system' | 'payment';
  refId?: Types.ObjectId | string | null;
}

export const createNotification = async (
  userId: Types.ObjectId | string,
  data: CreateNotificationInput
) => {
  return Notification.create({
    user: userId,
    title: data.title,
    body: data.body,
    type: data.type ?? 'order',
    refId: data.refId ?? null,
  });
};

export const getUserNotifications = async (
  userId: Types.ObjectId | string,
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);
  return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
};

export const markAllRead = async (userId: Types.ObjectId | string) => {
  await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
};
