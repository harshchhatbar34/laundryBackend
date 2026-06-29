import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getProfile, updateProfile } from '@/src/modules/user/user.service';
import type { AuthContext } from '@/types';

// GET /api/users/profile
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const user = await getProfile(ctx.user._id);
    return sendSuccess(200, 'Profile fetched', { user });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/users/profile
export const PATCH = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();
    const user = await updateProfile(ctx.user._id, { 
      name: body.name, 
      mobileNumber: body.mobileNumber,
      upiId: typeof body.upiId === 'string' ? (body.upiId.trim() || null) : undefined
    });
    return sendSuccess(200, 'Profile updated', { user });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
