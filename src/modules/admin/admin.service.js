const Order = require('../order/order.model');
const User = require('../user/user.model');
const Service = require('../service/service.model');
const { createService, updateService, deleteService, getAllServices } = require('../service/service.service');
const { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../coupon/coupon.service');
const { createNotification } = require('../notification/notification.service');
const { getOrderById } = require('../order/order.service');

/* ─── Stats ──────────────────────────────────────── */

const getDashboardStats = async () => {
  const [
    totalOrders,
    pendingOrders,
    totalUsers,
    activeServices,
    todayOrders,
    revenue,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'user' }),
    Service.countDocuments({ isActive: true }),
    Order.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
  ]);

  // Orders by status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Last 7 days revenue
  const last7Days = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { $nin: ['cancelled'] },
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
  ]);

  return {
    totalOrders,
    pendingOrders,
    totalUsers,
    activeServices,
    todayOrders,
    totalRevenue: revenue[0]?.total || 0,
    ordersByStatus,
    last7Days,
  };
};

/* ─── Orders ─────────────────────────────────────── */

const getAllOrders = async ({ page = 1, limit = 20, status, search }) => {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name mobileNumber email')
      .populate('items.material items.item items.service')
      .populate('address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const updateOrderStatus = async (orderId, status, note, adminId) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });

  const { ORDER_STATUSES } = require('../order/order.model');
  if (!ORDER_STATUSES.includes(status)) {
    throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
  }

  order.status = status;
  order.timeline.push({ status, note: note || '', updatedBy: adminId });
  await order.save();

  // Notify user
  await createNotification(order.user, {
    title: `Order ${order.orderNumber} Update`,
    body: note || `Your order status is now: ${status}`,
    type: 'order',
    refId: order._id,
  });

  return order.populate(['items.material', 'items.item', 'items.service', 'address', 'user']);
};

/* ─── Users ──────────────────────────────────────── */

const getAllUsers = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find({ role: 'user' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({ role: 'user' }),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getUserDetail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const orders = await Order.find({ user: userId })
    .populate('items.material items.item items.service')
    .sort({ createdAt: -1 })
    .limit(10);
  return { user, orders };
};

/* ─── Drivers ────────────────────────────────────────── */

const getAllDrivers = async ({ page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [drivers, total] = await Promise.all([
    User.find({ role: 'driver' })
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments({ role: 'driver' }),
  ]);
  return { drivers, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createDriver = async ({ mobileNumber, name, vehicleType, vehicleNumber }) => {
  const existing = await User.findOne({ mobileNumber });
  if (existing) {
    if (existing.role === 'driver') throw Object.assign(new Error('Driver already exists'), { statusCode: 409 });
    existing.role = 'driver';
    existing.name = name || existing.name;
    existing.vehicleType = vehicleType || '';
    existing.vehicleNumber = vehicleNumber || '';
    existing.isProfileComplete = true;
    return existing.save();
  }
  return User.create({ mobileNumber, name, role: 'driver', vehicleType, vehicleNumber, isProfileComplete: true });
};

const updateDriver = async (driverId, updates) => {
  const driver = await User.findOneAndUpdate(
    { _id: driverId, role: 'driver' },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
  return driver;
};

const deleteDriver = async (driverId) => {
  const driver = await User.findOneAndDelete({ _id: driverId, role: 'driver' });
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });
};

const assignOrderToDriver = async (orderId, driverId, adminId) => {
  const [order, driver] = await Promise.all([
    Order.findById(orderId),
    User.findOne({ _id: driverId, role: 'driver' }),
  ]);
  if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  if (!driver) throw Object.assign(new Error('Driver not found'), { statusCode: 404 });

  order.driver = driverId;
  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.timeline.push({ status: 'confirmed', note: `Assigned to driver ${driver.name}`, updatedBy: adminId });
  }
  await order.save();

  const { createNotification } = require('../notification/notification.service');
  await Promise.all([
    createNotification(order.user, {
      title: `Driver Assigned — ${order.orderNumber}`,
      body: `${driver.name} will handle your order.`,
      type: 'order',
      refId: order._id,
    }),
    createNotification(driverId, {
      title: 'New Order Assigned',
      body: `You have been assigned order ${order.orderNumber}.`,
      type: 'order',
      refId: order._id,
    }),
  ]);

  return order.populate(['user', 'driver', 'address', 'items.material', 'items.item', 'items.service']);
};

/* ─── Services & Coupons — delegate to module services ─ */

module.exports = {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  getUserDetail,
  // Service CRUD
  adminGetServices: () => getAllServices(false),
  adminCreateService: createService,
  adminUpdateService: updateService,
  adminDeleteService: deleteService,
  // Coupon CRUD
  adminGetCoupons: getAllCoupons,
  adminCreateCoupon: createCoupon,
  adminUpdateCoupon: updateCoupon,
  adminDeleteCoupon: deleteCoupon,
  // Driver management
  getAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  assignOrderToDriver,
};
