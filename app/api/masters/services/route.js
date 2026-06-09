import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
import Service from '../../../../src/modules/service/service.model';

export async function GET(req) {
  try {
    await connectDB();
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    return sendSuccess(200, 'Services fetched successfully', { services });
  } catch (error) {
    return sendError(500, error.message);
  }
}
