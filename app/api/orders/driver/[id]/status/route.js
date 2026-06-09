const { connectDB } = require('../../../../../../lib/db');
const { sendSuccess, sendError } = require('../../../../../../lib/apiResponse');
const { withDriver } = require('../../../../../../lib/auth');
const { driverUpdateOrderStatus } = require('../../../../../../src/modules/order/order.service');

const PUT = withDriver(async (req, { params, user }) => {
  try {
    await connectDB();
    const body = await req.json();
    const { status, note } = body;
    const order = await driverUpdateOrderStatus(params.id, user._id, status, note);

    return sendSuccess(200, 'Order status updated', { order });
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { PUT };
