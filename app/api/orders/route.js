const { NextResponse } = require('next/server');
const { connectDB } = require('../../../lib/db');
const { sendSuccess, sendPaginated, sendError } = require('../../../lib/apiResponse');
const { withAuth } = require('../../../lib/auth');
const { createOrder, getUserOrders } = require('../../../src/modules/order/order.service');

const GET = withAuth(async (req, { user }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');
    const status = url.searchParams.get('status');

    const result = await getUserOrders(user._id, {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      status,
    });
    return sendPaginated('Orders fetched', result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

const POST = withAuth(async (req, { user }) => {
  try {
    await connectDB();
    const body = await req.json();
    const order = await createOrder(user._id, body);
    return sendSuccess(201, 'Order placed successfully', { order });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { GET, POST };
