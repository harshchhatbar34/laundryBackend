import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getOrderTrend } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/stats/trend?days=7
export const GET = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const days = Number(new URL(req.url).searchParams.get('days')) || 7;
    const trend = await getOrderTrend(days);
    return sendSuccess(200, 'Order trend fetched', { trend });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
