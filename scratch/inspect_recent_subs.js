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

  console.log("Fetching 5 most recently created subscription records...");
  const recent = await SubscriptionRecord.find({}).sort({ createdAt: -1 }).limit(5);

  recent.forEach((s, idx) => {
    console.log(`\n[${idx}] ID: ${s._id}`);
    console.log(`    Tenant: ${s.tenant}`);
    console.log(`    Start Date: ${s.startDate}`);
    console.log(`    Due Date: ${s.dueDate}`);
    console.log(`    Status: ${s.status}`);
    console.log(`    Created At: ${s.createdAt}`);
  });

  await mongoose.disconnect();
}).catch(console.error);
