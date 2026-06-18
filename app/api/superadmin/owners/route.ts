import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getAllOwners, createOwner, toggleOwnerActive } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/owners
export const GET = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const result = await getAllOwners(
      Number(url.searchParams.get('page')) || 1,
      Number(url.searchParams.get('limit')) || 20
    );
    return sendSuccess(200, 'Owners fetched', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/superadmin/owners — create a new Laundry Owner account
export const POST = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();
    if (!body.name || !body.email || !body.password) {
      return sendError(400, 'name, email, and password are required');
    }
    const owner = await createOwner(body);
    return sendSuccess(201, 'Laundry Owner account created', { owner });
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
