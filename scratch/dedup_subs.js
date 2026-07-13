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

  console.log("Starting database deduplication for subscription records...");

  const allSubs = await SubscriptionRecord.find({}).sort({ createdAt: 1 });
  const seen = new Set();
  let deletedCount = 0;

  for (const sub of allSubs) {
    const key = `${sub.tenant.toString()}_${new Date(sub.dueDate).toISOString()}`;
    if (seen.has(key)) {
      console.log(`Deleting duplicate record: ID ${sub._id} for tenant ${sub.tenant} due on ${sub.dueDate}`);
      await SubscriptionRecord.deleteOne({ _id: sub._id });
      deletedCount++;
    } else {
      seen.add(key);
    }
  }

  console.log(`Deduplication complete. Deleted ${deletedCount} duplicate records.`);
  await mongoose.disconnect();
}).catch(console.error);
