const Order = require('./order.model');
const Material = require('../service/material.model');
const Item = require('../service/item.model');
const Service = require('../service/service.model');
const Price = require('../service/price.model');
const Coupon = require('../coupon/coupon.model');
const Address = require('../user/address.model');
const { createNotification } = require('../notification/notification.service');

/**
 * Calculate order pricing
 */
const calculatePricing = async (items = [], couponCode) => {
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const priceDoc = await Price.findOne({
      material: item.material,
      item: item.item,
      service: item.service,
    });

    if (!priceDoc) {
      throw Object.assign(new Error(`Price not found for some items in your cart.`), { statusCode: 400 });
    }

    const itemPrice = priceDoc.price * item.quantity;
    subtotal += itemPrice;
    processedItems.push({
      ...item,
      price: priceDoc.price,
    });
  }

  let discount = 0;
  let couponDoc = null;

  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!couponDoc) throw Object.assign(new Error('Invalid or expired coupon'), { statusCode: 400 });
    // ... coupon logic stays similar
    discount =
      couponDoc.type === 'percentage'
        ? Math.min((subtotal * couponDoc.value) / 100, couponDoc.maxDiscount || Infinity)
        : couponDoc.value;
  }

  const total = Math.max(subtotal - discount, 0);
  return { subtotal, discount, total, couponDoc, processedItems };
};

/**
 * Create a new order
 */
const createOrder = async (userId, body) => {
  const { items = [], addressId, scheduledPickup, couponCode, notes } = body;

  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });

  const { subtotal, discount, total, couponDoc, processedItems } = await calculatePricing(items, couponCode);

  const order = await Order.create({
    user: userId,
    items: processedItems,
    address: addressId,
    scheduledPickup,
    coupon: couponDoc?._id || null,
    pricing: { subtotal, discount, total },
    notes,
    timeline: [{ status: 'pending', note: 'Order placed', updatedBy: userId }],
  });

  if (couponDoc) {
    couponDoc.usageCount += 1;
    await couponDoc.save();
  }

  await createNotification(userId, {
    title: 'Order Placed! 🎉',
    body: `Your order ${order.orderNumber} has been placed successfully.`,
    type: 'order',
    refId: order._id,
  });

  return order.populate(['address', 'items.material', 'items.item', 'items.service']);
};

/**
 * Get user's orders (paginated)
 */
const getUserOrders = async (userId, { page = 1, limit = 10, status }) => {
  const query = { user: userId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.material items.item items.service')
      .populate('address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Get single order (user must own it)
 */
const getOrderById = async (orderId, userId) => {
  const query = { _id: orderId };
  if (userId) query.user = userId; // Skip user check for admins

  const order = await Order.findOne(query)
    .populate('items.material items.item items.service')
    .populate('address')
    .populate('user', 'name mobileNumber email')
    .populate('coupon', 'code type value');

  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  return order;
};

/**
 * Cancel order (user can cancel only if status is pending/confirmed)
 */
const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  if (!['pending', 'confirmed'].includes(order.status)) {
    throw Object.assign(
      new Error('Order cannot be cancelled at this stage.'),
      { statusCode: 400 }
    );
  }

  order.status = 'cancelled';
  order.timeline.push({ status: 'cancelled', note: 'Cancelled by customer', updatedBy: userId });
  await order.save();

  await createNotification(userId, {
    title: 'Order Cancelled',
    body: `Your order ${order.orderNumber} has been cancelled.`,
    type: 'order',
    refId: order._id,
  });

  return order;
};

const getAllOrders = async ({ page = 1, limit = 10, status }) => {
  const query = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.material items.item items.service')
      .populate('address')
      .populate('user', 'name mobileNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const updateOrderStatus = async (orderId, status, note, updatedBy) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  order.status = status;
  order.timeline.push({ status, note, updatedBy });
  await order.save();

  await createNotification(order.user, {
    title: 'Order Status Updated',
    body: `Your order ${order.orderNumber} is now ${status}.`,
    type: 'order',
    refId: order._id,
  });

  return order;
};

const DRIVER_STATUSES = ['pickup', 'received', 'out_delivery', 'delivered'];

const getDriverOrders = async (driverId, { page = 1, limit = 20, status }) => {
  const query = { driver: driverId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.material items.item items.service')
      .populate('address')
      .populate('user', 'name mobileNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const driverUpdateOrderStatus = async (orderId, driverId, status, note) => {
  if (!DRIVER_STATUSES.includes(status)) {
    throw Object.assign(new Error('Invalid status transition'), { statusCode: 400 });
  }

  const order = await Order.findOne({ _id: orderId, driver: driverId });
  if (!order) throw Object.assign(new Error('Order not found or not assigned to you'), { statusCode: 404 });

  order.status = status;
  order.timeline.push({ status, note: note || '', updatedBy: driverId });

  if (status === 'delivered') {
    order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
  }

  await order.save();

  await createNotification(order.user, {
    title: `Order ${order.orderNumber} Update`,
    body: note || `Your order status is now: ${status}`,
    type: 'order',
    refId: order._id,
  });

  return order.populate(['address', 'items.material', 'items.item', 'items.service', 'user']);
};

module.exports = { createOrder, getUserOrders, getOrderById, cancelOrder, calculatePricing, getAllOrders, updateOrderStatus, getDriverOrders, driverUpdateOrderStatus };
