import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  pushToken: String,
});

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Clear token for owner and customer
    await User.updateMany(
      { email: { $in: ['harshchhatbar034@gmail.com', 'harshcustomer@gmail.com'] } },
      { $set: { pushToken: null } }
    );
    
    console.log('✅ Stale push tokens cleared for Owner and Customer accounts in DB.');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
