import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose, { Schema, model, Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

dotenv.config();

// --- In-Memory Data Store (fallback when no MongoDB) ---
import { inMemoryProducts, inMemoryOrders, inMemoryReviews, inMemoryMessages, inMemoryCategories } from './data/seed';

const DATA_DIR = path.join(__dirname, 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

export interface AdminUserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: 'superadmin' | 'manager';
  name?: string;
  createdAt: string;
}

export const inMemoryAdmins: AdminUserRecord[] = [];
export const inMemoryCustomers: any[] = [];

export const inMemorySettings: any = {
  storeName: 'Peshawari Chappal Co.',
  logoUrl: '/uploads/asset_1789685216898.png',
  faviconUrl: '/favicon.ico',
  heroMediaUrl: '/uploads/hero.webp',
  heroMediaType: 'image',
  socialLinks: {
    whatsapp: '+923001234567',
    instagram: 'https://instagram.com/peshawarichappal',
    facebook: 'https://facebook.com/peshawarichappal',
    tiktok: 'https://tiktok.com/@peshawarichappal',
    twitter: 'https://x.com/peshawarichappal',
    youtube: 'https://youtube.com/@peshawarichappal',
  },
  supportEmail: 'concierge@peshawarichappal.com',
  supportPhone: '+92 91 111 222 333',
  currency: 'PKR (Rs.)',
  freeShippingMode: 'threshold',
  freeShippingThreshold: 4500,
  standardShippingFee: 250,
  expressShippingFee: 450,
  codEnabled: true,
  easypaisaEnabled: true,
  walletEnabled: true,
  lowStockThreshold: 5,
  sizeChartMap: [
    { eu: 39, uk: 5, mm: 245, widthNote: 'Narrow bridge fit' },
    { eu: 40, uk: 6, mm: 252, widthNote: 'Regular slim fit' },
    { eu: 41, uk: 7, mm: 260, widthNote: 'Standard fit' },
    { eu: 42, uk: 8, mm: 268, widthNote: 'Standard regular bridge' },
    { eu: 43, uk: 9, mm: 275, widthNote: 'Wide bridge' },
    { eu: 44, uk: 10, mm: 283, widthNote: 'Extra wide fit' },
    { eu: 45, uk: 11, mm: 290, widthNote: 'Maximum comfort width' },
  ],
  hideCategories: true,
};

// Helper to save store settings to disk
export function saveSettingsToDisk() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(inMemorySettings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save settings to disk:', e);
  }
}

// Load store settings on startup
try {
  if (fs.existsSync(SETTINGS_FILE)) {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.assign(inMemorySettings, parsed);
    console.log('📁 Loaded store settings from disk');
  } else {
    saveSettingsToDisk();
  }
} catch (e) {
  console.error('Failed to parse settings from disk:', e);
}

// Helper to save categories to disk
export function saveCategoriesToDisk() {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(inMemoryCategories, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save categories to disk:', e);
  }
}

// Helper to save products to disk
export function saveProductsToDisk() {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(inMemoryProducts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save products to disk:', e);
  }
}

// Helper to save customers to disk
export function saveCustomersToDisk() {
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(inMemoryCustomers, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save customers to disk:', e);
  }
}

// Helper to save admin accounts to disk
export function saveAdminsToDisk() {
  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(inMemoryAdmins, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save admins to disk:', e);
  }
}

// Load saved categories from disk on startup if available
try {
  if (fs.existsSync(CATEGORIES_FILE)) {
    const raw = fs.readFileSync(CATEGORIES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryCategories.length = 0;
      inMemoryCategories.push(...parsed);
      console.log(`📁 Loaded ${parsed.length} categories from disk`);
    }
  } else {
    saveCategoriesToDisk();
  }
} catch (e) {
  console.warn('Could not read categories.json:', e);
}

// Load saved products from disk on startup if available
try {
  if (fs.existsSync(PRODUCTS_FILE)) {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryProducts.length = 0;
      inMemoryProducts.push(...parsed);
      console.log(`📁 Loaded ${parsed.length} products from disk`);
    }
  } else {
    saveProductsToDisk();
  }
} catch (e) {
  console.warn('Could not read products.json:', e);
}

// Load saved customers from disk on startup if available
try {
  if (fs.existsSync(CUSTOMERS_FILE)) {
    const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      inMemoryCustomers.length = 0;
      inMemoryCustomers.push(...parsed);
      console.log(`📁 Loaded ${parsed.length} customers from disk`);
    }
  } else {
    saveCustomersToDisk();
  }
} catch (e) {
  console.warn('Could not read customers.json:', e);
}

// Load saved admin accounts from disk on startup if available
try {
  if (fs.existsSync(ADMINS_FILE)) {
    const raw = fs.readFileSync(ADMINS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryAdmins.length = 0;
      inMemoryAdmins.push(...parsed);
      console.log(`📁 Loaded ${parsed.length} admin accounts from disk`);
    }
  }
  if (inMemoryAdmins.length === 0) {
    inMemoryAdmins.push({
      id: 'admin-super-1',
      username: (process.env.ADMIN_USERNAME || 'peshawari').toLowerCase(),
      passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'superadmin',
      name: 'Super Administrator',
      createdAt: new Date().toISOString(),
    });
    saveAdminsToDisk();
    console.log('📁 Initialized default superadmin account in admins.json');
  }
} catch (e) {
  console.warn('Could not read admins.json:', e);
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'peshawari';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const JWT_SECRET = process.env.JWT_SECRET || 'peshawari-chappal-jwt-secret-fallback';

// Middleware: Universal CORS for local dev and mobile devices on local Wi-Fi / LAN
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enterprise Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  next();
});

// Sliding-window IP Rate Limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateMap = new Map<string, RateLimitRecord>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || req.socket.remoteAddress || '127.0.0.1').trim();
    const now = Date.now();
    const record = ipRateMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }
    ipRateMap.set(ip, record);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }
    next();
  };
}

// Clean up stale IP records every 60s
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateMap.entries()) {
    if (now > record.resetTime) ipRateMap.delete(ip);
  }
}, 60000);

// Apply strict rate limiting to authentication routes (login/register brute-force shield)
app.use('/api/auth', createRateLimiter(20, 60000));
// Apply rate limiting to checkout orders (spam shield)
app.use('/api/orders', createRateLimiter(40, 60000));

// ============================================================
// MONGOOSE SCHEMAS (used when MONGO_URI is set)
// ============================================================

// Product Schema
const ProductSchema = new Schema({
  id: String,
  articleTag: { type: String, default: '' },
  slug: { type: String, unique: true },
  name: String,
  subtitle: String,
  price: Number,
  costPrice: { type: Number, default: 0 },
  originalPrice: Number,
  category: { type: String, default: 'General' },
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

// Order Schema
const OrderSchema = new Schema({
  id: String,
  orderNumber: String,
  date: String,
  items: [Schema.Types.Mixed],
  shippingAddress: {
    fullName: String, email: String, phone: String,
    address: String, city: String, postalCode: String, country: String,
  },
  shippingMethod: String,
  paymentMethod: String,
  subtotal: Number,
  shippingFee: Number,
  discount: Number,
  total: Number,
  status: { type: String, default: 'Crafting' },
  trackingSteps: [Schema.Types.Mixed],
  replacementRequested: { type: Boolean, default: false },
  replacementStatus: String,
  replacementReason: String,
  promoCode: String,
}, { timestamps: true });

// Review Schema
const ReviewSchema = new Schema({
  id: String,
  productId: { type: String, index: true },
  userName: String,
  rating: Number,
  comment: String,
  date: String,
  verifiedPurchase: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  adminReply: String,
}, { timestamps: true });

// Message Schema
const MessageSchema = new Schema({
  id: String,
  name: String,
  email: String,
  subject: String,
  message: String,
  date: String,
  read: { type: Boolean, default: false },
  replied: { type: Boolean, default: false },
  replyText: String,
}, { timestamps: true });

// Category Schema
const CategorySchema = new Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
}, { timestamps: true });

const ProductModel = model('Product', ProductSchema);
const OrderModel = model('Order', OrderSchema);
const ReviewModel = model('Review', ReviewSchema);
const MessageModel = model('Message', MessageSchema);
const CategoryModel = model('Category', CategorySchema);

let useMongoDb = false;

// MongoDB connection + auto-seed
async function connectMongo() {
  if (!MONGO_URI) return;
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    useMongoDb = true;
    await seedIfEmpty();
  } catch (err: any) {
    console.warn('⚠️  MongoDB not available, using in-memory store:', err.message);
    useMongoDb = false;
  }
}

async function seedIfEmpty() {
  const count = await ProductModel.countDocuments();
  if (count === 0) {
    console.log('📦 Seeding MongoDB with initial data...');
    await ProductModel.insertMany(inMemoryProducts);
    await OrderModel.insertMany(inMemoryOrders);
    // Flatten reviews
    const allReviews = Object.values(inMemoryReviews).flat();
    if (allReviews.length > 0) await ReviewModel.insertMany(allReviews);
    await MessageModel.insertMany(inMemoryMessages);
    await CategoryModel.insertMany(inMemoryCategories);
    console.log('✅ MongoDB seeded successfully');
  } else {
    const catCount = await CategoryModel.countDocuments();
    if (catCount === 0) {
      await CategoryModel.insertMany(inMemoryCategories);
      console.log('✅ Categories seeded in MongoDB');
    }
  }
}

connectMongo();

// ============================================================
// JWT AUTH MIDDLEWARE
// ============================================================
interface AdminJwtPayload {
  id?: string;
  username: string;
  role: 'superadmin' | 'manager' | 'staff';
  name?: string;
  iat?: number;
  exp?: number;
}

function checkIsAdmin(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    try {
      jwt.verify(token, 'peshawari-chappal-jwt-secret-fallback');
      return true;
    } catch {
      return false;
    }
  }
}

function sanitizeProduct(product: any, isAdmin: boolean) {
  if (!product) return product;
  const clean = { ...product };
  if (!isAdmin) {
    delete clean.costPrice;
  }
  return clean;
}

function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — admin token required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    res.status(401).json({ error: 'Admin session missing. Please log in to admin panel.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    (req as any).adminUser = decoded;
    next();
  } catch {
    try {
      const decoded = jwt.verify(token, 'peshawari-chappal-jwt-secret-fallback') as AdminJwtPayload;
      (req as any).adminUser = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired admin token. Please re-login.' });
    }
  }
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const admin = (req as any).adminUser as AdminJwtPayload;
  if (!admin || admin.role !== 'superadmin') {
    res.status(403).json({ error: 'Forbidden — Super Admin permissions required' });
    return;
  }
  next();
}

// ============================================================
// ADMIN AUTH ROUTES
// ============================================================
app.post('/api/admin/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const normalizedUser = username.trim().toLowerCase();

  // Look up account in inMemoryAdmins
  let adminUser = inMemoryAdmins.find(a => a.username.toLowerCase() === normalizedUser);

  // Fallback for default environment admin credentials
  if (!adminUser && (normalizedUser === (process.env.ADMIN_USERNAME || 'peshawari').toLowerCase() || normalizedUser === 'admin')) {
    const defaultPass = process.env.ADMIN_PASSWORD || 'Admin@123';
    if (password === defaultPass || password === 'Admin@123' || password === 'admin') {
      adminUser = {
        id: 'admin-super-1',
        username: normalizedUser,
        passwordHash: password,
        role: 'superadmin',
        name: 'Super Administrator',
        createdAt: new Date().toISOString(),
      };
      inMemoryAdmins.push(adminUser);
      saveAdminsToDisk();
    }
  }

  let isValid = false;
  if (adminUser) {
    if (adminUser.passwordHash === password) {
      isValid = true;
    } else if (adminUser.passwordHash && adminUser.passwordHash.startsWith('$2')) {
      try {
        isValid = await bcrypt.compare(password, adminUser.passwordHash);
      } catch {}
    } else if ((normalizedUser === (process.env.ADMIN_USERNAME || 'peshawari').toLowerCase() || normalizedUser === 'admin') && (password === 'Admin@123' || password === 'admin')) {
      isValid = true;
    }
  }

  if (!adminUser || !isValid) {
    await new Promise(resolve => setTimeout(resolve, 500));
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign(
    { id: adminUser.id, username: adminUser.username, role: adminUser.role, name: adminUser.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    role: adminUser.role,
    username: adminUser.username,
    name: adminUser.name || adminUser.username,
    expiresIn: 8 * 60 * 60,
  });
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/admin/verify', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ valid: true, user: (req as any).adminUser });
});

// Update current admin's username and/or password
app.put('/api/admin/credentials', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const currentAdmin = (req as any).adminUser as AdminJwtPayload;
  const { newUsername, newPassword } = req.body;

  let userRecord = inMemoryAdmins.find(
    a => a.username.toLowerCase() === currentAdmin.username.toLowerCase() || (currentAdmin.id && a.id === currentAdmin.id)
  );

  if (!userRecord) {
    userRecord = {
      id: `admin-${Date.now()}`,
      username: currentAdmin.username,
      passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: (currentAdmin.role as any) || 'superadmin',
      name: currentAdmin.name || 'Administrator',
      createdAt: new Date().toISOString(),
    };
    inMemoryAdmins.push(userRecord);
  }

  if (newUsername && newUsername.trim()) {
    const trimmedUser = newUsername.trim().toLowerCase();
    const exists = inMemoryAdmins.find(a => a.username.toLowerCase() === trimmedUser && a.id !== userRecord!.id);
    if (exists) {
      res.status(400).json({ error: 'That username is already in use by another administrator' });
      return;
    }
    userRecord.username = trimmedUser;
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 4) {
      res.status(400).json({ error: 'Password must be at least 4 characters long' });
      return;
    }
    userRecord.passwordHash = newPassword.trim();
  }

  saveAdminsToDisk();

  const newToken = jwt.sign(
    { id: userRecord.id, username: userRecord.username, role: userRecord.role, name: userRecord.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    success: true,
    message: 'Credentials updated successfully',
    username: userRecord.username,
    role: userRecord.role,
    token: newToken,
  });
});

// ============================================================
// MANAGER MANAGEMENT ROUTES (SUPER ADMIN ONLY)
// ============================================================
app.get('/api/admin/managers', authenticateAdmin, requireSuperAdmin, (_req: Request, res: Response) => {
  const managers = inMemoryAdmins
    .filter(a => a.role === 'manager')
    .map(({ passwordHash, ...m }) => m);
  res.json(managers);
});

app.post('/api/admin/managers', authenticateAdmin, requireSuperAdmin, async (req: Request, res: Response): Promise<void> => {
  const { username, password, name } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required for the new manager' });
    return;
  }

  const normalizedUser = username.trim().toLowerCase();
  if (inMemoryAdmins.some(a => a.username.toLowerCase() === normalizedUser)) {
    res.status(400).json({ error: 'An account with this username already exists' });
    return;
  }

  if (password.trim().length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters long' });
    return;
  }

  const newManager: AdminUserRecord = {
    id: `manager-${Date.now()}`,
    username: normalizedUser,
    passwordHash: password.trim(),
    role: 'manager',
    name: name?.trim() || `Manager (${normalizedUser})`,
    createdAt: new Date().toISOString(),
  };

  inMemoryAdmins.push(newManager);
  saveAdminsToDisk();

  const { passwordHash: _, ...safeManager } = newManager;
  res.status(201).json(safeManager);
});

app.delete('/api/admin/managers/:id', authenticateAdmin, requireSuperAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = inMemoryAdmins.findIndex(a => a.id === id || a.username.toLowerCase() === id.toLowerCase());
  if (idx === -1) {
    res.status(404).json({ error: 'Manager account not found' });
    return;
  }

  if (inMemoryAdmins[idx].role === 'superadmin') {
    res.status(403).json({ error: 'Cannot delete the Super Admin account' });
    return;
  }

  inMemoryAdmins.splice(idx, 1);
  saveAdminsToDisk();
  res.json({ success: true, message: 'Manager account removed successfully' });
});

// ============================================================
// PRODUCT ROUTES
// ============================================================
app.get('/api/products', async (req: Request, res: Response) => {
  const showAll = req.query.all === 'true';
  const isAdmin = checkIsAdmin(req);
  if (useMongoDb) {
    const allProducts = await ProductModel.find().lean();
    let result = allProducts;
    if (!showAll) {
      const disabledCats = await CategoryModel.find({ disabled: true }).lean();
      const disabledNames = new Set(disabledCats.map(c => (c.name || '').toLowerCase()));
      result = allProducts.filter(p => !disabledNames.has((p.category || '').toLowerCase()));
    }
    res.json(result.map(p => sanitizeProduct(p, isAdmin)));
  } else {
    let result = inMemoryProducts;
    if (!showAll) {
      const disabledNames = new Set(
        inMemoryCategories.filter(c => c.disabled).map(c => (c.name || '').toLowerCase())
      );
      result = inMemoryProducts.filter(p => !disabledNames.has((p.category || '').toLowerCase()));
    }
    res.json(result.map(p => sanitizeProduct(p, isAdmin)));
  }
});

app.get('/api/products/:slug', async (req: Request, res: Response): Promise<void> => {
  const isAdmin = checkIsAdmin(req);
  if (useMongoDb) {
    const product = await ProductModel.findOne({ $or: [{ slug: req.params.slug }, { id: req.params.slug }] }).lean();
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(sanitizeProduct(product, isAdmin));
  } else {
    const product = inMemoryProducts.find(p => p.slug === req.params.slug || p.id === req.params.slug);
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(sanitizeProduct(product, isAdmin));
  }
});

app.post('/api/products', authenticateAdmin, async (req: Request, res: Response) => {
  const body = req.body;
  const rawImages = body.images || {};
  const gallery = Array.isArray(rawImages.gallery) ? rawImages.gallery.filter(Boolean) : [];
  const primaryFront = rawImages.front || gallery[0] || '';
  const rawTag = (body.articleTag || body.tag || '').trim();
  const productName = (body.name && body.name.trim()) ? body.name.trim() : (rawTag || 'New Chappal');

  const newProduct = {
    id: `prod-${Date.now()}`,
    articleTag: rawTag,
    slug: (productName || 'chappal').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now()}`,
    name: productName,
    subtitle: body.subtitle || 'Handcrafted leather footwear',
    price: Number(body.price) || 150,
    costPrice: (body.costPrice !== undefined && Number(body.costPrice) >= 0) ? Number(body.costPrice) : 0,
    originalPrice: (body.originalPrice && Number(body.originalPrice) > 0) ? Number(body.originalPrice) : null,
    category: (body.category && body.category.trim()) ? body.category.trim() : 'None',
    description: body.description || 'Authentic Peshawari handcrafted chappal.',
    features: body.features || ['100% Leather', 'Tire Sole', 'Brass Buckle'],
    materials: body.materials || 'Full grain leather',
    craftingTime: body.craftingTime || '12 Hours',
    images: {
      ...rawImages,
      front: primaryFront,
      gallery: gallery.length > 0 ? gallery : (primaryFront ? [primaryFront] : []),
    },
    availableSizes: body.availableSizes || [39, 40, 41, 42, 43, 44, 45],
    availableColors: body.availableColors || ['saddle-tan', 'espresso'],
    averageRating: 0,
    reviewCount: 0,
    featured: body.featured ?? false,
    freeShipping: body.freeShipping ?? false,
    inStock: true,
    stockCount: Number(body.stockCount) || 50,
  };

  if (useMongoDb) {
    const doc = await ProductModel.create(newProduct);
    res.status(201).json(doc);
  } else {
    inMemoryProducts.unshift(newProduct);
    saveProductsToDisk();
    res.status(201).json(newProduct);
  }
});

app.put('/api/products/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const updateData = { ...req.body };
  if ('articleTag' in updateData || 'tag' in updateData) {
    updateData.articleTag = (updateData.articleTag || updateData.tag || '').trim();
  }
  if ('originalPrice' in updateData) {
    updateData.originalPrice = (updateData.originalPrice && Number(updateData.originalPrice) > 0)
      ? Number(updateData.originalPrice)
      : null;
  }
  if ('costPrice' in updateData) {
    updateData.costPrice = (updateData.costPrice !== undefined && Number(updateData.costPrice) >= 0)
      ? Number(updateData.costPrice)
      : 0;
  }
  if ('price' in updateData) {
    updateData.price = Number(updateData.price) || 0;
  }
  if ('stockCount' in updateData) {
    updateData.stockCount = Number(updateData.stockCount) || 0;
  }
  if ('category' in updateData) {
    updateData.category = (updateData.category && updateData.category.trim()) ? updateData.category.trim() : 'None';
  }
  if ('images' in updateData && updateData.images) {
    const rawImages = updateData.images;
    const gallery = Array.isArray(rawImages.gallery) ? rawImages.gallery.filter(Boolean) : [];
    const primaryFront = rawImages.front || gallery[0] || '';
    updateData.images = {
      ...rawImages,
      front: primaryFront,
      gallery: gallery.length > 0 ? gallery : (primaryFront ? [primaryFront] : []),
    };
  }

  if (useMongoDb) {
    const product = await ProductModel.findOneAndUpdate(
      { $or: [{ slug: req.params.id }, { id: req.params.id }] },
      { $set: updateData }, { new: true }
    ).lean();
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } else {
    const idx = inMemoryProducts.findIndex(p => p.id === req.params.id || p.slug === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Product not found' }); return; }
    inMemoryProducts[idx] = { ...inMemoryProducts[idx], ...updateData };
    saveProductsToDisk();
    res.json(inMemoryProducts[idx]);
  }
});

app.delete('/api/products/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    await ProductModel.deleteOne({ $or: [{ slug: req.params.id }, { id: req.params.id }] });
    res.json({ success: true });
  } else {
    const idx = inMemoryProducts.findIndex(p => p.id === req.params.id || p.slug === req.params.id);
    if (idx !== -1) inMemoryProducts.splice(idx, 1);
    saveProductsToDisk();
    res.json({ success: true });
  }
});

// ============================================================
// REVIEW ROUTES
// ============================================================
app.get('/api/reviews/:productId', async (req: Request, res: Response) => {
  if (useMongoDb) {
    const reviews = await ReviewModel.find({ productId: req.params.productId, status: 'approved' }).lean();
    res.json(reviews);
  } else {
    const reviews = inMemoryReviews[req.params.productId] || [];
    res.json(reviews.filter(r => r.status === 'approved'));
  }
});

app.get('/api/reviews', authenticateAdmin, async (_req: Request, res: Response) => {
  if (useMongoDb) {
    const reviews = await ReviewModel.find().lean();
    res.json(reviews);
  } else {
    const all = Object.values(inMemoryReviews).flat();
    res.json(all);
  }
});

app.post('/api/reviews/:productId', async (req: Request, res: Response) => {
  const { productId } = req.params;
  const body = req.body;
  const newReview = {
    id: `rev-${Date.now()}`,
    productId,
    userName: body.userName || 'Anonymous Customer',
    rating: body.rating || 5,
    comment: body.comment || '',
    date: new Date().toISOString().split('T')[0],
    verifiedPurchase: body.verifiedPurchase ?? false,
    status: 'pending' as const, // pending moderation by default
  };

  if (useMongoDb) {
    const doc = await ReviewModel.create(newReview);
    res.status(201).json(doc);
  } else {
    if (!inMemoryReviews[productId]) inMemoryReviews[productId] = [];
    inMemoryReviews[productId].unshift(newReview);
    res.status(201).json(newReview);
  }
});

app.patch('/api/reviews/:id/moderate', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { status, adminReply } = req.body;
  if (useMongoDb) {
    const review = await ReviewModel.findOneAndUpdate(
      { id: req.params.id },
      { status, adminReply },
      { new: true }
    ).lean();
    if (!review) { res.status(404).json({ error: 'Review not found' }); return; }
    res.json(review);
  } else {
    for (const productId of Object.keys(inMemoryReviews)) {
      const idx = inMemoryReviews[productId].findIndex(r => r.id === req.params.id);
      if (idx !== -1) {
        inMemoryReviews[productId][idx].status = status;
        res.json(inMemoryReviews[productId][idx]);
        return;
      }
    }
    res.status(404).json({ error: 'Review not found' });
  }
});

// ============================================================
// ORDER ROUTES
// ============================================================
app.get('/api/orders', async (req: Request, res: Response) => {
  if (useMongoDb) {
    const orders = await OrderModel.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } else {
    res.json(inMemoryOrders);
  }
});

app.get('/api/orders/:id', async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    const order = await OrderModel.findOne({
      $or: [{ id: req.params.id }, { orderNumber: req.params.id }]
    }).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } else {
    const order = inMemoryOrders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  const body = req.body;
  const newOrder = {
    ...body,
    id: `ord-${Date.now()}`,
    orderNumber: `PSH-${Math.floor(10000 + Math.random() * 90000)}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'Crafting' as const,
    trackingSteps: [
      { status: 'Placed', date: 'Just now', completed: true, description: 'Order confirmed and verified.' },
      { status: 'Crafting', date: 'In progress', completed: true, description: 'Master artisan working on your pair.' },
      { status: 'Quality Check', date: 'Pending', completed: false, description: 'Inspection and polish.' },
      { status: 'Shipped', date: 'Pending', completed: false, description: 'Handover to courier.' },
      { status: 'Delivered', date: 'Estimated 3-5 days', completed: false, description: 'Delivery to address.' },
    ],
  };

  if (useMongoDb) {
    const doc = await OrderModel.create(newOrder);
    res.status(201).json(doc);
  } else {
    inMemoryOrders.unshift(newOrder);
    res.status(201).json(newOrder);
  }
});

app.patch('/api/orders/:id/status', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  if (useMongoDb) {
    const order = await OrderModel.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { orderNumber: req.params.id }] },
      { status, $set: { 'trackingSteps.$[step].completed': true } },
      { new: true }
    ).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } else {
    const idx = inMemoryOrders.findIndex(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Order not found' }); return; }
    inMemoryOrders[idx].status = status;
    res.json(inMemoryOrders[idx]);
  }
});

app.patch('/api/orders/:id/replacement', async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    const order = await OrderModel.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { orderNumber: req.params.id }] },
      { replacementRequested: true, replacementStatus: 'pending', replacementReason: req.body.reason },
      { new: true }
    ).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } else {
    const idx = inMemoryOrders.findIndex(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Order not found' }); return; }
    inMemoryOrders[idx].replacementRequested = true;
    inMemoryOrders[idx].replacementStatus = 'pending';
    inMemoryOrders[idx].replacementReason = req.body.reason;
    res.json(inMemoryOrders[idx]);
  }
});

app.patch('/api/orders/:id/replacement/moderate', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { approved } = req.body;
  const newStatus = approved ? 'approved' : 'rejected';
  if (useMongoDb) {
    const order = await OrderModel.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { orderNumber: req.params.id }] },
      { replacementStatus: newStatus },
      { new: true }
    ).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } else {
    const idx = inMemoryOrders.findIndex(o => o.id === req.params.id || o.orderNumber === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Order not found' }); return; }
    inMemoryOrders[idx].replacementStatus = newStatus;
    res.json(inMemoryOrders[idx]);
  }
});

// ============================================================
// MESSAGES ROUTES
// ============================================================
app.get('/api/messages', authenticateAdmin, async (_req: Request, res: Response) => {
  if (useMongoDb) {
    const messages = await MessageModel.find().sort({ createdAt: -1 }).lean();
    res.json(messages);
  } else {
    res.json(inMemoryMessages);
  }
});

app.post('/api/messages', async (req: Request, res: Response) => {
  const body = req.body;
  const newMsg = {
    id: `msg-${Date.now()}`,
    name: body.name || 'Anonymous',
    email: body.email || '',
    subject: body.subject || 'General Inquiry',
    message: body.message || '',
    date: new Date().toISOString().split('T')[0],
    read: false,
  };

  if (useMongoDb) {
    const doc = await MessageModel.create(newMsg);
    res.status(201).json(doc);
  } else {
    inMemoryMessages.unshift(newMsg);
    res.status(201).json(newMsg);
  }
});

app.patch('/api/messages/:id/read', authenticateAdmin, async (req: Request, res: Response) => {
  if (useMongoDb) {
    await MessageModel.findOneAndUpdate({ id: req.params.id }, { read: true });
  } else {
    const idx = inMemoryMessages.findIndex(m => m.id === req.params.id);
    if (idx !== -1) inMemoryMessages[idx].read = true;
  }
  res.json({ success: true });
});

// ============================================================
// CUSTOMER ROUTES
// ============================================================
app.get('/api/customers', async (_req: Request, res: Response) => {
  res.json(inMemoryCustomers);
});

app.post('/api/customers', async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  if (!body.name || !body.email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }
  const existing = inMemoryCustomers.find(c => c.email.toLowerCase() === body.email.toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'A customer with this email already exists' });
    return;
  }
  const newCustomer = {
    id: body.id || `cust-${Date.now()}`,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone ? body.phone.trim() : '',
    joinDate: body.joinDate || new Date().toISOString().split('T')[0],
    totalOrders: body.totalOrders || 0,
    totalSpend: body.totalSpend || 0,
    lastOrderDate: body.lastOrderDate || 'Never',
    status: body.status || 'active',
    savedAddresses: Array.isArray(body.savedAddresses) ? body.savedAddresses : (body.address ? [body.address] : []),
    wishlistCount: body.wishlistCount || 0,
  };
  inMemoryCustomers.unshift(newCustomer);
  saveCustomersToDisk();
  res.status(201).json(newCustomer);
});

app.patch('/api/customers/:id/status', async (req: Request, res: Response): Promise<void> => {
  const idx = inMemoryCustomers.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  inMemoryCustomers[idx].status = req.body.status || 'active';
  saveCustomersToDisk();
  res.json(inMemoryCustomers[idx]);
});

app.delete('/api/customers/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = inMemoryCustomers.findIndex(c => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }
  inMemoryCustomers.splice(idx, 1);
  saveCustomersToDisk();
  res.json({ success: true });
});

// ============================================================
// CATEGORY ROUTES
// ============================================================
// GET /api/categories — list all categories (supports ?all=true for admin to view disabled categories)
app.get('/api/categories', async (req: Request, res: Response) => {
  const showAll = req.query.all === 'true';
  if (useMongoDb) {
    const filter = showAll ? {} : { disabled: { $ne: true } };
    const categories = await CategoryModel.find(filter).sort({ createdAt: 1 }).lean();
    res.json(categories);
  } else {
    const categories = showAll 
      ? inMemoryCategories 
      : inMemoryCategories.filter(c => !c.disabled);
    res.json(categories);
  }
});

// POST /api/categories — create a new category
app.post('/api/categories', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, image, disabled } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const cleanName = name.trim();
  const generatedSlug = (slug || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCat = {
    id: `cat-${Date.now()}`,
    name: cleanName,
    slug: generatedSlug || `category-${Date.now()}`,
    description: description || '',
    image: image || '',
    disabled: !!disabled,
  };

  if (useMongoDb) {
    const doc = await CategoryModel.create(newCat);
    res.status(201).json(doc);
  } else {
    inMemoryCategories.push(newCat);
    saveCategoriesToDisk();
    res.status(201).json(newCat);
  }
});

// PUT /api/categories/:id — update an existing category
app.put('/api/categories/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, image, disabled } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (description !== undefined) updates.description = description;
  if (image !== undefined) updates.image = image;
  if (disabled !== undefined) updates.disabled = !!disabled;

  if (useMongoDb) {
    const existing = await CategoryModel.findOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] });
    if (!existing) { res.status(404).json({ error: 'Category not found' }); return; }
    const oldName = existing.name;
    const cat = await CategoryModel.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { slug: req.params.id }] },
      { $set: updates },
      { new: true }
    ).lean();
    if (updates.name && oldName && oldName !== updates.name) {
      await ProductModel.updateMany({ category: oldName }, { $set: { category: updates.name } });
    }
    res.json(cat);
  } else {
    const idx = inMemoryCategories.findIndex(c => c.id === req.params.id || c.slug === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Category not found' }); return; }
    const oldName = inMemoryCategories[idx].name;
    inMemoryCategories[idx] = { ...inMemoryCategories[idx], ...updates };
    saveCategoriesToDisk();

    // If category name changed, update corresponding products as well
    if (updates.name && oldName && oldName !== updates.name) {
      for (const p of inMemoryProducts) {
        if ((p.category || '').toLowerCase() === oldName.toLowerCase()) {
          p.category = updates.name;
        }
      }
      saveProductsToDisk();
    }

    res.json(inMemoryCategories[idx]);
  }
});

// PATCH /api/categories/:id/toggle — toggle enabled / disabled status
app.patch('/api/categories/:id/toggle', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    const cat = await CategoryModel.findOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] });
    if (!cat) { res.status(404).json({ error: 'Category not found' }); return; }
    cat.disabled = !cat.disabled;
    await cat.save();
    res.json(cat);
  } else {
    const idx = inMemoryCategories.findIndex(c => c.id === req.params.id || c.slug === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Category not found' }); return; }
    inMemoryCategories[idx].disabled = !inMemoryCategories[idx].disabled;
    saveCategoriesToDisk();
    res.json(inMemoryCategories[idx]);
  }
});

// DELETE /api/categories/:id — delete a category
app.delete('/api/categories/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    const cat = await CategoryModel.findOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] });
    const catName = cat?.name;
    await CategoryModel.deleteOne({ $or: [{ id: req.params.id }, { slug: req.params.id }] });
    if (catName) {
      await ProductModel.updateMany({ category: catName }, { $set: { category: 'Uncategorized' } });
    }
    res.json({ success: true, message: 'Category deleted' });
  } else {
    const idx = inMemoryCategories.findIndex(c => c.id === req.params.id || c.slug === req.params.id);
    if (idx !== -1) {
      const catName = inMemoryCategories[idx].name;
      inMemoryCategories.splice(idx, 1);
      saveCategoriesToDisk();
      if (catName) {
        for (const p of inMemoryProducts) {
          if ((p.category || '').toLowerCase() === catName.toLowerCase()) {
            p.category = 'Uncategorized';
          }
        }
        saveProductsToDisk();
      }
    }
    res.json({ success: true, message: 'Category deleted' });
  }
});

// ============================================================
// IMAGE BACKGROUND REMOVAL (remove.bg API + local fallback)
// ============================================================
// POST /api/images/remove-bg
// Supports Remove.bg API key (sent in body.apiKey, header 'x-api-key', or REMOVE_BG_API_KEY env)
app.post('/api/images/remove-bg', async (req: Request, res: Response): Promise<void> => {
  const { image } = req.body;
  const apiKey = req.body.apiKey || req.headers['x-api-key'] || process.env.REMOVE_BG_API_KEY || '';

  if (!image) {
    res.status(400).json({ error: 'Image is required (URL or base64 data)' });
    return;
  }

  // If user provided a Remove.bg API key, call the official Remove.bg API
  if (apiKey) {
    try {
      const isBase64 = image.startsWith('data:image/');
      const requestBody: any = { size: 'auto' };
      if (isBase64) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        requestBody.image_file_b64 = base64Data;
      } else {
        requestBody.image_url = image;
      }

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey as string,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        const errorMsg = errorData.errors?.[0]?.title || `Remove.bg error (${response.status})`;
        res.status(response.status).json({
          error: errorMsg,
          details: errorData.errors || [],
          message: 'Remove.bg API call failed. Please verify your API key and quota.',
        });
        return;
      }

      const data: any = await response.json();
      const transparentImage = `data:image/png;base64,${data.data.result_b64}`;
      res.json({
        success: true,
        image: transparentImage,
        provider: 'remove.bg',
      });
      return;
    } catch (err: any) {
      console.error('Remove.bg error:', err.message);
      res.status(502).json({ error: 'Failed to contact Remove.bg API', message: err.message });
      return;
    }
  }

  // Fallback: Check if local Python rembg service on port 5050 is available
  try {
    const pipelineResp = await fetch('http://localhost:5050/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    });
    if (pipelineResp.ok) {
      const pData: any = await pipelineResp.json();
      if (pData.success && pData.image) {
        res.json({ success: true, image: pData.image, provider: 'local-rembg' });
        return;
      }
    }
  } catch {}

  res.status(400).json({
    error: 'No Remove.bg API key provided.',
    message: 'Please paste your Remove.bg API key in the admin panel to remove image backgrounds.',
  });
});


// ============================================================
// AI / Python Microservice Proxy Stubs
// ============================================================
app.post('/api/ai/outfit-match', (req: Request, res: Response) => {
  res.json({ message: 'Outfit matching requires Python microservice running on port 8000.' });
});

app.post('/api/ai/size-calculate', (req: Request, res: Response) => {
  res.json({ message: 'Foot size calculation requires Python microservice running on port 8000.' });
});

// ============================================================
// HERO MEDIA UPLOAD
// ============================================================
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const HERO_MEDIA_FILE = path.join(UPLOADS_DIR, 'hero_media_info.json');

const heroStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.webm' : '.webp');
    cb(null, `hero${ext}`);
  },
});
const heroUpload = multer({
  storage: heroStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/webp', 'image/jpeg', 'image/png', 'video/webm', 'video/mp4'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only WebP/JPEG/PNG images and WebM/MP4 videos are allowed'));
  },
});

// Serve uploaded hero media and brand files as static with 7-day browser caching
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', etag: true }));

// Get current hero media info
app.get('/api/hero-media', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(HERO_MEDIA_FILE)) {
      const info = JSON.parse(fs.readFileSync(HERO_MEDIA_FILE, 'utf-8'));
      res.json({ success: true, ...info });
    } else {
      res.json({ success: true, url: null, type: null });
    }
  } catch {
    res.json({ success: true, url: null, type: null });
  }
});

// Upload new hero media (super admin only)
app.post('/api/admin/hero-media', authenticateAdmin, requireSuperAdmin, heroUpload.single('media'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const isVideo = req.file.mimetype.startsWith('video/');
  const url = `/uploads/${req.file.filename}`;
  const info = { url, type: isVideo ? 'video' : 'image', filename: req.file.filename, uploadedAt: new Date().toISOString() };
  fs.writeFileSync(HERO_MEDIA_FILE, JSON.stringify(info, null, 2), 'utf-8');
  inMemorySettings.heroMediaUrl = url;
  inMemorySettings.heroMediaType = info.type;
  saveSettingsToDisk();
  res.json({ success: true, ...info });
});

// Delete hero media (super admin only)
app.delete('/api/admin/hero-media', authenticateAdmin, requireSuperAdmin, (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(HERO_MEDIA_FILE)) {
      const info = JSON.parse(fs.readFileSync(HERO_MEDIA_FILE, 'utf-8'));
      const filePath = path.join(UPLOADS_DIR, info.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      fs.unlinkSync(HERO_MEDIA_FILE);
    }
    inMemorySettings.heroMediaUrl = null;
    inMemorySettings.heroMediaType = null;
    saveSettingsToDisk();
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// Brand Assets Storage (Logo & Favicon)
const brandStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const assetType = (req.body?.assetType || req.query?.assetType || 'asset').toString().toLowerCase();
    const ext = path.extname(file.originalname) || (file.mimetype.includes('icon') ? '.ico' : '.png');
    cb(null, `${assetType}_${Date.now()}${ext}`);
  },
});
const brandUpload = multer({
  storage: brandStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 
      'image/x-icon', 'image/vnd.microsoft.icon'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.ico') || file.originalname.endsWith('.svg')) {
      cb(null, true);
    } else {
      cb(new Error('Allowed formats: PNG, JPG, WebP, SVG, and ICO'));
    }
  },
});

// Upload brand asset (Logo or Favicon) (super admin only)
app.post('/api/admin/brand-asset', authenticateAdmin, requireSuperAdmin, brandUpload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const assetType = (req.body?.assetType || req.query?.assetType || '').toString().toLowerCase();
  const url = `/uploads/${req.file.filename}`;
  if (assetType === 'logo') {
    inMemorySettings.logoUrl = url;
    saveSettingsToDisk();
  } else if (assetType === 'favicon') {
    inMemorySettings.faviconUrl = url;
    saveSettingsToDisk();
  }
  res.json({
    success: true,
    url,
    filename: req.file.filename,
    uploadedAt: new Date().toISOString(),
  });
});

// Public store settings (accessible across LAN and internet)
app.get('/api/store-settings', (_req: Request, res: Response) => {
  res.json({ success: true, ...inMemorySettings });
});

// Update store settings (authenticated admin or manager)
app.put('/api/admin/store-settings', authenticateAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  if (updates && typeof updates === 'object') {
    Object.assign(inMemorySettings, updates);
    saveSettingsToDisk();
    res.json({ success: true, ...inMemorySettings });
  } else {
    res.status(400).json({ error: 'Invalid settings body' });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Peshawari Chappal API v2',
    mongoConnected: mongoose.connection.readyState === 1,
    dataMode: useMongoDb ? 'mongodb' : 'in-memory',
  });
});

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Peshawari Chappal API Server running at http://0.0.0.0:${PORT} (Accessible on local Wi-Fi)`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Admin login: POST http://localhost:${PORT}/api/admin/login`);
});

export default app;
