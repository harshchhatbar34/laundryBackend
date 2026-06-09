import { withAuth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
import { markAllAsRead } from '../../../../src/modules/notification/notification.service';

export const PUT = withAuth(async (req, context) => {
  try {
    await connectDB();
    await markAllAsRead(context.user._id);
    return sendSuccess(200, 'All notifications marked as read');
  } catch (error) {
    return sendError(error.statusCode || 500, error.message || 'Internal Server Error');
  }
});
