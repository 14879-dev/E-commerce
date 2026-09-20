import mongoose, { model } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ProductSchema, CategorySchema, OrderSchema, ReviewSchema, MessageSchema } from '../index';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

const ProductModel = model('Product', ProductSchema);
const CategoryModel = model('Category', CategorySchema);
const OrderModel = model('Order', OrderSchema);
const ReviewModel = model('Review', ReviewSchema);
const MessageModel = model('Message', MessageSchema);

async function runSync() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is missing in backend/.env');
    process.exit(1);
  }

  console.log('🔄 Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas successfully');

    // 1. Sync Products
    const productsPath = path.join(__dirname, '../data/products.json');
    if (fs.existsSync(productsPath)) {
      const raw = fs.readFileSync(productsPath, 'utf-8');
      const products: any[] = JSON.parse(raw);
      console.log(`📦 Found ${products.length} products on disk. Uploading/Upserting to MongoDB...`);

      let upsertedCount = 0;
      for (const p of products) {
        const sanitized = {
          ...p,
          availableSizes: Array.isArray(p.availableSizes)
            ? p.availableSizes.map(Number).filter((s: number) => s >= 7 && s <= 13)
            : [7, 8, 9, 10, 11, 12, 13],
        };
        await ProductModel.findOneAndUpdate(
          { $or: [{ id: p.id }, { slug: p.slug }] },
          { $set: sanitized },
          { upsert: true, new: true }
        );
        upsertedCount++;
      }
      console.log(`✅ ${upsertedCount} products successfully synced into MongoDB!`);
    }

    // 2. Sync Categories
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    if (fs.existsSync(categoriesPath)) {
      const raw = fs.readFileSync(categoriesPath, 'utf-8');
      const categories: any[] = JSON.parse(raw);
      console.log(`📁 Found ${categories.length} categories on disk. Syncing to MongoDB...`);

      for (const cat of categories) {
        await CategoryModel.findOneAndUpdate(
          { $or: [{ id: cat.id }, { slug: cat.slug }] },
          { $set: cat },
          { upsert: true, new: true }
        );
      }
      console.log(`✅ ${categories.length} categories successfully synced into MongoDB!`);
    }

    console.log('🎉 Full database sync completed cleanly.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Database sync failed:', err.message);
    if (err.message.includes('whitelist') || err.message.includes('Could not connect to any servers')) {
      console.log('\n👉 TIP: Please make sure your IP is whitelisted in MongoDB Atlas:');
      console.log('1. Go to MongoDB Atlas dashboard -> Network Access');
      console.log('2. Click "Add IP Address" -> Select "Allow Access From Anywhere" (0.0.0.0/0) or add your current IP.');
    }
    process.exit(1);
  }
}

runSync();
