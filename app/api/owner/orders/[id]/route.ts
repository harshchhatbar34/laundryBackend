import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { ownerRespondToOrder, ownerAssignHelperToOrder } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

/**
 * PATCH /api/owner/orders/[id]
 * Body: { action: 'accept' | 'reject' | 'assign_helper', note?: string, helperId?: string }
 */
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!['accept', 'reject', 'assign_helper'].includes(body.action)) {
      return sendError(400, 'action must be "accept", "reject" or "assign_helper"');
    }

    if (body.action === 'assign_helper') {
      if (!body.helperId) return sendError(400, 'helperId is required');
      const order = await ownerAssignHelperToOrder(ctx.params.id, ctx.user._id, body.helperId);
      return sendSuccess(200, 'Helper assigned successfully', { order });
    }

    const order = await ownerRespondToOrder(ctx.params.id, ctx.user._id, body.action, body.note);
    return sendSuccess(200, `Order ${body.action === 'accept' ? 'accepted' : 'rejected'}`, { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
