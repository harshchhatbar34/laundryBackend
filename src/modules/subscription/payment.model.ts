import mongoose, { Schema } from 'mongoose';
import type { IPaymentRecord } from '@/types';

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    subscription:  { type: Schema.Types.ObjectId, ref: 'SubscriptionRecord', required: true },
    tenant:        { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    owner:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount:        { type: Number, required: true },
    paidDate:      { type: Date, required: true },
    paymentMethod: { type: String, enum: ['cash', 'upi'], required: true },
    notes:         { type: String, trim: true, default: null },
    recordedBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentRecordSchema.index({ owner: 1, paidDate: -1 });
paymentRecordSchema.index({ subscription: 1 });

const PaymentRecord =
  mongoose.models.PaymentRecord ??
  mongoose.model<IPaymentRecord>('PaymentRecord', paymentRecordSchema);

export default PaymentRecord;
