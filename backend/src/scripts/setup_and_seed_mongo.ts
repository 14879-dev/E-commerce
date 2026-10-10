import mongoose, { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

// 1. Admin Schema
const AdminUserSchema = new Schema({
  id: { type: String, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  role: { type: String, enum: ['superadmin', 'manager', 'director', 'admin'], default: 'admin' },
  avatar: { type: String, default: '' },
}, { timestamps: true });

// 2. Customer Schema (Permanent Buyers, Directors, VIP)
const CustomerSchema = new Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, default: '' },
  customerType: { type: String, default: 'Permanent Buyer' }, // Permanent Buyer, Director, VIP Patron, Regular Buyer
  notes: { type: String, default: '' },
  joinDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  totalOrders: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  lastOrderDate: { type: String, default: 'Never' },
  status: { type: String, enum: ['active', 'flagged', 'blocked'], default: 'active' },
  savedAddresses: { type: [String], default: [] },
  wishlistCount: { type: Number, default: 0 },
}, { timestamps: true });

// 3. Heritage Club Schema (WhatsApp Broadcast list & Promo code)
const HeritageMemberSchema = new Schema({
  id: { type: String, unique: true },
  whatsapp: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  promoCode: { type: String, default: 'HERITAGE10' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const AdminUserModel = mongoose.models.AdminUser || model('AdminUser', AdminUserSchema, 'admins');
const CustomerModel = mongoose.models.Customer || model('Customer', CustomerSchema, 'customers');
const HeritageMemberModel = mongoose.models.HeritageMember || model('HeritageMember', HeritageMemberSchema, 'heritage_club');

async function main() {
  console.log('🚀 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to database:', mongoose.connection.name);

  // 1. Purge old demo reviews, orders, messages as requested by the user
  console.log('\n🧹 Clearing old demo reviews, orders, and messages...');
  const delOrders = await mongoose.connection.db?.collection('orders').deleteMany({});
  const delReviews = await mongoose.connection.db?.collection('reviews').deleteMany({});
  const delMessages = await mongoose.connection.db?.collection('messages').deleteMany({});
  console.log(`- Cleared ${delOrders?.deletedCount || 0} old demo orders`);
  console.log(`- Cleared ${delReviews?.deletedCount || 0} old demo reviews`);
  console.log(`- Cleared ${delMessages?.deletedCount || 0} old demo messages`);

  // 2. Seed Admins & Managers & Directors in 'admins' collection
  console.log('\n👑 Seeding admins, managers, and directors into `admins` table...');
  const initialAdmins = [
    {
      id: 'admin-super',
      username: 'peshawari',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      name: 'Executive Superadmin',
      role: 'superadmin',
    },
    {
      id: 'admin-director-1',
      username: 'director',
      password: 'Director@123',
      name: 'Managing Director',
      role: 'director',
    },
    {
      id: 'admin-manager-1',
      username: 'manager',
      password: 'Manager@123',
      name: 'Floor Store Manager',
      role: 'manager',
    },
  ];

  for (const adm of initialAdmins) {
    await AdminUserModel.findOneAndUpdate(
      { username: adm.username },
      { $set: adm },
      { upsert: true, new: true }
    );
  }
  const adminCount = await AdminUserModel.countDocuments();
  console.log(`✅ 'admins' table ready with ${adminCount} staff accounts!`);

  // 3. Seed Permanent Buyers & Directors in 'customers' collection
  console.log('\n👥 Seeding permanent buyers & directors into `customers` table...');
  const initialCustomers = [
    {
      id: 'cust-dir-1',
      name: 'Haji Asad Ullah (Director)',
      email: 'director@peshawarichappal.com',
      phone: '+92 300 1234567',
      whatsapp: '+923001234567',
      customerType: 'Director',
      notes: 'Company Managing Director & VIP Executive account',
      savedAddresses: ['Bazaar-e-Kissa Khwani, Peshawar, KPK'],
      totalOrders: 12,
      totalSpend: 78500,
      status: 'active',
      lastOrderDate: '2026-09-28',
    },
    {
      id: 'cust-perm-1',
      name: 'Malik Tariq Khan',
      email: 'tariq.khan@gmail.com',
      phone: '+92 321 9876543',
      whatsapp: '+923219876543',
      customerType: 'Permanent Buyer',
      notes: 'VIP Permanent Buyer - high volume seasonal buyer (Kaptaan & Zalmi size 9)',
      savedAddresses: ['House 14, Sector F-10/2, Islamabad'],
      totalOrders: 8,
      totalSpend: 46000,
      status: 'active',
      lastOrderDate: '2026-10-02',
    },
    {
      id: 'cust-vip-1',
      name: 'Shahid Afridi',
      email: 'shahid.afridi@vip.pk',
      phone: '+92 333 5557788',
      whatsapp: '+923335557788',
      customerType: 'VIP Patron',
      notes: 'Prefers Norzi Brass and Custom Monogram embroidery',
      savedAddresses: ['Hayatabad Phase 3, Peshawar'],
      totalOrders: 5,
      totalSpend: 32000,
      status: 'active',
      lastOrderDate: '2026-10-05',
    },
  ];

  for (const c of initialCustomers) {
    await CustomerModel.findOneAndUpdate(
      { email: c.email },
      { $set: c },
      { upsert: true, new: true }
    );
  }
  const custCount = await CustomerModel.countDocuments();
  console.log(`✅ 'customers' table ready with ${custCount} permanent buyer & director records!`);

  // 4. Seed Heritage Club WhatsApp Broadcast list in 'heritage_club' collection
  console.log('\n📱 Seeding Heritage Club WhatsApp broadcast members into `heritage_club` table...');
  const initialHeritage = [
    {
      id: 'heritage-1',
      whatsapp: '+923001234567',
      name: 'Haji Asad Ullah',
      promoCode: 'HERITAGE10',
      status: 'active',
    },
    {
      id: 'heritage-2',
      whatsapp: '+923219876543',
      name: 'Malik Tariq Khan',
      promoCode: 'HERITAGE10',
      status: 'active',
    },
  ];

  for (const h of initialHeritage) {
    await HeritageMemberModel.findOneAndUpdate(
      { whatsapp: h.whatsapp },
      { $set: h },
      { upsert: true, new: true }
    );
  }
  const clubCount = await HeritageMemberModel.countDocuments();
  console.log(`✅ 'heritage_club' table ready with ${clubCount} WhatsApp broadcast members!`);

  // Final summary of collections in MongoDB Atlas
  console.log('\n=============================================');
  console.log('🎉 CURRENT COLLECTIONS NOW LIVE IN MONGODB ATLAS:');
  const collections = await mongoose.connection.db?.listCollections().toArray() || [];
  for (const col of collections) {
    const count = await mongoose.connection.db?.collection(col.name).countDocuments();
    console.log(`   📂 ${col.name.padEnd(20)} => ${count} documents`);
  }
  console.log('=============================================\n');

  await mongoose.disconnect();
  console.log('👋 Database setup completed successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Setup error:', err);
  process.exit(1);
});
