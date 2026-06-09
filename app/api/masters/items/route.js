import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import Item from '../../../../../src/modules/service/item.model';

export async function GET(req) {
  try {
    await connectDB();
    const items = await Item.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(200, 'Items fetched successfully', { items });
  } catch (error) {
    return sendError(500, error.message);
  }
}
