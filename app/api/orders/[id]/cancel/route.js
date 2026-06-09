const { connectDB } = require('../../../../../lib/db');
const { sendSuccess, sendError } = require('../../../../../lib/apiResponse');
const { withAuth } = require('../../../../../lib/auth');
const { cancelOrder } = require('../../../../../src/modules/order/order.service');

const PUT = withAuth(async (req, { params, user }) => {
  try {
    await connectDB();
    const order = await cancelOrder(params.id, user._id);
    return sendSuccess(200, 'Order cancelled', { order });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { PUT };
