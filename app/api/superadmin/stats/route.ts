import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getSuperadminStats } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/stats
export const GET = withRole('superadmin')(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const stats = await getSuperadminStats();
    return sendSuccess(200, 'Platform stats fetched', { stats });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
