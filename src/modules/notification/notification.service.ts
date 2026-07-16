import Notification from './notification.model';
import User from '../user/user.model';
import type { Types } from 'mongoose';
import { getFirebaseMessaging } from '../../config/firebase';
import axios from 'axios';

interface CreateNotificationInput {
  title: string;
  body: string;
  type?: 'order' | 'system' | 'payment';
  refId?: Types.ObjectId | string | null;
}

/**
 * Sends via Firebase Admin SDK (FCM) — for standalone Android/iOS builds.
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
      notification: { title, body },
      data,
      android: {
        priority: 'high' as const,
        notification: { sound: 'default', channelId: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };
    const response = await messaging.send(message);
    console.log(`[FCM] Sent successfully. MessageId=${response}`);
  } catch (error: any) {
    console.error(`[FCM] Failed to send:`, error?.message ?? error);
  }
};

/**
 * Sends via Expo Push API — for Expo Go (iOS owner device).
 */
const sendExpoPushNotification = async (
  expoToken: string,
  title: string,
  body: string,
  data: any
) => {
  try {
    const payload = {
      to: expoToken,
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
    console.log(`[EXPO PUSH] Sent successfully. Status=${res.status}`);
  } catch (error: any) {
    console.error(`[EXPO PUSH] Failed to send:`, error?.response?.data || error?.message);
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

  // 2. Dispatch push notification asynchronously (non-blocking)
  User.findById(userId)
    .select('pushToken')
    .then((user) => {
      if (!user?.pushToken) return;

      const pushData: Record<string, string> = {};
      if (data.refId) pushData.orderId = String(data.refId);
      if (data.type) pushData.type = data.type;

      if (user.pushToken.startsWith('ExponentPushToken[')) {
        // iOS Expo Go — use Expo Push API
        console.log(`[PUSH] Routing to Expo Push API (Expo Go device)`);
        sendExpoPushNotification(user.pushToken, data.title, data.body, pushData);
      } else {
        // Standalone Android/iOS build — use Firebase Admin SDK
        console.log(`[PUSH] Routing to Firebase FCM (standalone build)`);
        sendFCMPushNotification(user.pushToken, data.title, data.body, pushData);
      }
    })
    .catch((err) => {
      console.error(`[PUSH] Error looking up user=${userId}:`, err);
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
