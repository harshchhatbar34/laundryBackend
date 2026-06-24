import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendPaginated, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getTenantOrders } from '@/src/modules/order/order.service';
import Branch from '@/src/modules/branch/branch.model';
import Tenant from '@/src/modules/tenant/tenant.model';
import type { AuthContext } from '@/types';

/**
 * GET /api/owner/orders?branchId=&customerId=&status=&page=&limit=&search=
 * Returns all orders for a branch or customer owned by the current owner's tenant.
 */
export const GET = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const branchId = url.searchParams.get('branchId') || undefined;
    const customerId = url.searchParams.get('customerId') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;

    // Find the owner's tenant
    const tenant = await Tenant.findOne({ owner: ctx.user._id });
    if (!tenant) return sendError(404, 'Tenant not found');

    if (branchId) {
      // Verify branch ownership
      const branch = await Branch.findOne({ _id: branchId, owner: ctx.user._id });
      if (!branch) return sendError(403, 'Branch not found or does not belong to you');
    }

    const result = await getTenantOrders(tenant._id.toString(), {
      page,
      limit,
      status,
      customerId,
      search,
      branchId,
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
