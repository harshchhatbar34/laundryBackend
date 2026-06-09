import { connectDB } from '../../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../../lib/apiResponse';
import { withAdmin } from '../../../../../../lib/auth';
import { assignOrderToDriver } from '../../../../../../src/modules/admin/admin.service';

export const POST = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const body = await req.json();
    const order = await assignOrderToDriver(id, body.driverId, context.user._id);
    return sendSuccess(200, 'Driver assigned to order', { order });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
