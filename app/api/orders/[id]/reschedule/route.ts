import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { rescheduleDelivery } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

// POST /api/orders/[id]/reschedule
// Called by customer when they were unavailable during delivery (failed_delivery status)
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.newDeliveryDate) {
      return sendError(400, 'newDeliveryDate is required (ISO date string)');
    }

    const order = await rescheduleDelivery(ctx.params.id, ctx.user._id, body.newDeliveryDate);
    return sendSuccess(200, 'Delivery rescheduled successfully', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
