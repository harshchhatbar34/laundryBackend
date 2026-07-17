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
    const users = await User.find({
      email: { $in: ['harshchhatbar034@gmail.com', 'harshcustomer@gmail.com', 'helper@harshlaundry.com'] }
    }).select('email role pushToken');
    
    console.log('Database Push Token Status:');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
