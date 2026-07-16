import Notification from './notification.model';
import User from '../user/user.model';
import axios from 'axios';
import type { Types } from 'mongoose';

interface CreateNotificationInput {
  title: string;
  body: string;
  type?: 'order' | 'system' | 'payment';
  refId?: Types.ObjectId | string | null;
}

/**
 * Sends a real-time push notification via Expo Push Notification API.
 */
const sendExpoPushNotification = async (
  pushToken: string,
  title: string,
  body: string,
  data: any
) => {
  try {
    const payload = {
      to: pushToken,
      title,
      body,
      sound: 'default',
      data,
    };

    const res = await axios.post('https://exp.host/--/api/v2/push/send', payload, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });

    console.log(`[PUSH] Dispatched successfully to token=${pushToken}, status=${res.status}`);
  } catch (error: any) {
    console.error(`[PUSH] Failed to deliver push to token=${pushToken}`, error?.response?.data || error?.message);
  }
};

export const createNotification = async (
  userId: Types.ObjectId | string,
  data: CreateNotificationInput
) => {
  // 1. Create the database record
  const dbNotification = await Notification.create({
    user: userId,
    title: data.title,
    body: data.body,
    type: data.type ?? 'order',
    refId: data.refId ?? null,
  });

  // 2. Dispatch real-time mobile push notification asynchronously
  User.findById(userId)
    .select('pushToken')
    .then((user) => {
      if (user?.pushToken && user.pushToken.startsWith('ExponentPushToken[')) {
        // Pass refId as orderId in data block for mobile app redirection
        const pushData = data.refId ? { orderId: String(data.refId) } : {};
        sendExpoPushNotification(user.pushToken, data.title, data.body, pushData);
      }
    })
    .catch((err) => {
      console.error(`[PUSH] Error looking up user=${userId} for push notification:`, err);
    });

  return dbNotification;
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
