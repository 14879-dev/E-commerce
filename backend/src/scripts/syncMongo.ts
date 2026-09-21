import mongoose, { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

const ProductSchema = new Schema({
  id: { type: String, unique: true },
  articleTag: { type: String, default: '' },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  subtitle: String,
  category: { type: String, default: 'General' },
  price: { type: Number, required: true },
  originalPrice: Number,
  costPrice: { type: Number, default: 0 },
  description: String,
  features: [String],
  materials: String,
  craftingTime: String,
  images: Schema.Types.Mixed,
  availableSizes: [Number],
  availableColors: [String],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  freeShipping: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 100 },
}, { timestamps: true });

const CategorySchema = new Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
}, { timestamps: true });

const ProductModel = mongoose.models.Product || model('Product', ProductSchema);
const CategoryModel = mongoose.models.Category || model('Category', CategorySchema);

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
    const productsPath = fs.existsSync(path.join(__dirname, '../data/products.json'))
      ? path.join(__dirname, '../data/products.json')
      : path.join(process.cwd(), 'src/data/products.json');

    if (fs.existsSync(productsPath)) {
      const raw = fs.readFileSync(productsPath, 'utf-8');
      const products: any[] = JSON.parse(raw);
      console.log(`📦 Found ${products.length} products on disk. Uploading/Upserting to MongoDB Atlas...`);

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
    const categoriesPath = fs.existsSync(path.join(__dirname, '../data/categories.json'))
      ? path.join(__dirname, '../data/categories.json')
      : path.join(process.cwd(), 'src/data/categories.json');

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
