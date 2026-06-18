import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendPaginated, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getBranchOrders } from '@/src/modules/order/order.service';
import Branch from '@/src/modules/branch/branch.model';
import type { AuthContext } from '@/types';

/**
 * GET /api/owner/orders?branchId=&status=&page=&limit=
 * Returns all orders for a branch owned by the current owner.
 */
export const GET = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId');

    if (!branchId) return sendError(400, 'branchId query param is required');

    // Verify ownership
    const branch = await Branch.findOne({ _id: branchId, owner: ctx.user._id });
    if (!branch) return sendError(403, 'Branch not found or does not belong to you');

    const result = await getBranchOrders(branchId, {
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
