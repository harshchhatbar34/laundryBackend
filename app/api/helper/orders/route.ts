import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendPaginated, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getHelperOrders } from '@/src/modules/order/order.service';
import type { AuthContext } from '@/types';

// GET /api/helper/orders — helper's assigned orders
export const GET = withRole('helper')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const result = await getHelperOrders(ctx.user._id, {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
      status: url.searchParams.get('status') ?? undefined,
    });
    return sendPaginated('Orders fetched', result.orders, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
