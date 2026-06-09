import { withAuth } from '../../../lib/auth';
import { connectDB } from '../../../lib/db';
import { sendPaginated, sendError } from '../../../lib/apiResponse';
import { getUserNotifications } from '../../../src/modules/notification/notification.service';

export const GET = withAuth(async (req, context) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const result = await getUserNotifications(context.user._id, { page, limit });
    return sendPaginated('Notifications fetched', result.notifications, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return sendError(error.statusCode || 500, error.message || 'Internal Server Error');
  }
});
