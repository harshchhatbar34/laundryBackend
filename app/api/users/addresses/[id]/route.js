import { withAuth } from '../../../../../lib/auth';
import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
const { updateAddress, deleteAddress } = require('../../../../../src/modules/user/user.service');

export const PUT = withAuth(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const address = await updateAddress(context.user._id, context.params.id, body);
    return sendSuccess(200, 'Address updated', { address });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});

export const DELETE = withAuth(async (req, context) => {
  try {
    await connectDB();
    await deleteAddress(context.user._id, context.params.id);
    return sendSuccess(200, 'Address deleted');
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});
