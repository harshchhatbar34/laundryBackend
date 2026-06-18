import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getOrderById, cancelOrder } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

// GET /api/orders/[id]
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const order = await getOrderById(ctx.params.id, ctx.user._id);
    return sendSuccess(200, 'Order fetched', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/orders/[id] — cancel order (customer)
export const PATCH = withAuth(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (body.action !== 'cancel') {
      return sendError(400, 'Only action=cancel is supported here. Use /reschedule for rescheduling.');
    }

    const order = await cancelOrder(ctx.params.id, ctx.user._id);
    return sendSuccess(200, 'Order cancelled', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
