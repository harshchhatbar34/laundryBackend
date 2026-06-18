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
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
