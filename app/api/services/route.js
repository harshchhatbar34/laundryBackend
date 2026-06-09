import { connectDB } from '../../../lib/db';
import { sendSuccess, sendError } from '../../../lib/apiResponse';
import { getAllServices } from '../../../src/modules/service/service.service';

export async function GET(req) {
  try {
    await connectDB();
    const services = await getAllServices(true);
    return sendSuccess(200, 'Services fetched', { services });
  } catch (e) {
    return sendError(500, e.message);
  }
}
