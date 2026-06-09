const { connectDB } = require('../../../../../lib/db');
const { sendPaginated, sendError } = require('../../../../../lib/apiResponse');
const { withDriver } = require('../../../../../lib/auth');
const { getDriverOrders } = require('../../../../../src/modules/order/order.service');

const GET = withDriver(async (req, { user }) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit');
    const status = url.searchParams.get('status');

    const result = await getDriverOrders(user._id, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
    
    return sendPaginated('Driver orders fetched', result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { GET };
