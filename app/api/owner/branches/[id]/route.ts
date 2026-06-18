import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { updateBranch } from '@/src/modules/branch/branch.service';
import type { AuthContext } from '@/types';

// PATCH /api/owner/branches/[id] — update branch details
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();
    const branch = await updateBranch(ctx.params.id, ctx.user._id, body);
    return sendSuccess(200, 'Branch updated', { branch });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
