import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://qonsult:XXqN6pmOAFZg01Tt@qonsult.jaluwhk.mongodb.net/laundry_db?retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  email: String,
  pushToken: String,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const result = await User.findOneAndUpdate(
    { email: "harshcustomer@gmail.com" },
    { $set: { pushToken: "ExponentPushToken[eA6PuYCrhUaXd-v5_iklYA]" } },
    { new: true }
  );

  console.log("Updated customer token:", result.email, "->", result.pushToken);
  await mongoose.disconnect();
}

run().catch(console.error);
