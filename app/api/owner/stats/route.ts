import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getBranchStats, getTenantStats } from '@/src/modules/order/order.service';
import Tenant from '@/src/modules/tenant/tenant.model';
import Branch from '@/src/modules/branch/branch.model';
import type { AuthContext } from '@/types';

// GET /api/owner/stats?branchId=
export const GET = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const branchId = new URL(req.url).searchParams.get('branchId');

    // Find the owner's tenant
    const tenant = await Tenant.findOne({ owner: ctx.user._id });
    if (!tenant) return sendError(404, 'Tenant not found');

    let stats;
    if (branchId) {
      // Verify branch ownership
      const branch = await Branch.findOne({ _id: branchId, owner: ctx.user._id });
      if (!branch) return sendError(403, 'Branch not found or does not belong to you');
      stats = await getBranchStats(branchId);
    } else {
      // Get stats for all branches (tenant-level stats)
      stats = await getTenantStats(tenant._id.toString());
    }

    return sendSuccess(200, 'Stats fetched', { stats });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
