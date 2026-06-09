import { withAuth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
const { getAddresses, addAddress } = require('../../../../src/modules/user/user.service');

export const GET = withAuth(async (req, context) => {
  try {
    await connectDB();
    const addresses = await getAddresses(context.user._id);
    return sendSuccess(200, 'Addresses fetched', { addresses });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});

export const POST = withAuth(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const address = await addAddress(context.user._id, body);
    return sendSuccess(201, 'Address added', { address });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});
