import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getUserNotifications, markAllRead } from '@/src/modules/notification/notification.service';
import type { AuthContext } from '@/types';

// GET /api/notifications
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const result = await getUserNotifications(
      ctx.user._id,
      Number(url.searchParams.get('page')) || 1,
      Number(url.searchParams.get('limit')) || 20
    );
    return sendSuccess(200, 'Notifications fetched', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/notifications — mark all as read
export const PATCH = withAuth(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    await markAllRead(ctx.user._id);
    return sendSuccess(200, 'All notifications marked as read');
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
