import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getAllServices, createService, updateService, deleteService, getAllMaterials, getAllItems, getAllPrices, createMaterial, createItem, upsertPrice, deletePrice } from '@/src/modules/service/service.service';
import type { AuthContext } from '@/types';

// GET /api/owner/services — all services + masters + prices for management
export const GET = withRole('owner')(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const [services, materials, items, prices] = await Promise.all([
      getAllServices(false),
      getAllMaterials(),
      getAllItems(),
      getAllPrices(),
    ]);
    return sendSuccess(200, 'Service data fetched', { services, materials, items, prices });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/owner/services
// body: { type: 'service'|'material'|'item'|'price', data: {...} }
export const POST = withRole('owner')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const { type, data } = await req.json();

    let result;
    if (type === 'service') result = await createService(data);
    else if (type === 'material') result = await createMaterial(data);
    else if (type === 'item') result = await createItem(data);
    else if (type === 'price') result = await upsertPrice(data);
    else return sendError(400, 'type must be service, material, item, or price');

    return sendSuccess(201, `${type} created/updated`, { [type]: result });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/owner/services — update service
export const PATCH = withRole('owner')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const { id, data } = await req.json();
    if (!id) return sendError(400, 'id is required');
    const result = await updateService(id, data);
    return sendSuccess(200, 'Service updated', { service: result });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// DELETE /api/owner/services?id=&type=
export const DELETE = withRole('owner')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    if (!id || !type) return sendError(400, 'id and type query params are required');

    if (type === 'service') await deleteService(id);
    else if (type === 'price') await deletePrice(id);
    else return sendError(400, 'type must be service or price');

    return sendSuccess(200, `${type} deleted`);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
