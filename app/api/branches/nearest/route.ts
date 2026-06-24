import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import Branch from '@/src/modules/branch/branch.model';
import Tenant from '@/src/modules/tenant/tenant.model';
import type { AuthContext } from '@/types';

/**
 * GET /api/branches/nearest?lat=xx&lng=xx&tenantCode=XXXX
 * Returns the nearest branch for the customer's tenant, and all branches sorted by distance.
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

    // Resolve tenant: prefer query param, fall back to user's tenantId
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

    // Fetch all branches of the tenant sorted from near to far using geospatial $near query
    const branches = await Branch.find({
      tenant: tenantId,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
        },
      },
    }).populate('owner', 'name email');

    return sendSuccess(200, 'Branches resolved', {
      branch: branches[0] || null,
      branches: branches,
    });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
