import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get DB collection list
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasUsers = collections.some(col => col.name === 'users');

    if (hasUsers) {
      console.log('ℹ️ Found "users" collection, dropping old mobileNumber index...');
      const dbCollection = mongoose.connection.db.collection('users');
      
      // List indexes
      const indexes = await dbCollection.indexes();
      console.log('Current indexes:', indexes.map(idx => idx.name));

      const hasMobileIndex = indexes.some(idx => idx.name === 'mobileNumber_1');
      if (hasMobileIndex) {
        await dbCollection.dropIndex('mobileNumber_1');
        console.log('✅ Dropped mobileNumber_1 index successfully!');
      } else {
        console.log('ℹ️ mobileNumber_1 index not found in database.');
      }
    } else {
      console.log('ℹ️ "users" collection does not exist yet.');
    }
  } catch (err) {
    console.error('❌ Error during index cleanup:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
