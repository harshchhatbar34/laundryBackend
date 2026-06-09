import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import { withAdmin } from '../../../../../lib/auth';
import { updateDriver, deleteDriver } from '../../../../../src/modules/admin/admin.service';

export const PUT = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const body = await req.json();
    const driver = await updateDriver(id, body);
    return sendSuccess(200, 'Driver updated', { driver });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});

export const DELETE = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    await deleteDriver(id);
    return sendSuccess(200, 'Driver deleted');
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
