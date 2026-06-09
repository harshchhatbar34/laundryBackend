import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import { withAdmin } from '../../../../../lib/auth';
import { getUserDetail } from '../../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const data = await getUserDetail(id);
    return sendSuccess(200, 'User detail', data);
  } catch (e) {
    return sendError(e.statusCode || 500, e.message);
  }
});
