const svc = require('./admin.service');
const { sendSuccess, sendPaginated } = require('../../utils/apiResponse');

/* ─── Stats ──────────────────────────────────────── */
const stats = async (req, res, next) => {
  try {
    const data = await svc.getDashboardStats();
    sendSuccess(res, 200, 'Dashboard stats', data);
  } catch (e) { next(e); }
};

/* ─── Orders ─────────────────────────────────────── */
const listOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await svc.getAllOrders({ page: +page || 1, limit: +limit || 20, status });
    sendPaginated(res, 'Orders fetched', result.orders, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) { next(e); }
};

const updateStatus = async (req, res, next) => {
  try {
    const order = await svc.updateOrderStatus(req.params.id, req.body.status, req.body.note, req.user._id);
    sendSuccess(res, 200, 'Order status updated', { order });
  } catch (e) { next(e); }
};

/* ─── Users ──────────────────────────────────────── */
const listUsers = async (req, res, next) => {
  try {
    const result = await svc.getAllUsers({ page: +req.query.page || 1, limit: +req.query.limit || 20 });
    sendPaginated(res, 'Users fetched', result.users, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) { next(e); }
};

const userDetail = async (req, res, next) => {
  try {
    const data = await svc.getUserDetail(req.params.id);
    sendSuccess(res, 200, 'User detail', data);
  } catch (e) { next(e); }
};

/* ─── Services ────────────────────────────────────── */
const listServices = async (req, res, next) => {
  try {
    const services = await svc.adminGetServices();
    sendSuccess(res, 200, 'Services fetched', { services });
  } catch (e) { next(e); }
};
const createService = async (req, res, next) => {
  try {
    const service = await svc.adminCreateService(req.body);
    sendSuccess(res, 201, 'Service created', { service });
  } catch (e) { next(e); }
};
const updateService = async (req, res, next) => {
  try {
    const service = await svc.adminUpdateService(req.params.id, req.body);
    sendSuccess(res, 200, 'Service updated', { service });
  } catch (e) { next(e); }
};
const deleteService = async (req, res, next) => {
  try {
    await svc.adminDeleteService(req.params.id);
    sendSuccess(res, 200, 'Service deleted');
  } catch (e) { next(e); }
};

/* ─── Coupons ─────────────────────────────────────── */
const listCoupons = async (req, res, next) => {
  try {
    const coupons = await svc.adminGetCoupons();
    sendSuccess(res, 200, 'Coupons fetched', { coupons });
  } catch (e) { next(e); }
};
const createCoupon = async (req, res, next) => {
  try {
    const coupon = await svc.adminCreateCoupon(req.body);
    sendSuccess(res, 201, 'Coupon created', { coupon });
  } catch (e) { next(e); }
};
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await svc.adminUpdateCoupon(req.params.id, req.body);
    sendSuccess(res, 200, 'Coupon updated', { coupon });
  } catch (e) { next(e); }
};
const deleteCoupon = async (req, res, next) => {
  try {
    await svc.adminDeleteCoupon(req.params.id);
    sendSuccess(res, 200, 'Coupon deleted');
  } catch (e) { next(e); }
};

/* ─── Drivers ─────────────────────────────────────── */
const listDrivers = async (req, res, next) => {
  try {
    const result = await svc.getAllDrivers({ page: +req.query.page || 1, limit: +req.query.limit || 20 });
    sendPaginated(res, 'Drivers fetched', result.drivers, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) { next(e); }
};

const createDriver = async (req, res, next) => {
  try {
    const driver = await svc.createDriver(req.body);
    sendSuccess(res, 201, 'Driver created', { driver });
  } catch (e) { next(e); }
};

const updateDriver = async (req, res, next) => {
  try {
    const driver = await svc.updateDriver(req.params.id, req.body);
    sendSuccess(res, 200, 'Driver updated', { driver });
  } catch (e) { next(e); }
};

const deleteDriver = async (req, res, next) => {
  try {
    await svc.deleteDriver(req.params.id);
    sendSuccess(res, 200, 'Driver deleted');
  } catch (e) { next(e); }
};

const assignDriver = async (req, res, next) => {
  try {
    const order = await svc.assignOrderToDriver(req.params.orderId, req.body.driverId, req.user._id);
    sendSuccess(res, 200, 'Driver assigned to order', { order });
  } catch (e) { next(e); }
};

module.exports = {
  stats, listOrders, updateStatus,
  listUsers, userDetail,
  listServices, createService, updateService, deleteService,
  listCoupons, createCoupon, updateCoupon, deleteCoupon,
  listDrivers, createDriver, updateDriver, deleteDriver, assignDriver,
};
