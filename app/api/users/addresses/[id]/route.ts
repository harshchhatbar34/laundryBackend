import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { deleteAddress } from '@/src/modules/user/user.service';
import type { AuthContext } from '@/types';

// DELETE /api/users/addresses/[id]
export const DELETE = withAuth(async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    await deleteAddress(ctx.params.id, ctx.user._id);
    return sendSuccess(200, 'Address deleted');
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
