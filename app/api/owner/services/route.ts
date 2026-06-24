import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import Tenant from '@/src/modules/tenant/tenant.model';
import { 
  getOwnerServices, createService, updateService, deleteService, 
  getOwnerMaterials, createMaterial, updateMaterial, deleteMaterial,
  getOwnerItems, createItem, updateItem, deleteItem
} from '@/src/modules/service/service.service';
import type { AuthContext } from '@/types';

// Helper to get tenant for owner or helper
const getTenantId = async (userId: string, role: string) => {
  if (role === 'owner') {
    const tenant = await Tenant.findOne({ owner: userId });
    if (!tenant) throw Object.assign(new Error('Tenant not found for owner'), { statusCode: 403 });
    return tenant._id;
  } else {
    const user = await mongoose.model('User').findById(userId);
    if (!user || !user.tenantId) throw Object.assign(new Error('Tenant not found for user'), { statusCode: 403 });
    return user.tenantId;
  }
};

// GET /api/owner/services — all services + materials + items for management
export const GET = withRole('owner', 'helper')(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const tenantId = await getTenantId(ctx.user._id.toString(), ctx.user.role);
    const [services, materials, items] = await Promise.all([
      getOwnerServices(tenantId, false),
      getOwnerMaterials(tenantId, false),
      getOwnerItems(tenantId, false),
    ]);
    return sendSuccess(200, 'Catalog data fetched', { services, materials, items });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/owner/services
// body: { type: 'service'|'material'|'item', data: {...} }
export const POST = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const tenantId = await getTenantId(ctx.user._id.toString(), ctx.user.role);
    const { type, data } = await req.json();

    let result;
    if (type === 'service') result = await createService(tenantId, data);
    else if (type === 'material') result = await createMaterial(tenantId, data);
    else if (type === 'item') result = await createItem(tenantId, data);
    else return sendError(400, 'type must be service, material, or item');

    return sendSuccess(201, `${type} created`, { [type]: result });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/owner/services — update service/material/item
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const tenantId = await getTenantId(ctx.user._id.toString(), ctx.user.role);
    const { id, type, data } = await req.json();
    if (!id || !type) return sendError(400, 'id and type are required');

    let result;
    if (type === 'service') result = await updateService(id, tenantId, data);
    else if (type === 'material') result = await updateMaterial(id, tenantId, data);
    else if (type === 'item') result = await updateItem(id, tenantId, data);
    else return sendError(400, 'type must be service, material, or item');

    return sendSuccess(200, `${type} updated`, { [type]: result });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// DELETE /api/owner/services?id=&type=
export const DELETE = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const tenantId = await getTenantId(ctx.user._id.toString(), ctx.user.role);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    if (!id || !type) return sendError(400, 'id and type query params are required');

    if (type === 'service') await deleteService(id, tenantId);
    else if (type === 'material') await deleteMaterial(id, tenantId);
    else if (type === 'item') await deleteItem(id, tenantId);
    else return sendError(400, 'type must be service, material, or item');

    return sendSuccess(200, `${type} deleted`);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
