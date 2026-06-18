import Coupon from './coupon.model';

export const getAllCoupons = (activeOnly = false) =>
  Coupon.find(activeOnly ? { isActive: true } : {}).sort({ createdAt: -1 });

export const createCoupon = (data: {
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUsage?: number;
  expiresAt?: string;
}) => Coupon.create(data);

export const updateCoupon = async (id: string, data: Partial<{
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  maxDiscount: number;
  minOrderAmount: number;
  maxUsage: number;
  isActive: boolean;
  expiresAt: string;
}>) => {
  const coupon = await Coupon.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!coupon) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 });
  return coupon;
};

export const deleteCoupon = async (id: string) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 });
};

export const validateCoupon = async (code: string, subtotal: number) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw Object.assign(new Error('Invalid or expired coupon'), { statusCode: 400 });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw Object.assign(new Error('Coupon has expired'), { statusCode: 400 });
  if (subtotal < coupon.minOrderAmount) throw Object.assign(new Error(`Min order ₹${coupon.minOrderAmount} required`), { statusCode: 400 });
  return coupon;
};
