import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/src/modules/coupon/coupon.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/coupons
export const GET = withRole('superadmin')(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const coupons = await getAllCoupons();
    return sendSuccess(200, 'Coupons fetched', { coupons });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/superadmin/coupons
export const POST = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();
    if (!body.code || !body.type || body.value == null) {
      return sendError(400, 'code, type, and value are required');
    }
    const coupon = await createCoupon(body);
    return sendSuccess(201, 'Coupon created', { coupon });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/superadmin/coupons — { id, data }
export const PATCH = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const { id, data } = await req.json();
    if (!id) return sendError(400, 'id is required');
    const coupon = await updateCoupon(id, data);
    return sendSuccess(200, 'Coupon updated', { coupon });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// DELETE /api/superadmin/coupons?id=
export const DELETE = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return sendError(400, 'id query param is required');
    await deleteCoupon(id);
    return sendSuccess(200, 'Coupon deleted');
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
