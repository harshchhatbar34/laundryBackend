import mongoose, { Schema } from 'mongoose';
import type { INotification } from '@/types';

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['order', 'system', 'payment'], default: 'order' },
    refId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
    // Push delivery tracking
    pushStatus: { type: String, enum: ['sent', 'failed', 'skipped', 'pending'], default: 'pending' },
    pushError: { type: String, default: null }, // stores error message if pushStatus === 'failed'
    pushChannel: { type: String, enum: ['fcm', 'expo', null], default: null }, // which channel was used
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
