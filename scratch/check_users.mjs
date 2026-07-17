import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isActive: Boolean,
});

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({ role: { $in: ['helper', 'owner', 'customer'] } }).select('name email role');
    console.log('User Accounts in Database:');
    console.log(JSON.stringify(users, null, 2));

  } catch (err) {
    console.error('❌ Error checking users:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
