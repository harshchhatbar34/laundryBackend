import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { submitRating } from '@/src/modules/rating/rating.service';
import type { AuthContext } from '@/types';

// POST /api/ratings — submit rating after delivery
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.orderId || !body.rating) {
      return sendError(400, 'orderId and rating (1-5) are required');
    }
    if (body.rating < 1 || body.rating > 5) {
      return sendError(400, 'Rating must be between 1 and 5');
    }

    const rating = await submitRating(ctx.user._id, body);
    return sendSuccess(201, 'Rating submitted. Thank you!', { rating });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
