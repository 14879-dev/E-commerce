import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose, { Schema, model, Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

// --- In-Memory Data Store (fallback when no MongoDB) ---
import { inMemoryProducts, inMemoryOrders, inMemoryReviews, inMemoryMessages } from './data/seed';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'peshawari';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const JWT_SECRET = process.env.JWT_SECRET || 'peshawari-chappal-jwt-secret-fallback';

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================
// MONGOOSE SCHEMAS (used when MONGO_URI is set)
// ============================================================

// Product Schema
const ProductSchema = new Schema({
  id: String,
  slug: { type: String, unique: true },
  name: String,
  subtitle: String,
  price: Number,
  originalPrice: Number,
  category: String,
  description: String,
  features: [String],
  materials: String,
  craftingTime: String,
  isCustomizable: Boolean,
  images: {
    front: String, back: String, left: String, right: String, top: String, sole: String,
  },
  status3D: { type: String, default: 'ready' },
  availableSizes: [Number],
  availableColors: [String],
  customization: {
    availableColors: [String],
    availableSoles: [String],
    availableBuckles: [String],
    allowInitials: Boolean,
  },
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
  isCustomizedOrder: { type: Boolean, default: false },
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

const ProductModel = model('Product', ProductSchema);
const OrderModel = model('Order', OrderSchema);
const ReviewModel = model('Review', ReviewSchema);
const MessageModel = model('Message', MessageSchema);

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
    console.log('✅ MongoDB seeded successfully');
  }
}

connectMongo();

// ============================================================
// JWT AUTH MIDDLEWARE
// ============================================================
interface AdminJwtPayload {
  username: string;
  role: 'superadmin' | 'staff';
  iat?: number;
  exp?: number;
}

function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — admin token required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    (req as any).adminUser = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired admin token' });
  }
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

  // Compare credentials (constant-time comparison for security)
  const usernameMatch = username === ADMIN_USERNAME;
  const passwordMatch = password === ADMIN_PASSWORD;

  if (!usernameMatch || !passwordMatch) {
    // Artificial delay to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 800));
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { username: ADMIN_USERNAME, role: 'superadmin' },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, role: 'superadmin', username: ADMIN_USERNAME, expiresIn: 8 * 60 * 60 });
});

app.post('/api/admin/logout', (_req: Request, res: Response) => {
  // Stateless JWT — client handles token deletion
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/admin/verify', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ valid: true, user: (req as any).adminUser });
});

// ============================================================
// PRODUCT ROUTES
// ============================================================
app.get('/api/products', async (_req: Request, res: Response) => {
  if (useMongoDb) {
    const products = await ProductModel.find().lean();
    res.json(products);
  } else {
    res.json(inMemoryProducts);
  }
});

app.get('/api/products/:slug', async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    const product = await ProductModel.findOne({ $or: [{ slug: req.params.slug }, { id: req.params.slug }] }).lean();
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } else {
    const product = inMemoryProducts.find(p => p.slug === req.params.slug || p.id === req.params.slug);
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  }
});

app.post('/api/products', authenticateAdmin, async (req: Request, res: Response) => {
  const body = req.body;
  const newProduct = {
    id: `prod-${Date.now()}`,
    slug: (body.name || 'chappal').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now()}`,
    name: body.name || 'New Chappal',
    subtitle: body.subtitle || 'Handcrafted leather footwear',
    price: body.price || 150,
    originalPrice: body.originalPrice,
    category: body.category || 'Kaptaan',
    description: body.description || 'Authentic Peshawari handcrafted chappal.',
    features: body.features || ['100% Leather', 'Tire Sole', 'Brass Buckle'],
    materials: body.materials || 'Full grain leather',
    craftingTime: body.craftingTime || '12 Hours',
    isCustomizable: body.isCustomizable ?? true,
    images: body.images || {},
    status3D: 'ready' as const,
    availableSizes: body.availableSizes || [39, 40, 41, 42, 43, 44, 45],
    availableColors: body.availableColors || ['saddle-tan', 'espresso'],
    customization: body.customization || {
      availableColors: ['saddle-tan', 'espresso', 'burnt-copper'],
      availableSoles: ['tire-recycled', 'double-leather'],
      availableBuckles: ['aged-brass'],
      allowInitials: true,
    },
    averageRating: 0,
    reviewCount: 0,
    featured: body.featured ?? false,
    freeShipping: body.freeShipping ?? false,
    inStock: true,
    stockCount: body.stockCount || 100,
  };

  if (useMongoDb) {
    const doc = await ProductModel.create(newProduct);
    res.status(201).json(doc);
  } else {
    inMemoryProducts.unshift(newProduct);
    res.status(201).json(newProduct);
  }
});

app.put('/api/products/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  if (useMongoDb) {
    const product = await ProductModel.findOneAndUpdate(
      { $or: [{ slug: req.params.id }, { id: req.params.id }] },
      { $set: req.body }, { new: true }
    ).lean();
    if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
    res.json(product);
  } else {
    const idx = inMemoryProducts.findIndex(p => p.id === req.params.id || p.slug === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Product not found' }); return; }
    inMemoryProducts[idx] = { ...inMemoryProducts[idx], ...req.body };
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
// 3D PIPELINE STATUS
// ============================================================
app.get('/api/pipeline/:productId', async (req: Request, res: Response) => {
  if (useMongoDb) {
    const product = await ProductModel.findOne({ $or: [{ id: req.params.productId }, { slug: req.params.productId }] }).lean();
    res.json({ productId: req.params.productId, status: (product as any)?.status3D || 'ready' });
  } else {
    const product = inMemoryProducts.find(p => p.id === req.params.productId);
    res.json({ productId: req.params.productId, status: product?.status3D || 'ready' });
  }
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

app.listen(PORT, () => {
  console.log(`🚀 Peshawari Chappal API Server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Admin login: POST http://localhost:${PORT}/api/admin/login`);
});

export default app;
