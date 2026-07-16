import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://qonsult:XXqN6pmOAFZg01Tt@qonsult.jaluwhk.mongodb.net/laundry_db?retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  pushToken: String,
});

const notificationSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  title: String,
  body: String,
  type: String,
  refId: mongoose.Schema.Types.ObjectId,
  isRead: Boolean,
  createdAt: Date,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

async function check() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // 1. Fetch all users who have a push token
  const users = await User.find({ pushToken: { $exists: true, $ne: null } });
  console.log("\n--- Users with Push Tokens ---");
  users.forEach(u => {
    console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, PushToken: ${u.pushToken}`);
  });

  // 2. Fetch the 10 most recent notifications
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
  console.log("\n--- Recent Notifications ---");
  notifications.forEach(n => {
    console.log(`User ID: ${n.user}, Title: ${n.title}, Body: ${n.body}, CreatedAt: ${n.createdAt}`);
  });

  await mongoose.disconnect();
}

check().catch(console.error);
