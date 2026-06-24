// Seed Catalog Script — seeds 20 services, 10 fabrics, and 10 items.
// Run: node seed_catalog.mjs

import mongoose from 'mongoose';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI in .env');
  process.exit(1);
}

// Define schemas
const tenantSchema = new mongoose.Schema({}, { strict: false });
const Tenant = mongoose.models.Tenant ?? mongoose.model('Tenant', tenantSchema);

const serviceSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '👕' },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Service = mongoose.models.Service ?? mongoose.model('Service', serviceSchema);

const materialSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Material = mongoose.models.Material ?? mongoose.model('Material', materialSchema);

const itemSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Item = mongoose.models.Item ?? mongoose.model('Item', itemSchema);

const servicesData = [
  { name: 'Dry Clean', icon: '🧥', price: 80, description: 'Chemical cleaning process for delicate clothes' },
  { name: 'Wash & Fold', icon: '👕', price: 40, description: 'Standard machine wash, tumble dry, and neat folding' },
  { name: 'Steam Press', icon: '♨️', price: 30, description: 'High-pressure steam ironing for wrinkle-free clothes' },
  { name: 'Iron Only', icon: '🔥', price: 15, description: 'Standard charcoal or electric press ironing' },
  { name: 'Stain Removal', icon: '✨', price: 100, description: 'Targeted spot treatment for tough stains' },
  { name: 'Shoe Cleaning', icon: '👟', price: 120, description: 'Deep clean, disinfection, and polish for footwear' },
  { name: 'Curtain Cleaning', icon: '🪟', price: 150, description: 'Specialized washing and dusting for drapes and curtains' },
  { name: 'Blanket Wash', icon: '🛏️', price: 200, description: 'Deep sanitization and wash for heavy blankets and duvets' },
  { name: 'Premium Wash', icon: '🧼', price: 70, description: 'Mild detergent wash with fabric softeners for premium wear' },
  { name: 'Express Wash', icon: '⚡', price: 90, description: 'Super fast washing and drying delivered in under 6 hours' },
  { name: 'Eco Wash', icon: '🌱', price: 45, description: 'Environment-friendly wash using biodegradable detergents' },
  { name: 'Suede Care', icon: '👢', price: 250, description: 'Special treatment and brush cleaning for suede materials' },
  { name: 'Leather Polish', icon: '👜', price: 300, description: 'Polishing, conditioning, and restoration for leather goods' },
  { name: 'Fabric Softening', icon: '🌸', price: 20, description: 'Conditioning rinse to restore fabric plushness and scent' },
  { name: 'Sanitization', icon: '🛡️', price: 35, description: 'Antibacterial wash to eliminate germs and allergens' },
  { name: 'Pet Hair Removal', icon: '🐶', price: 50, description: 'Hair scraping and specialized roller linting treatment' },
  { name: 'Rug Cleaning', icon: '🧣', price: 180, description: 'Deep scrub, vacuuming, and drying for rugs and carpets' },
  { name: 'Bleaching', icon: '🥚', price: 25, description: 'Oxygen-bleach whitening treatment for pure white clothes' },
  { name: 'Dyeing', icon: '🎨', price: 150, description: 'Re-coloring fabrics to restore faded pigments or change shades' },
  { name: 'Starch Finish', icon: '👔', price: 25, description: 'Traditional starching for stiff, crisp formal collars and cuffs' },
];

const fabricsData = [
  { name: 'Cotton', price: 10 },
  { name: 'Silk', price: 50 },
  { name: 'Wool', price: 40 },
  { name: 'Linen', price: 20 },
  { name: 'Polyester', price: 5 },
  { name: 'Denim', price: 15 },
  { name: 'Leather', price: 80 },
  { name: 'Velvet', price: 60 },
  { name: 'Satin', price: 30 },
  { name: 'Nylon', price: 8 },
];

const clothingItemsData = [
  { name: 'Shirt', price: 20 },
  { name: 'Trouser', price: 25 },
  { name: 'Saree', price: 60 },
  { name: 'Suit/Blazer', price: 100 },
  { name: 'Jacket', price: 75 },
  { name: 'Dress', price: 45 },
  { name: 'T-Shirt', price: 15 },
  { name: 'Bedsheet', price: 50 },
  { name: 'Blanket', price: 80 },
  { name: 'Kurta', price: 30 },
];

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the active tenant
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.error('❌ No tenant found in database. Please register an owner first.');
      process.exit(1);
    }
    const tenantId = tenant._id;
    console.log(`ℹ️ Seeding catalog for Tenant ID: ${tenantId}`);

    // 1. Clear existing records for this tenant to ensure clean database state
    const sDel = await Service.deleteMany({ tenant: tenantId });
    const mDel = await Material.deleteMany({ tenant: tenantId });
    const iDel = await Item.deleteMany({ tenant: tenantId });
    console.log(`🧹 Cleared existing catalog elements: ${sDel.deletedCount} services, ${mDel.deletedCount} fabrics, ${iDel.deletedCount} items.`);

    // 2. Insert Services
    const seededServices = await Service.insertMany(
      servicesData.map((s, index) => ({
        ...s,
        tenant: tenantId,
        isActive: true,
        sortOrder: index,
      }))
    );
    console.log(`✅ Seeded ${seededServices.length} Services.`);

    // 3. Insert Fabrics (Materials)
    const seededFabrics = await Material.insertMany(
      fabricsData.map((f) => ({
        ...f,
        tenant: tenantId,
        isActive: true,
      }))
    );
    console.log(`✅ Seeded ${seededFabrics.length} Fabrics (Materials).`);

    // 4. Insert Clothing Items
    const seededItems = await Item.insertMany(
      clothingItemsData.map((item) => ({
        ...item,
        tenant: tenantId,
        isActive: true,
      }))
    );
    console.log(`✅ Seeded ${seededItems.length} Clothing Items.`);

    console.log('🎉 Catalog Seeding Completed Successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
