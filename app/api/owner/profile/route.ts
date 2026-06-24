import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import Tenant from '@/src/modules/tenant/tenant.model';
import type { AuthContext } from '@/types';

// GET /api/owner/profile — fetch owner's tenant profile
export const GET = withRole('owner')(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const tenant = await Tenant.findOne({ owner: ctx.user._id });
    if (!tenant) return sendError(404, 'Tenant not found');

    return sendSuccess(200, 'Profile fetched', {
      laundryName: tenant.laundryName,
      upiId: tenant.upiId ?? null,
      city: tenant.city ?? null,
      state: tenant.state ?? null,
    });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/owner/profile — update laundry name and/or UPI ID
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();

    const allowedFields: Record<string, unknown> = {};
    if (typeof body.laundryName === 'string' && body.laundryName.trim()) {
      allowedFields.laundryName = body.laundryName.trim();
    }
    if (typeof body.upiId === 'string') {
      // allow empty string to clear it
      allowedFields.upiId = body.upiId.trim() || null;
    }
    if (typeof body.city === 'string') allowedFields.city = body.city.trim() || null;
    if (typeof body.state === 'string') allowedFields.state = body.state.trim() || null;

    if (Object.keys(allowedFields).length === 0) {
      return sendError(400, 'No valid fields to update');
    }

    const tenant = await Tenant.findOneAndUpdate(
      { owner: ctx.user._id },
      { $set: allowedFields },
      { new: true }
    );
    if (!tenant) return sendError(404, 'Tenant not found');

    return sendSuccess(200, 'Profile updated', {
      laundryName: tenant.laundryName,
      upiId: tenant.upiId ?? null,
      city: tenant.city ?? null,
      state: tenant.state ?? null,
    });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
