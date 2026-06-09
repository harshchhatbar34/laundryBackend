const { connectDB } = require('../../../../../lib/db');
const { sendSuccess, sendError } = require('../../../../../lib/apiResponse');
const { withDriver } = require('../../../../../lib/auth');
const User = require('../../../../../src/modules/user/user.model');

const PUT = withDriver(async (req, { user }) => {
  try {
    await connectDB();
    const body = await req.json();
    const { lat, lng } = body;

    await User.findByIdAndUpdate(user._id, {
      $set: { 'currentLocation.lat': lat, 'currentLocation.lng': lng, 'currentLocation.updatedAt': new Date() },
    });

    return sendSuccess(200, 'Location updated');
  } catch (error) {
    return sendError(500, error.message || 'Internal Server Error');
  }
});

module.exports = { PUT };
