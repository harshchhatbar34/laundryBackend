import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
import { withAdmin } from '../../../../lib/auth';
import { getDashboardStats } from '../../../../src/modules/admin/admin.service';

export const GET = withAdmin(async (req, context) => {
  try {
    await connectDB();
    const data = await getDashboardStats();
    return sendSuccess(200, 'Dashboard stats', data);
  } catch (e) {
    return sendError(500, e.message);
  }
});
