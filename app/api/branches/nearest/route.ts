import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { findNearestBranch } from '@/src/modules/branch/branch.service';
import Tenant from '@/src/modules/tenant/tenant.model';
import type { AuthContext } from '@/types';

/**
 * GET /api/branches/nearest?lat=xx&lng=xx&tenantCode=XXXX
 * Returns the nearest branch for the customer's tenant.
 * Also returns isLive status so the app can show "Shop Closed" if needed.
 */
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();

    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') ?? '');
    const lng = parseFloat(url.searchParams.get('lng') ?? '');
    const tenantCode = url.searchParams.get('tenantCode');

    if (isNaN(lat) || isNaN(lng)) {
      return sendError(400, 'lat and lng are required query parameters');
    }

    // Resolve tenant: prefer query param (for non-customer roles), fall back to user's tenantId
    let tenantId = null;

    if (ctx.user.role === 'customer') {
      const UserModel = (await import('@/src/modules/user/user.model')).default;
      const userDoc = await UserModel.findById(ctx.user._id);
      tenantId = userDoc?.tenantId ?? null;
    }

    if (!tenantId && tenantCode) {
      const tenant = await Tenant.findOne({ tenantCode: tenantCode.toUpperCase() });
      if (!tenant) return sendError(404, 'Invalid tenant code');
      tenantId = tenant._id;
    }

    if (!tenantId) return sendError(400, 'tenantCode is required');

    const branch = await findNearestBranch(tenantId, lng, lat);
    return sendSuccess(200, 'Nearest branch found', { branch });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
