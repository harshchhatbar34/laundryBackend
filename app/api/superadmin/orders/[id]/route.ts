import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getOrderById } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/orders/[id]
export const GET = withRole('superadmin')(
  async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
    try {
      await connectDB();
      const order = await getOrderById(ctx.params.id);
      return sendSuccess(200, 'Order details fetched', { order });
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
    }
  }
);
