const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI not set in env");
  process.exit(1);
}

mongoose.connect(mongoUri).then(async () => {
  const Schema = mongoose.Schema;
  const tenantSchema = new Schema({}, { strict: false });
  const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

  const t = await Tenant.findById('6a3d028a0d44f87bafba18f8');
  console.log("Tenant:", {
    id: t._id,
    laundryName: t.laundryName,
    subscription: t.subscription,
    paymentAmount: t.paymentAmount,
    createdAt: t.createdAt
  });

  await mongoose.disconnect();
}).catch(console.error);
