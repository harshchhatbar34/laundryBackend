const { connectDB } = require('../../../../lib/db');
const { sendSuccess, sendError } = require('../../../../lib/apiResponse');
const { withAuth } = require('../../../../lib/auth');
const { getOrderById } = require('../../../../src/modules/order/order.service');

const GET = withAuth(async (req, { params, user }) => {
  try {
    await connectDB();
    const order = await getOrderById(params.id, user._id);
    return sendSuccess(200, 'Order fetched', { order });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { GET };
