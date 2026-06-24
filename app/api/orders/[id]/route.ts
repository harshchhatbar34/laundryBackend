import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getOrderById, cancelOrder, confirmOrderBill } from '@/src/modules/order/order.service';
import Tenant from '@/src/modules/tenant/tenant.model';
import type { AuthContext } from '@/types';

// GET /api/orders/[id]
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const { _id: userId, role } = ctx.user;

    let order;
    if (role === 'superadmin') {
      // Superadmin can view any order
      order = await getOrderById(ctx.params.id);
    } else if (role === 'owner') {
      // Owner can view orders of their tenant
      order = await getOrderById(ctx.params.id);
      const tenant = await Tenant.findOne({ owner: userId });
      
      // Compare order's tenant ID with the owner's tenant ID
      const orderTenantId = order.tenant?._id?.toString() || order.tenant?.toString();
      if (!tenant || orderTenantId !== tenant._id.toString()) {
        return sendError(403, 'Forbidden: You do not have permission to view this order');
      }
    } else if (role === 'helper') {
      // Helper can view orders assigned to them or pending/accepted orders
      order = await getOrderById(ctx.params.id);
      const helperIdStr = order.helper?._id?.toString() || order.helper?.toString();
      if (helperIdStr !== userId.toString() && order.status !== 'pending' && order.status !== 'accepted') {
        return sendError(403, 'Forbidden: You do not have permission to view this order');
      }
    } else {
      // Customer (standard user) can only view their own orders
      order = await getOrderById(ctx.params.id, userId);
    }

    return sendSuccess(200, 'Order fetched', { order });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/orders/[id] — cancel order or confirm bill (customer)
export const PATCH = withAuth(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const body = await req.json();

    if (body.action === 'cancel') {
      const order = await cancelOrder(ctx.params.id, ctx.user._id);
      return sendSuccess(200, 'Order cancelled', { order });
    }

    if (body.action === 'confirm_bill') {
      const order = await confirmOrderBill(ctx.params.id, ctx.user._id);
      return sendSuccess(200, 'Bill confirmed', { order });
    }

    return sendError(400, 'action must be cancel or confirm_bill');
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
