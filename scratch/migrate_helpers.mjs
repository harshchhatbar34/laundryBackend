import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'E:/work/laundryBackend/.env' });

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const db = mongoose.connection.db;

  const tenants = await db.collection('tenants').find().toArray();
  if (tenants.length === 0) {
    console.log('No tenants found');
    await mongoose.disconnect();
    return;
  }

  // Set the tenant ID of all helpers in the database to the first tenant's ID as a robust fallback
  const firstTenantId = tenants[0]._id;

  const result = await db.collection('users').updateMany(
    { role: 'helper', $or: [ { tenantId: null }, { tenantId: { $exists: false } } ] },
    { $set: { tenantId: firstTenantId } }
  );

  console.log(`Migrated ${result.modifiedCount} helpers to tenant: ${firstTenantId}`);

  // Let's print all helpers to verify
  const helpers = await db.collection('users').find({ role: 'helper' }).toArray();
  console.log('Helpers after migration:', helpers);

  await mongoose.disconnect();
}

run().catch(console.error);
