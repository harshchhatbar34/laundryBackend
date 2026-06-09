import { connectDB } from '../../../../lib/db';
import { sendPaginated, sendError } from '../../../../lib/apiResponse';
import { withAdmin } from '../../../../lib/auth';
import { getAllUsers } from '../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const result = await getAllUsers({ page: +page || 1, limit: +limit || 20 });
    return sendPaginated('Users fetched', result.users, {
      total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages,
    });
  } catch (e) {
    return sendError(500, e.message);
  }
});
