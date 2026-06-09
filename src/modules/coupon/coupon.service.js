const Coupon = require('./coupon.model');

const applyCoupon = async (code, orderAmount) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw Object.assign(new Error('Invalid coupon code'), { statusCode: 400 });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw Object.assign(new Error('Coupon has expired'), { statusCode: 400 });
  }
  if (orderAmount < coupon.minOrderAmount) {
    throw Object.assign(new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`), { statusCode: 400 });
  }
  if (coupon.usageCount >= coupon.usageLimit) {
    throw Object.assign(new Error('Coupon limit reached'), { statusCode: 400 });
  }

  const discount =
    coupon.type === 'percentage'
      ? Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;

  return { coupon, discount, finalAmount: Math.max(orderAmount - discount, 0) };
};

const getAllCoupons = async () => Coupon.find().sort({ createdAt: -1 });
const createCoupon = async (data) => Coupon.create(data);
const updateCoupon = async (id, data) => {
  const c = await Coupon.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!c) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 });
  return c;
};
const deleteCoupon = async (id) => {
  const c = await Coupon.findByIdAndDelete(id);
  if (!c) throw Object.assign(new Error('Coupon not found'), { statusCode: 404 });
  return c;
};

module.exports = { applyCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon };
