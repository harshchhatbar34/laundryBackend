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
 * Returns { success, messageId?, error? }
 */
const sendFCMPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
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
    const messageId = await messaging.send(message);
    console.log(`[FCM] ✅ Sent successfully. MessageId=${messageId} | Title="${title}"`);
    return { success: true, messageId };
  } catch (error: any) {
    const errMsg = error?.message ?? String(error);
    console.error(`[FCM] ❌ Failed to send | Title="${title}" | Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

/**
 * Sends via Expo Push API — for Expo Go (iOS owner device).
 * Returns { success, error? }
 */
const sendExpoPushNotification = async (
  expoToken: string,
  title: string,
  body: string,
  data: any
): Promise<{ success: boolean; error?: string }> => {
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
    // Expo API can return status 200 but with errors in the body
    const result = res.data?.data;
    if (result?.status === 'error') {
      const errMsg = result?.message || 'Unknown Expo push error';
      console.error(`[EXPO PUSH] ❌ Expo rejected push | Title="${title}" | Error: ${errMsg}`);
      return { success: false, error: errMsg };
    }
    console.log(`[EXPO PUSH] ✅ Sent successfully. Status=${res.status} | Title="${title}"`);
    return { success: true };
  } catch (error: any) {
    const errMsg = error?.response?.data ? JSON.stringify(error.response.data) : error?.message;
    console.error(`[EXPO PUSH] ❌ Failed to send | Title="${title}" | Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

export const createNotification = async (
  userId: Types.ObjectId | string,
  data: CreateNotificationInput
) => {
  // 1. Save notification record in MongoDB (starts as 'pending')
  const dbNotification = await Notification.create({
    user: userId,
    title: data.title,
    body: data.body,
    type: data.type ?? 'order',
    refId: data.refId ?? null,
    pushStatus: 'pending',
  });

  const notifId = dbNotification._id;

  // 2. Dispatch push notification asynchronously (non-blocking)
  User.findById(userId)
    .select('pushToken name')
    .then(async (user) => {
      const userName = (user as any)?.name || String(userId);

      if (!user?.pushToken) {
        // No token — user has not granted notification permission yet
        console.warn(`[PUSH] ⚠️ Skipped | User="${userName}" (${userId}) has no pushToken | Title="${data.title}"`);
        await Notification.findByIdAndUpdate(notifId, {
          pushStatus: 'skipped',
          pushError: 'No push token registered for this user',
        });
        return;
      }

      const pushData: Record<string, string> = {};
      if (data.refId) pushData.orderId = String(data.refId);
      if (data.type) pushData.type = data.type;

      let result: { success: boolean; error?: string };
      let channel: 'fcm' | 'expo';

      if (user.pushToken.startsWith('ExponentPushToken[')) {
        // iOS Expo Go — use Expo Push API
        channel = 'expo';
        console.log(`[PUSH] 📤 Sending via Expo Push API | User="${userName}" | Title="${data.title}"`);
        result = await sendExpoPushNotification(user.pushToken, data.title, data.body, pushData);
      } else {
        // Standalone Android/iOS build — use Firebase Admin SDK (FCM)
        channel = 'fcm';
        console.log(`[PUSH] 📤 Sending via Firebase FCM | User="${userName}" | Title="${data.title}"`);
        result = await sendFCMPushNotification(user.pushToken, data.title, data.body, pushData);
      }

      // 3. Update the DB record with the actual push delivery status
      await Notification.findByIdAndUpdate(notifId, {
        pushStatus: result.success ? 'sent' : 'failed',
        pushChannel: channel,
        pushError: result.success ? null : (result.error || 'Unknown error'),
      });
    })
    .catch(async (err) => {
      const errMsg = err?.message ?? String(err);
      console.error(`[PUSH] ❌ Error looking up user=${userId}:`, errMsg);
      await Notification.findByIdAndUpdate(notifId, {
        pushStatus: 'failed',
        pushError: `User lookup failed: ${errMsg}`,
      });
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
