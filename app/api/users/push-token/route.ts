import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { updatePushToken } from '@/src/modules/user/user.service';
import type { AuthContext } from '@/types';

// PATCH /api/users/push-token
export const PATCH = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();
    const pushToken = body.pushToken;

    await updatePushToken(ctx.user._id, pushToken || null);
    return sendSuccess(200, 'Push token updated successfully');
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
