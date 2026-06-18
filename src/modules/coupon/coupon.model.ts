import mongoose, { Schema } from 'mongoose';
import type { ICoupon } from '@/types';

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: ['percentage', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null },      // cap for percentage coupons
    minOrderAmount: { type: Number, default: 0 },       // minimum order subtotal to apply
    maxUsage: { type: Number, default: null },           // null = unlimited
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Coupon = mongoose.models.Coupon ?? mongoose.model<ICoupon>('Coupon', couponSchema);
export default Coupon;
