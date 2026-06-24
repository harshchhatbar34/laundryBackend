const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/laundroflow";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name));

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({});
    console.log(`\nFound ${users.length} users in 'User' collection:`);
    users.forEach(u => {
      const obj = u.toObject();
      console.log(`ID: ${obj._id} | Role: ${obj.role} | Name: ${obj.name} | Email: ${obj.email} | Mobile: ${obj.mobileNumber}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
