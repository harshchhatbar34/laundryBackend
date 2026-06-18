import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError, sendPaginated } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { createOrder, getCustomerOrders } from '@/src/modules/order/order.service';
import User from '@/src/modules/user/user.model';
import type { AuthContext } from '@/types';

// GET /api/orders — get customer's own orders
export const GET = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const result = await getCustomerOrders(ctx.user._id, {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 10,
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

// POST /api/orders — place a new order
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.branchId || !body.items?.length || !body.addressId || !body.scheduledPickup) {
      return sendError(400, 'branchId, items, addressId, and scheduledPickup are required');
    }

    // Fetch customer's tenantId for order isolation
    const customer = await User.findById(ctx.user._id);
    if (!customer?.tenantId) {
      return sendError(403, 'Account is not linked to any laundry service.');
    }

    const order = await createOrder(ctx.user._id, customer.tenantId, body);
    return sendSuccess(201, 'Order placed successfully', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
