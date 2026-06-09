import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendPaginated, sendError } from '../../../../lib/apiResponse';
import { withAdmin } from '../../../../lib/auth';
import { getAllDrivers, createDriver } from '../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const result = await getAllDrivers({ page: +page || 1, limit: +limit || 20 });
    return sendPaginated('Drivers fetched', result.drivers, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) {
    return sendError(500, e.message);
  }
});

export const POST = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const driver = await createDriver(body);
    return sendSuccess(201, 'Driver created', { driver });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
