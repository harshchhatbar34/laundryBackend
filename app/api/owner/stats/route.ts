import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getBranchStats } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

// GET /api/owner/stats?branchId=
export const GET = withRole('owner')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const branchId = new URL(req.url).searchParams.get('branchId');
    if (!branchId) return sendError(400, 'branchId is required');

    const stats = await getBranchStats(branchId);
    return sendSuccess(200, 'Stats fetched', { stats });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
