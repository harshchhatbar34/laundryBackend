import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import {
  helperAcceptOrder,
  helperUpdateOrderStatus,
  helperFailDelivery,
  getOrderById,
} from '@/src/modules/order/order.service';
import type { AuthContext, OrderStatus } from '@/types';

// GET /api/helper/orders/[id]
export const GET = withRole('helper', 'owner')(async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const order = await getOrderById(ctx.params.id);
    return sendSuccess(200, 'Order fetched', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

/**
 * PATCH /api/helper/orders/[id]
 * Body: { action: 'accept' | 'status' | 'fail_delivery', status?: OrderStatus, note?: string }
 */
export const PATCH = withRole('helper', 'owner')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (body.action === 'accept') {
      const order = await helperAcceptOrder(ctx.params.id, ctx.user._id);
      return sendSuccess(200, 'Order accepted', { order });
    }

    if (body.action === 'status') {
      if (!body.status) return sendError(400, 'status is required');
      const order = await helperUpdateOrderStatus(ctx.params.id, ctx.user._id, body.status as OrderStatus, body.note);
      return sendSuccess(200, 'Order status updated', { order });
    }

    if (body.action === 'fail_delivery') {
      const order = await helperFailDelivery(ctx.params.id, ctx.user._id);
      return sendSuccess(200, 'Delivery marked as failed. Customer will reschedule.', { order });
    }

    return sendError(400, 'action must be accept, status, or fail_delivery');
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
