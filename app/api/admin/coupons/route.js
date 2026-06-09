import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
import { withAdmin } from '../../../../lib/auth';
import { adminGetCoupons, adminCreateCoupon } from '../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const coupons = await adminGetCoupons();
    return sendSuccess(200, 'Coupons fetched', { coupons });
  } catch (e) {
    return sendError(500, e.message);
  }
});

export const POST = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const coupon = await adminCreateCoupon(body);
    return sendSuccess(201, 'Coupon created', { coupon });
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
