import mongoose, { Schema } from 'mongoose';
import type { ISubscriptionRecord } from '@/types';

const subscriptionRecordSchema = new Schema<ISubscriptionRecord>(
  {
    tenant:           { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    owner:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionType: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount:           { type: Number, required: true },
    startDate:        { type: Date, required: true },
    dueDate:          { type: Date, required: true },
    status:           { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    paidMethod:       { type: String, enum: ['cash', 'upi'], default: null },
    paidDate:         { type: Date, default: null },
    notes:            { type: String, trim: true, default: null },
  },
  { timestamps: true }
);

// Index for efficient calendar queries by dueDate
subscriptionRecordSchema.index({ tenant: 1, dueDate: 1 }, { unique: true });
subscriptionRecordSchema.index({ dueDate: 1, status: 1 });
subscriptionRecordSchema.index({ owner: 1, status: 1 });

const SubscriptionRecord =
  mongoose.models.SubscriptionRecord ??
  mongoose.model<ISubscriptionRecord>('SubscriptionRecord', subscriptionRecordSchema);

export default SubscriptionRecord;
