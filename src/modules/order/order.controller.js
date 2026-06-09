const { createOrder, getUserOrders, getOrderById, cancelOrder, getDriverOrders, driverUpdateOrderStatus } = require('./order.service');
const User = require('../user/user.model');
const { sendSuccess, sendPaginated } = require('../../utils/apiResponse');
const { generateInvoicePDF } = require('../../utils/invoice.utils');

const placeOrder = async (req, res, next) => {
  try {
    const order = await createOrder(req.user._id, req.body);
    sendSuccess(res, 201, 'Order placed successfully', { order });
  } catch (e) { next(e); }
};

const myOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await getUserOrders(req.user._id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
    });
    sendPaginated(res, 'Orders fetched', result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (e) { next(e); }
};

const orderDetail = async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id, req.user._id);
    sendSuccess(res, 200, 'Order fetched', { order });
  } catch (e) { next(e); }
};

const cancel = async (req, res, next) => {
  try {
    const order = await cancelOrder(req.params.id, req.user._id);
    sendSuccess(res, 200, 'Order cancelled', { order });
  } catch (e) { next(e); }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id, req.user.role === 'admin' ? null : req.user._id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

    generateInvoicePDF(order, res);
  } catch (e) { next(e); }
};

const driverOrders = async (req, res, next) => {
  try {
    const result = await getDriverOrders(req.user._id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      status: req.query.status,
    });
    sendPaginated(res, 'Driver orders fetched', result.orders, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) { next(e); }
};

const driverUpdateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await driverUpdateOrderStatus(req.params.id, req.user._id, status, note);

    sendSuccess(res, 200, 'Order status updated', { order });
  } catch (e) { next(e); }
};

const driverUpdateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'currentLocation.lat': lat, 'currentLocation.lng': lng, 'currentLocation.updatedAt': new Date() },
    });

    sendSuccess(res, 200, 'Location updated');
  } catch (e) { next(e); }
};

module.exports = { placeOrder, myOrders, orderDetail, cancel, downloadInvoice, driverOrders, driverUpdateStatus, driverUpdateLocation };
