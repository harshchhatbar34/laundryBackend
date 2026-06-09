import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
import { withAdmin } from '../../../../lib/auth';
import { adminGetServices, adminCreateService } from '../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const services = await adminGetServices();
    return sendSuccess(200, 'Services fetched', { services });
  } catch (e) {
    return sendError(500, e.message);
  }
});

export const POST = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const service = await adminCreateService(body);
    return sendSuccess(201, 'Service created', { service });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
