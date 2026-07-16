import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getHelperStats } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

// GET /api/helper/stats — helper's stats (delivered, cash/upi collections)
export const GET = withRole('helper', 'owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const result = await getHelperStats(ctx.user._id);
    return sendSuccess(200, 'Stats fetched', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
