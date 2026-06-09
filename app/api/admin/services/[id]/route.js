import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import { withAdmin } from '../../../../../lib/auth';
import { adminUpdateService, adminDeleteService } from '../../../../../src/modules/admin/admin.service';

export const PUT = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const body = await req.json();
    const service = await adminUpdateService(id, body);
    return sendSuccess(200, 'Service updated', { service });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});

export const DELETE = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    await adminDeleteService(id);
    return sendSuccess(200, 'Service deleted');
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
