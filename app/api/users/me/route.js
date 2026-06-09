import { withAuth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
const { getMyProfile, updateMyProfile } = require('../../../../src/modules/user/user.service');

export const GET = withAuth(async (req, context) => {
  try {
    await connectDB();
    const user = await getMyProfile(context.user._id);
    return sendSuccess(200, 'Profile fetched', { user });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});

export const PUT = withAuth(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const user = await updateMyProfile(context.user._id, body);
    return sendSuccess(200, 'Profile updated', { user });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});
