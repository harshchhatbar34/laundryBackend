import { withAuth } from '../../../../../../lib/auth';
import { connectDB } from '../../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../../lib/apiResponse';
const { setDefaultAddress } = require('../../../../../../src/modules/user/user.service');

export const PATCH = withAuth(async (req, context) => {
  try {
    await connectDB();
    const address = await setDefaultAddress(context.user._id, context.params.id);
    return sendSuccess(200, 'Default address updated', { address });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});
