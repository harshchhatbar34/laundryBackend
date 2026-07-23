import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getAllOwners, createOwner, toggleOwnerActive } from '@/src/modules/admin/admin.service';
import { sendOwnerSetupEmail } from '@/src/lib/email';
import { logger } from '@/lib/logger';
import type { AuthContext } from '@/types';

// GET /api/superadmin/owners
export const GET = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    
    // Parse pagination and search params
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || undefined;

    // Parse status filter (supports status=active|blocked|inactive and isActive=true|false)
    let isActive: boolean | undefined;
    const statusParam = url.searchParams.get('status');
    const activeParam = url.searchParams.get('isActive');

    if (statusParam === 'active' || activeParam === 'true') {
      isActive = true;
    } else if (statusParam === 'blocked' || statusParam === 'inactive' || activeParam === 'false') {
      isActive = false;
    }

    const result = await getAllOwners(page, limit, search, isActive);
    return sendSuccess(200, 'Owners fetched', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/superadmin/owners — create a new Laundry Owner account + auto-generate tenant code
export const POST = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();
    if (!body.name || !body.email || !body.laundryName || body.paymentAmount == null || !body.subscription) {
      return sendError(400, 'name, email, laundryName, paymentAmount, and subscription are required');
    }
    const validSubscriptions = ['monthly', 'yearly', 'onetime'];
    if (!validSubscriptions.includes(body.subscription)) {
      return sendError(400, `subscription must be one of: ${validSubscriptions.join(', ')}`);
    }
    if (body.paymentMode && !['cash', 'upi'].includes(body.paymentMode)) {
      return sendError(400, 'paymentMode must be either "cash" or "upi"');
    }
    const { owner, tenant, setupToken } = await createOwner(body);
    const setupLink = `${process.env.FRONTEND_URL || 'https://laundry-backend-eta.vercel.app'}/set-password?token=${setupToken}`;
    
    // Automatically trigger onboarding password setup email to the owner
    try {
      const sent = await sendOwnerSetupEmail(owner.email, owner.name, tenant.laundryName, setupLink);
      if (sent) {
        logger.info(`[OWNER_SETUP] ✅ Setup email sent → to=${owner.email}`);
      } else {
        logger.warn(`[OWNER_SETUP] ⚠️ Setup email failed → to=${owner.email}`);
      }
    } catch (err) {
      logger.error(`[OWNER_SETUP] ❌ Setup email error → to=${owner.email}`, err);
    }

    return sendSuccess(201, 'Laundry Owner created with tenant code', { owner, tenant, setupLink });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/superadmin/owners — toggle owner active status
export const PATCH = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const { ownerId, isActive } = await req.json();
    if (!ownerId || typeof isActive !== 'boolean') {
      return sendError(400, 'ownerId and isActive are required');
    }
    const owner = await toggleOwnerActive(ownerId, isActive);
    return sendSuccess(200, 'Owner status updated', { owner });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
