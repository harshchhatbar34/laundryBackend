import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { helperUpdateBill } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

/**
 * PATCH /api/helper/bill/[id]
 * CRITICAL endpoint: Helper updates the actual item count and bill at pickup.
 * Customer is automatically notified with the new total.
 * Body: { items: [{ material, item, service, quantity }] }
 */
export const PATCH = withRole('helper')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.items?.length) {
      return sendError(400, 'items array is required with actual item counts');
    }

    const order = await helperUpdateBill(ctx.params.id, ctx.user._id, body.items);
    return sendSuccess(200, 'Bill updated and customer notified', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
