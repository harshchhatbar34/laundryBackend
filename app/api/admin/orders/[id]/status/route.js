import { connectDB } from '../../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../../lib/apiResponse';
import { withAdmin } from '../../../../../../lib/auth';
import { updateOrderStatus } from '../../../../../../src/modules/admin/admin.service';

export const PUT = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const body = await req.json();
    const order = await updateOrderStatus(id, body.status, body.note, context.user._id);
    return sendSuccess(200, 'Order status updated', { order });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
