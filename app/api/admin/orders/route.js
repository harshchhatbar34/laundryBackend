import { connectDB } from '../../../../lib/db';
import { sendPaginated, sendError } from '../../../../lib/apiResponse';
import { withAdmin } from '../../../../lib/auth';
import { getAllOrders } from '../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    const result = await getAllOrders({ page: +page || 1, limit: +limit || 20, status });
    return sendPaginated('Orders fetched', result.orders, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) {
    return sendError(500, e.message);
  }
});
