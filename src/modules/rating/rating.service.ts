import Rating from './rating.model';
import Order from '../order/order.model';
import type { Types } from 'mongoose';

export const submitRating = async (
  customerId: Types.ObjectId | string,
  data: { orderId: string; rating: number; review?: string }
) => {
  // Verify order is delivered/completed and belongs to this customer
  const order = await Order.findOne({ _id: data.orderId, customer: customerId, status: { $in: ['delivered', 'completed'] } });
  if (!order) {
    throw Object.assign(new Error('Order not found or not yet completed.'), { statusCode: 404 });
  }

  // Prevent duplicate ratings
  const existing = await Rating.findOne({ order: data.orderId });
  if (existing) {
    throw Object.assign(new Error('You have already rated this order.'), { statusCode: 409 });
  }

  return Rating.create({
    order: data.orderId,
    customer: customerId,
    branch: order.branch,
    rating: data.rating,
    review: data.review ?? '',
  });
};

export const getBranchRatings = async (branchId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [ratings, total] = await Promise.all([
    Rating.find({ branch: branchId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Rating.countDocuments({ branch: branchId }),
  ]);
  return { ratings, total, page, limit, totalPages: Math.ceil(total / limit) };
};
