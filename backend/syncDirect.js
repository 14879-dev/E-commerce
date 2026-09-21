const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function uploadToMongo() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to Mongo Atlas...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ Connected to MongoDB Atlas!');
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    const categoriesCollection = db.collection('categories');

    // 1. Upload Products
    const productsRaw = fs.readFileSync(path.join(__dirname, 'src/data/products.json'), 'utf-8');
    const products = JSON.parse(productsRaw);
    console.log(`📦 Uploading ${products.length} products to MongoDB Atlas...`);

    for (const p of products) {
      const sanitized = {
        ...p,
        availableSizes: Array.isArray(p.availableSizes)
          ? p.availableSizes.map(Number).filter(s => s >= 7 && s <= 13)
          : [7, 8, 9, 10, 11, 12, 13]
      };
      await productsCollection.updateOne(
        { $or: [{ id: p.id }, { slug: p.slug }] },
        { $set: sanitized },
        { upsert: true }
      );
    }

    // 2. Upload Categories
    const categoriesRaw = fs.readFileSync(path.join(__dirname, 'src/data/categories.json'), 'utf-8');
    const categories = JSON.parse(categoriesRaw);
    for (const cat of categories) {
      await categoriesCollection.updateOne(
        { $or: [{ id: cat.id }, { slug: cat.slug }] },
        { $set: cat },
        { upsert: true }
      );
    }

    const count = await productsCollection.countDocuments();
    console.log(`🎉 SUCCESS! MongoDB Atlas now has ${count} products.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Mongo error:', err.message);
    process.exit(1);
  }
}
uploadToMongo();
