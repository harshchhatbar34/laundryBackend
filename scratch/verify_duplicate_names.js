const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

// Define temporary models to avoid importing TypeScript files directly in this plain JS script
const ServiceSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 }
});

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

async function run() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not found");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Generate a dummy tenant ID
    const dummyTenantId = new mongoose.Types.ObjectId();
    console.log(`Using dummy tenant ID: ${dummyTenantId}`);

    // Create first "Wash" service
    console.log("Creating first 'Wash' service...");
    const service1 = await Service.create({
      tenant: dummyTenantId,
      name: "Wash",
      description: "First Wash service",
      price: 10
    });
    console.log("Created first service successfully:", service1._id);

    // Create second "Wash" service for the same tenant
    console.log("Creating second 'Wash' service for the same tenant...");
    const service2 = await Service.create({
      tenant: dummyTenantId,
      name: "Wash",
      description: "Second Wash service",
      price: 15
    });
    console.log("Created second service successfully:", service2._id);

    // Verify both exist
    const found = await Service.find({ tenant: dummyTenantId, name: "Wash" });
    console.log(`Successfully found ${found.length} 'Wash' services for tenant ${dummyTenantId}!`);

    // Clean up
    console.log("Cleaning up created test services...");
    await Service.deleteMany({ tenant: dummyTenantId });
    console.log("Cleanup complete.");

    await mongoose.disconnect();
    console.log("Disconnected. Test passed successfully!");
  } catch (err) {
    console.error("TEST FAILED: Unique constraint might still be active!", err);
    process.exit(1);
  }
}

run();
