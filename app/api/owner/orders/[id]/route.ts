import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { ownerRespondToOrder } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

/**
 * PATCH /api/owner/orders/[id]
 * Body: { action: 'accept' | 'reject', note?: string }
 */
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!['accept', 'reject'].includes(body.action)) {
      return sendError(400, 'action must be "accept" or "reject"');
    }

    const order = await ownerRespondToOrder(ctx.params.id, ctx.user._id, body.action, body.note);
    return sendSuccess(200, `Order ${body.action === 'accept' ? 'accepted' : 'rejected'}`, { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
