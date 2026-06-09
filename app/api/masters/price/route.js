import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import Price from '../../../../../src/modules/service/price.model';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get('materialId');
    const itemId = searchParams.get('itemId');
    const serviceId = searchParams.get('serviceId');

    const priceDoc = await Price.findOne({
      material: materialId,
      item: itemId,
      service: serviceId,
    });

    if (!priceDoc) {
      return sendSuccess(200, 'Price not found', { price: 0 });
    }

    return sendSuccess(200, 'Price fetched successfully', { price: priceDoc.price });
  } catch (error) {
    return sendError(500, error.message);
  }
}
