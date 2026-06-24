import mongoose from 'mongoose';
import 'dotenv/config';

// Load .env explicitly since Cwd might be frontend
import dotenv from 'dotenv';
dotenv.config({ path: 'E:/work/laundryBackend/.env' });

const MONGO_URI = process.env.MONGO_URI;

const orderSchema = new mongoose.Schema({
  orderNumber: String,
  status: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
}, { timestamps: true });

const Order = mongoose.models.Order ?? mongoose.model('Order', orderSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const branchId = '6a3af419b01e4885995136ae'; // string branchId from DB
    
    const countWithStr = await Order.countDocuments({ branch: branchId });
    const countWithObj = await Order.countDocuments({ branch: new mongoose.Types.ObjectId(branchId) });

    console.log(`Count with string branchId: ${countWithStr}`);
    console.log(`Count with ObjectId branchId: ${countWithObj}`);

    // Let's also check if we can query by string tenantId
    const tenantId = '6a3ad7a1b01e4885995136a5'; // let's check some tenant
    
    // Let's print the actual orders in DB
    const allOrders = await Order.find();
    console.log('All Orders:', allOrders);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
