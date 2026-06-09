import { withAuth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
import { applyCoupon } from '../../../../src/modules/coupon/coupon.service';

export const POST = withAuth(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();
    const { code, orderAmount } = body;
    const result = await applyCoupon(code, Number(orderAmount));
    return sendSuccess(200, 'Coupon applied', result);
  } catch (error) {
    return sendError(error.statusCode || 500, error.message || 'Internal Server Error');
  }
});
