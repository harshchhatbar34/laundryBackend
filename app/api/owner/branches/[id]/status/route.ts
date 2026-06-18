import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { toggleBranchStatus } from '@/src/modules/branch/branch.service';
import type { AuthContext } from '@/types';

// PATCH /api/owner/branches/[id]/status — toggle LIVE / CLOSED
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (typeof body.isLive !== 'boolean') {
      return sendError(400, 'isLive (boolean) is required');
    }

    const branch = await toggleBranchStatus(ctx.params.id, ctx.user._id, body.isLive);
    return sendSuccess(200, `Branch is now ${body.isLive ? 'LIVE' : 'CLOSED'}`, { branch });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
