import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import type { AuthContext } from '@/types';
import { getSubscriptionStats } from '@/src/modules/subscription/subscription.service';

// GET /api/superadmin/subscriptions/stats
export const GET = withRole('superadmin')(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const stats = await getSubscriptionStats();
    return sendSuccess(200, 'Subscription stats fetched', { stats });
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});
