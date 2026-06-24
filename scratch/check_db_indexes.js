const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not found in environment");
    process.exit(1);
  }
  
  try {
    console.log("Connecting to MongoDB:", MONGO_URI.replace(/:([^@]+)@/, ':****@'));
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`\n========================================`);
      console.log(`Collection: ${colName}`);
      const collection = db.collection(colName);
      const indexes = await collection.indexes();
      
      for (const idx of indexes) {
        console.log(`- Index Name: ${idx.name}`);
        console.log(`  Key:`, JSON.stringify(idx.key));
        if (idx.unique) {
          console.log(`  [UNIQUE] is unique: true`);
        }
      }
    }

    await mongoose.disconnect();
    console.log("\nDisconnected.");
  } catch (err) {
    console.error("Error running script:", err);
  }
}

run();
