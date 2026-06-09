import { withAuth } from '../../../../../lib/auth';
import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import { markAsRead } from '../../../../../src/modules/notification/notification.service';

export const PUT = withAuth(async (req, context) => {
  try {
    await connectDB();
    const resolvedParams = await context.params;
    const n = await markAsRead(resolvedParams.id, context.user._id);
    return sendSuccess(200, 'Marked as read', { notification: n });
  } catch (error) {
    return sendError(error.statusCode || 500, error.message || 'Internal Server Error');
  }
});
