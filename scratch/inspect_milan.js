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

  const subs = await SubscriptionRecord.find({ tenant: new mongoose.Types.ObjectId('6a3d028a0d44f87bafba18f8') }).sort({ dueDate: 1 });
  console.log("Subscription records for Milan laundry:");
  subs.forEach((s, idx) => {
    console.log(`  [${idx}] ID: ${s._id}, Start: ${s.startDate}, Due: ${s.dueDate}, Status: ${s.status}, CreatedAt: ${s.createdAt}`);
  });

  await mongoose.disconnect();
}).catch(console.error);
