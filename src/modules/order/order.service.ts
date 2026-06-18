import Order from './order.model';
import Price from '../service/price.model';
import Coupon from '../coupon/coupon.model';
import Address from '../user/address.model';
import { createNotification } from '../notification/notification.service';
import type { Types } from 'mongoose';
import type { OrderStatus } from '@/types';

// ─── Pricing Calculator ───────────────────────────────────────────────────────

const calculatePricing = async (
  items: { material: string; item: string; service: string; quantity: number }[],
  couponCode?: string
) => {
  let subtotal = 0;
  const processedItems = [];

  for (const orderItem of items) {
    const priceDoc = await Price.findOne({
      material: orderItem.material,
      item: orderItem.item,
      service: orderItem.service,
    });
    if (!priceDoc) {
      throw Object.assign(new Error('Price not found for one or more items in your cart.'), { statusCode: 400 });
    }
    const lineTotal = priceDoc.price * orderItem.quantity;
    subtotal += lineTotal;
    processedItems.push({ ...orderItem, price: priceDoc.price });
  }

  let discount = 0;
  let couponDoc = null;

  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!couponDoc) throw Object.assign(new Error('Invalid or expired coupon'), { statusCode: 400 });
    if (couponDoc.expiresAt && couponDoc.expiresAt < new Date()) {
      throw Object.assign(new Error('Coupon has expired'), { statusCode: 400 });
    }
    if (subtotal < couponDoc.minOrderAmount) {
      throw Object.assign(
        new Error(`Minimum order amount for this coupon is ₹${couponDoc.minOrderAmount}`),
        { statusCode: 400 }
      );
    }
    if (couponDoc.maxUsage !== null && couponDoc.usageCount >= couponDoc.maxUsage) {
      throw Object.assign(new Error('Coupon usage limit reached'), { statusCode: 400 });
    }
    discount =
      couponDoc.type === 'percentage'
        ? Math.min((subtotal * couponDoc.value) / 100, couponDoc.maxDiscount ?? Infinity)
        : couponDoc.value;
  }

  return {
    subtotal,
    discount,
    total: Math.max(subtotal - discount, 0),
    couponDoc,
    processedItems,
  };
};

// ─── Create Order (Customer) ──────────────────────────────────────────────────

export const createOrder = async (
  customerId: Types.ObjectId | string,
  tenantId: Types.ObjectId | string,
  body: {
    branchId: string;
    items: { material: string; item: string; service: string; quantity: number }[];
    addressId: string;
    scheduledPickup: { date: string; slot: string };
    couponCode?: string;
    paymentMethod?: 'cash' | 'upi';
    notes?: string;
  }
) => {
  const { branchId, items, addressId, scheduledPickup, couponCode, paymentMethod, notes } = body;

  const address = await Address.findOne({ _id: addressId, user: customerId });
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });

  const { subtotal, discount, total, couponDoc, processedItems } = await calculatePricing(items, couponCode);

  const order = await Order.create({
    tenant: tenantId,
    branch: branchId,
    customer: customerId,
    items: processedItems,
    address: addressId,
    scheduledPickup: { date: new Date(scheduledPickup.date), slot: scheduledPickup.slot },
    coupon: couponDoc?._id ?? null,
    pricing: { subtotal, discount, total },
    paymentMethod: paymentMethod ?? 'cash',
    notes: notes ?? '',
    timeline: [{ status: 'pending', note: 'Order placed by customer', updatedBy: customerId }],
  });

  if (couponDoc) {
    couponDoc.usageCount += 1;
    await couponDoc.save();
  }

  await createNotification(customerId, {
    title: '🎉 Order Placed!',
    body: `Your order ${order.orderNumber} has been placed. Waiting for confirmation.`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order.populate(['address', 'items.material', 'items.item', 'items.service']);
};

// ─── Get Customer Orders ──────────────────────────────────────────────────────

export const getCustomerOrders = async (
  customerId: Types.ObjectId | string,
  { page = 1, limit = 10, status }: { page?: number; limit?: number; status?: string }
) => {
  const query: Record<string, unknown> = { customer: customerId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.material items.item items.service')
      .populate('address')
      .populate('branch', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Get Single Order ─────────────────────────────────────────────────────────

export const getOrderById = async (orderId: string, customerId?: Types.ObjectId | string) => {
  const query: Record<string, unknown> = { _id: orderId };
  if (customerId) query.customer = customerId;

  const order = await Order.findOne(query)
    .populate('items.material items.item items.service')
    .populate('address')
    .populate('customer', 'name email')
    .populate('helper', 'name email')
    .populate('branch', 'name city phone')
    .populate('coupon', 'code type value');

  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return order;
};

// ─── Cancel Order (Customer) ──────────────────────────────────────────────────

export const cancelOrder = async (orderId: string, customerId: Types.ObjectId | string) => {
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  if (!['pending', 'accepted'].includes(order.status)) {
    throw Object.assign(new Error('Order cannot be cancelled at this stage.'), { statusCode: 400 });
  }

  order.status = 'cancelled';
  order.timeline.push({ status: 'cancelled', note: 'Cancelled by customer', updatedBy: customerId as Types.ObjectId, updatedAt: new Date() });
  await order.save();

  await createNotification(customerId, {
    title: 'Order Cancelled',
    body: `Your order ${order.orderNumber} has been cancelled.`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order;
};

// ─── Reschedule Delivery (Customer) ───────────────────────────────────────────

export const rescheduleDelivery = async (
  orderId: string,
  customerId: Types.ObjectId | string,
  newDeliveryDate: string
) => {
  const order = await Order.findOne({ _id: orderId, customer: customerId });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  if (order.status !== 'failed_delivery') {
    throw Object.assign(new Error('Delivery rescheduling is only allowed after a failed delivery attempt.'), { statusCode: 400 });
  }

  order.scheduledDelivery = new Date(newDeliveryDate);
  order.status = 'ready'; // revert to ready so helper can re-attempt delivery
  order.timeline.push({
    status: 'ready',
    note: `Customer rescheduled delivery to ${newDeliveryDate}`,
    updatedBy: customerId as Types.ObjectId,
    updatedAt: new Date(),
  });
  await order.save();

  // Notify helper if assigned
  if (order.helper) {
    await createNotification(order.helper, {
      title: 'Delivery Rescheduled',
      body: `Customer rescheduled delivery for order ${order.orderNumber}.`,
      type: 'order',
      refId: order._id as Types.ObjectId,
    });
  }

  return order;
};

// ─── Owner: Get Branch Orders ─────────────────────────────────────────────────

export const getBranchOrders = async (
  branchId: string,
  { page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string }
) => {
  const query: Record<string, unknown> = { branch: branchId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'name email')
      .populate('items.material items.item items.service')
      .populate('address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Owner: Accept / Reject Order ────────────────────────────────────────────

export const ownerRespondToOrder = async (
  orderId: string,
  ownerId: Types.ObjectId | string,
  action: 'accept' | 'reject',
  note?: string
) => {
  const order = await Order.findOne({ _id: orderId }).populate('branch');
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  if (order.status !== 'pending') {
    throw Object.assign(new Error('Only pending orders can be accepted or rejected.'), { statusCode: 400 });
  }

  const newStatus: OrderStatus = action === 'accept' ? 'accepted' : 'rejected';
  order.status = newStatus;
  order.timeline.push({ status: newStatus, note: note ?? '', updatedBy: ownerId as Types.ObjectId, updatedAt: new Date() });
  await order.save();

  await createNotification(order.customer, {
    title: action === 'accept' ? '✅ Order Accepted' : '❌ Order Rejected',
    body:
      action === 'accept'
        ? `Your order ${order.orderNumber} has been accepted. A helper will pick it up soon.`
        : `Your order ${order.orderNumber} was rejected. ${note ?? ''}`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order;
};

// ─── Helper: Accept Order ─────────────────────────────────────────────────────

export const helperAcceptOrder = async (
  orderId: string,
  helperId: Types.ObjectId | string
) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  if (!['pending', 'accepted'].includes(order.status)) {
    throw Object.assign(new Error('This order cannot be accepted at this stage.'), { statusCode: 400 });
  }

  order.helper = helperId as Types.ObjectId;
  order.status = 'accepted';
  order.timeline.push({ status: 'accepted', note: 'Accepted by helper', updatedBy: helperId as Types.ObjectId, updatedAt: new Date() });
  await order.save();

  await createNotification(order.customer, {
    title: '🧺 Helper Assigned',
    body: `A helper has been assigned to your order ${order.orderNumber}.`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order;
};

// ─── Helper: Update Order Status ──────────────────────────────────────────────

const HELPER_ALLOWED_STATUSES: OrderStatus[] = [
  'pickup', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'failed_delivery', 'delivered',
];

export const helperUpdateOrderStatus = async (
  orderId: string,
  helperId: Types.ObjectId | string,
  status: OrderStatus,
  note?: string
) => {
  if (!HELPER_ALLOWED_STATUSES.includes(status)) {
    throw Object.assign(new Error('Invalid status transition'), { statusCode: 400 });
  }

  const order = await Order.findOne({ _id: orderId, helper: helperId });
  if (!order) throw Object.assign(new Error('Order not found or not assigned to you'), { statusCode: 404 });

  order.status = status;
  order.timeline.push({ status, note: note ?? '', updatedBy: helperId as Types.ObjectId, updatedAt: new Date() });

  if (status === 'delivered') {
    order.paymentStatus = 'paid';
  }

  await order.save();

  const statusMessages: Partial<Record<OrderStatus, string>> = {
    pickup: 'Helper is on the way to pick up your clothes.',
    picked_up: 'Your clothes have been picked up. Processing will begin shortly.',
    processing: 'Your laundry is being processed.',
    ready: 'Your laundry is ready for delivery.',
    out_for_delivery: '🚚 Your laundry is out for delivery!',
    failed_delivery: 'Delivery attempt failed. Please reschedule your delivery.',
    delivered: '✅ Your laundry has been delivered. Thank you!',
  };

  await createNotification(order.customer, {
    title: `Order ${order.orderNumber} Update`,
    body: note ?? statusMessages[status] ?? `Your order is now: ${status}`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order.populate(['address', 'items.material', 'items.item', 'items.service', 'customer']);
};

// ─── Helper: Update Bill at Pickup ───────────────────────────────────────────

export const helperUpdateBill = async (
  orderId: string,
  helperId: Types.ObjectId | string,
  items: { material: string; item: string; service: string; quantity: number }[]
) => {
  const order = await Order.findOne({ _id: orderId, helper: helperId });
  if (!order) throw Object.assign(new Error('Order not found or not assigned to you'), { statusCode: 404 });

  if (order.status !== 'picked_up') {
    throw Object.assign(new Error('Bill can only be updated after pickup.'), { statusCode: 400 });
  }

  // Recalculate pricing based on actual items
  const { subtotal, discount, total, processedItems } = await calculatePricing(items);

  order.items = processedItems as typeof order.items;
  order.pricing = { subtotal, discount, total };
  order.billUpdated = true;
  await order.save();

  // CRITICAL: Notify customer about updated bill
  await createNotification(order.customer, {
    title: '📋 Bill Updated',
    body: `The final bill for order ${order.orderNumber} has been updated to ₹${total}. Processing will now begin.`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order.populate(['items.material', 'items.item', 'items.service']);
};

// ─── Helper: Fail Delivery ────────────────────────────────────────────────────

export const helperFailDelivery = async (orderId: string, helperId: Types.ObjectId | string) => {
  const order = await Order.findOne({ _id: orderId, helper: helperId });
  if (!order) throw Object.assign(new Error('Order not found or not assigned to you'), { statusCode: 404 });

  if (order.status !== 'out_for_delivery') {
    throw Object.assign(new Error('Order must be out for delivery to mark as failed.'), { statusCode: 400 });
  }

  order.status = 'failed_delivery';
  order.timeline.push({ status: 'failed_delivery', note: 'Customer unavailable at delivery', updatedBy: helperId as Types.ObjectId, updatedAt: new Date() });
  await order.save();

  await createNotification(order.customer, {
    title: '⚠️ Delivery Attempt Failed',
    body: `We couldn't deliver order ${order.orderNumber}. Please reschedule your delivery.`,
    type: 'order',
    refId: order._id as Types.ObjectId,
  });

  return order;
};

// ─── Helper: Get My Orders ────────────────────────────────────────────────────

export const getHelperOrders = async (
  helperId: Types.ObjectId | string,
  { page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string }
) => {
  const query: Record<string, unknown> = { helper: helperId };
  if (status) query.status = status;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('customer', 'name email')
      .populate('items.material items.item items.service')
      .populate('address')
      .populate('branch', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Owner: Analytics / Stats ─────────────────────────────────────────────────

export const getBranchStats = async (branchId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, pendingOrders, todayOrders, revenueAgg, last7Days, avgRatingAgg] =
    await Promise.all([
      Order.countDocuments({ branch: branchId }),
      Order.countDocuments({ branch: branchId, status: 'pending' }),
      Order.countDocuments({ branch: branchId, createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { branch: { $toString: branchId }, status: { $nin: ['cancelled', 'rejected'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            branch: { $toString: branchId },
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            status: { $nin: ['cancelled', 'rejected'] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Average rating from Rating collection — imported lazily to avoid circular deps
      (async () => {
        const Rating = (await import('../rating/rating.model')).default;
        return Rating.aggregate([
          { $match: { branch: { $toString: branchId } } },
          { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
      })(),
    ]);

  return {
    totalOrders,
    pendingOrders,
    todayOrders,
    totalRevenue: revenueAgg[0]?.total ?? 0,
    last7Days,
    avgRating: avgRatingAgg[0]?.avg ?? 0,
    totalRatings: avgRatingAgg[0]?.count ?? 0,
  };
};
