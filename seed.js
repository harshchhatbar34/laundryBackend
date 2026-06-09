require('dotenv').config();
const mongoose = require('mongoose');
const Material = require('./src/modules/service/material.model');
const Item = require('./src/modules/service/item.model');
const Service = require('./src/modules/service/service.model');
const Price = require('./src/modules/service/price.model');

const materials = ['Cotton', 'Silk', 'Wool', 'Linen', 'Synthetic'];
const items = ['Shirt', 'Pant', 'Saree', 'T-Shirt', 'Suit', 'Curtain'];
const services = [
  { name: 'Wash', icon: '🧺', sortOrder: 1 },
  { name: 'Iron', icon: '💨', sortOrder: 2 },
  { name: 'Dry Clean', icon: '✨', sortOrder: 3 },
  { name: 'Wash & Iron', icon: '👔', sortOrder: 4 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Material.deleteMany({});
    await Item.deleteMany({});
    await Service.deleteMany({});
    await Price.deleteMany({});

    console.log('Cleared existing master data');

    // Seed Materials
    const createdMaterials = await Material.insertMany(materials.map(name => ({ name })));
    console.log(`Seeded ${createdMaterials.length} materials`);

    // Seed Items
    const createdItems = await Item.insertMany(items.map(name => ({ name })));
    console.log(`Seeded ${createdItems.length} items`);

    // Seed Services
    const createdServices = await Service.insertMany(services);
    console.log(`Seeded ${createdServices.length} services`);

    // Seed Prices (Example dynamic seeding)
    const prices = [];
    for (const m of createdMaterials) {
      for (const i of createdItems) {
        for (const s of createdServices) {
          // Logic for base price
          let basePrice = 20; // Default
          if (m.name === 'Silk' || m.name === 'Wool') basePrice += 30;
          if (s.name === 'Dry Clean') basePrice += 50;
          if (i.name === 'Saree' || i.name === 'Suit') basePrice += 100;

          prices.push({
            material: m._id,
            item: i._id,
            service: s._id,
            price: basePrice,
          });
        }
      }
    }

    await Price.insertMany(prices);
    console.log(`Seeded ${prices.length} prices`);

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
