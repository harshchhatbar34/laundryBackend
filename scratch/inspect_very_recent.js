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
  const subSchema = new Schema({}, { strict: false });
  const SubscriptionRecord = mongoose.models.SubscriptionRecord || mongoose.model('SubscriptionRecord', subSchema);
  
  const tenantSchema = new Schema({}, { strict: false });
  const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

  // Find records created in the last 30 minutes
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recent = await SubscriptionRecord.find({ createdAt: { $gte: thirtyMinsAgo } }).sort({ createdAt: -1 });

  console.log(`Found ${recent.length} records created in the last 30 minutes:`);
  for (const s of recent) {
    const t = await Tenant.findById(s.tenant);
    console.log(`\nID: ${s._id}`);
    console.log(`    Tenant: ${t ? t.laundryName : s.tenant} (Code: ${t ? t.tenantCode : 'N/A'}, Sub: ${t ? t.subscription : 'N/A'})`);
    console.log(`    Start Date: ${s.startDate}`);
    console.log(`    Due Date: ${s.dueDate}`);
    console.log(`    Status: ${s.status}`);
    console.log(`    Created At: ${s.createdAt}`);
  }

  await mongoose.disconnect();
}).catch(console.error);
