import mongoose, { Schema } from 'mongoose';
import type { ITenant } from '@/types';

const tenantSchema = new Schema<ITenant>(
  {
    // Unique code hardcoded into each white-label app build
    tenantCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // The Laundry Owner this tenant code belongs to
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    laundryName: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: null },
    landmark: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    pincode: { type: String, trim: true, default: null },
    paymentAmount: { type: Number, required: true, default: 0 },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi'],
      default: 'cash',
    },
    upiId: { type: String, trim: true, default: null }, // owner's UPI ID for customer payments
    subscription: {
      type: String,
      enum: ['monthly', 'yearly', 'onetime'],
      required: true,
      default: 'monthly',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Tenant = mongoose.models.Tenant ?? mongoose.model<ITenant>('Tenant', tenantSchema);
export default Tenant;
