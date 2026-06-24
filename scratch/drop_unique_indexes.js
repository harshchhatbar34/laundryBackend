const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/laundroflow";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    
    const collectionsToFix = ['services', 'materials', 'items'];
    
    for (const colName of collectionsToFix) {
      console.log(`\nChecking collection: ${colName}`);
      const collection = db.collection(colName);
      const indexes = await collection.indexes();
      console.log("Current indexes:", indexes.map(idx => idx.name));
      
      // Find the unique index (usually named tenant_1_name_1)
      const uniqueIdx = indexes.find(idx => idx.name === 'tenant_1_name_1' || idx.name === 'name_1');
      if (uniqueIdx) {
        console.log(`Dropping unique index: ${uniqueIdx.name}`);
        await collection.dropIndex(uniqueIdx.name);
        console.log(`Successfully dropped unique index from ${colName}!`);
      } else {
        console.log(`No unique index found for tenant_1_name_1 in ${colName}.`);
      }
    }

    console.log("\nRe-syncing non-unique indexes in Mongoose...");
    // Register schemas
    const serviceSchema = new mongoose.Schema({}, { strict: false });
    serviceSchema.index({ tenant: 1, name: 1 });
    const Service = mongoose.model('Service', serviceSchema);
    await Service.syncIndexes();

    const materialSchema = new mongoose.Schema({}, { strict: false });
    materialSchema.index({ tenant: 1, name: 1 });
    const Material = mongoose.model('Material', materialSchema);
    await Material.syncIndexes();

    const itemSchema = new mongoose.Schema({}, { strict: false });
    itemSchema.index({ tenant: 1, name: 1 });
    const Item = mongoose.model('Item', itemSchema);
    await Item.syncIndexes();

    console.log("Mongoose indexes synced successfully!");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB. All done!");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
