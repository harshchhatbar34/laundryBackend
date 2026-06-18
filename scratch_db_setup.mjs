import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://qonsult:XXqN6pmOAFZg01Tt@qonsult.jaluwhk.mongodb.net/laundry_db?retryWrites=true&w=majority";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  mobileNumber: { type: String, required: true, unique: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const tenantSchema = new mongoose.Schema({
  tenantCode: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    // Emails to clear and recreate
    const emails = [
      "harshchhatbar34@gmail.com",
      "owner@laundry.com",
      "helper@laundry.com",
      "customer@laundry.com"
    ];

    // Mobile numbers to clear
    const mobiles = [
      "9104051530",
      "9999911111",
      "9999922222",
      "9999933333"
    ];

    console.log("Cleaning existing records by email and mobile...");
    await User.deleteMany({ $or: [{ email: { $in: emails } }, { mobileNumber: { $in: mobiles } }] });
    
    // Hash password
    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    // 1. Create Superadmin
    const superadmin = await User.create({
      name: "Harsh Chhatbar (Superadmin)",
      email: "harshchhatbar34@gmail.com",
      password: hashedPassword,
      mobileNumber: "9104051530",
      role: "superadmin"
    });
    console.log("Superadmin created:", superadmin.email);

    // 2. Create Owner
    const owner = await User.create({
      name: "Laundry Owner",
      email: "owner@laundry.com",
      password: hashedPassword,
      mobileNumber: "9999911111",
      role: "owner"
    });
    console.log("Owner created:", owner.email);

    // 3. Create Tenant with code HK23 linked to Owner
    // Delete existing tenant code HK23 first to avoid unique key collision
    await Tenant.deleteMany({ tenantCode: "HK23" });
    const tenant = await Tenant.create({
      tenantCode: "HK23",
      owner: owner._id,
      isActive: true
    });
    console.log("Tenant created with code HK23 linked to owner.");

    // 4. Create Helper
    const helper = await User.create({
      name: "Laundry Helper",
      email: "helper@laundry.com",
      password: hashedPassword,
      mobileNumber: "9999922222",
      role: "helper",
      tenantId: tenant._id
    });
    console.log("Helper created:", helper.email);

    // 5. Create Customer
    const customer = await User.create({
      name: "Laundry Customer",
      email: "customer@laundry.com",
      password: hashedPassword,
      mobileNumber: "9999933333",
      role: "customer",
      tenantId: tenant._id
    });
    console.log("Customer created:", customer.email);

    console.log("\nSetup completed successfully! All requested accounts are created in the database.");
  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
