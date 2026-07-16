import Notification from './notification.model';
import User from '../user/user.model';
import type { Types } from 'mongoose';
import { getFirebaseMessaging } from '../../config/firebase';

interface CreateNotificationInput {
  title: string;
  body: string;
  type?: 'order' | 'system' | 'payment';
  refId?: Types.ObjectId | string | null;
}

/**
 * Sends a real-time push notification via Firebase Admin SDK (FCM).
 * Works with both Android standalone APK builds and iOS — no Expo account needed.
 */
const sendFCMPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>
) => {
  try {
    const messaging = getFirebaseMessaging();

    const message: any = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`[FCM] Notification sent successfully. MessageId=${response}`);
  } catch (error: any) {
    console.error(`[FCM] Failed to send notification to token=${fcmToken}:`, error?.message ?? error);
  }
};

export const createNotification = async (
  userId: Types.ObjectId | string,
  data: CreateNotificationInput
) => {
  // 1. Save notification record in MongoDB
  const dbNotification = await Notification.create({
    user: userId,
    title: data.title,
    body: data.body,
    type: data.type ?? 'order',
    refId: data.refId ?? null,
  });

  // 2. Dispatch real-time FCM push notification asynchronously (non-blocking)
  User.findById(userId)
    .select('pushToken')
    .then((user) => {
      if (user?.pushToken) {
        // Build the data payload — all values must be strings for FCM
        const pushData: Record<string, string> = {};
        if (data.refId) pushData.orderId = String(data.refId);
        if (data.type) pushData.type = data.type;

        sendFCMPushNotification(user.pushToken, data.title, data.body, pushData);
      }
    })
    .catch((err) => {
      console.error(`[FCM] Error looking up user=${userId} for push notification:`, err);
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
