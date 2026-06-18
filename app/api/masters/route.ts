import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getAllMaterials, getAllItems, getAllPrices } from '@/src/modules/service/service.service';
import type { AuthContext } from '@/types';

/**
 * GET /api/masters
 * Returns all active materials, items, and price matrix.
 * Used by customer to build the cart (select service + material + item → shows price).
 */
export const GET = withAuth(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const [materials, items, prices] = await Promise.all([
      getAllMaterials(),
      getAllItems(),
      getAllPrices(),
    ]);
    return sendSuccess(200, 'Masters fetched', { materials, items, prices });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
