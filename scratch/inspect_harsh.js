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

  const subSchema = new Schema({}, { strict: false });
  const SubscriptionRecord = mongoose.models.SubscriptionRecord || mongoose.model('SubscriptionRecord', subSchema);

  const tenants = await Tenant.find({ laundryName: /harsh/i });
  console.log("Found tenants matching 'harsh':", tenants.map(t => ({ id: t._id, code: t.tenantCode, name: t.laundryName, created: t.createdAt })));

  for (const t of tenants) {
    const subs = await SubscriptionRecord.find({ tenant: t._id }).sort({ dueDate: 1 });
    console.log(`\nSubscription records for tenant ${t.laundryName} (${t._id}):`);
    subs.forEach((s, idx) => {
      console.log(`  [${idx}] ID: ${s._id}, Start: ${s.startDate}, Due: ${s.dueDate}, Status: ${s.status}, CreatedAt: ${s.createdAt}`);
    });
  }

  await mongoose.disconnect();
}).catch(console.error);
