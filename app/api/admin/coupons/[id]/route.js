import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import { withAdmin } from '../../../../../lib/auth';
import { adminUpdateCoupon, adminDeleteCoupon } from '../../../../../src/modules/admin/admin.service';

export const PUT = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const body = await req.json();
    const coupon = await adminUpdateCoupon(id, body);
    return sendSuccess(200, 'Coupon updated', { coupon });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});

export const DELETE = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    await adminDeleteCoupon(id);
    return sendSuccess(200, 'Coupon deleted');
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
