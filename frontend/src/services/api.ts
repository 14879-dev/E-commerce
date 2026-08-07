import type { Product, Order, Review, CustomerMessage } from '../types';
import type { PromoCode, AdminCustomer, AdminNotification, StoreSettings } from '../types/admin';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    slug: 'kaptaan-tan-leather',
    name: 'Kaptaan Signature Tan Chappal',
    subtitle: 'Crafted from full-grain tanned cowhide with double leather sole',
    price: 4500,
    originalPrice: 5500,
    category: 'Kaptaan',
    description: 'The iconic Kaptaan Chappal re-engineered with ergonomic arch support, hand-punched brass buckles, and rich saddle tan leather sourced directly from traditional Peshawar tanneries.',
    features: ['100% Genuine Full-Grain Tanned Leather', 'High-Density Dual Rubber Tire Sole', 'Hand-stitched with waxed linen thread', 'Solid Brass Buckle with Laser-Engraved Crest', 'Breathable Memory-Foam Cushioned Footbed'],
    materials: 'Saddle Tan Cowhide Upper, Recycled Tire Sole, Brass Hardware',
    craftingTime: '12 Hours Master Artisan Handwork',
    isCustomizable: true,
    images: { front: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800', back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800', left: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800', right: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800', top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800', sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800' },
    status3D: 'ready', availableSizes: [39, 40, 41, 42, 43, 44, 45], availableColors: ['saddle-tan', 'espresso', 'burnt-copper'],
    customization: { availableColors: ['saddle-tan', 'espresso', 'burnt-copper', 'midnight-black'], availableSoles: ['tire-recycled', 'double-leather', 'cushioned-foam'], availableBuckles: ['aged-brass', 'burnt-copper', 'antique-silver'], allowInitials: true },
    averageRating: 4.9, reviewCount: 48, featured: true,
  },
  {
    id: 'prod-2',
    slug: 'zalmi-burnt-copper-chappal',
    name: 'Zalmi Royal Burnt Copper',
    subtitle: 'Streamlined contemporary cut with burnt copper leather and soft-touch lining',
    price: 5200, originalPrice: 6200, category: 'Zalmi',
    description: 'Designed for the modern gentleman who demands comfort without compromising heritage. Sleek narrow toe box, hand-burnished edge detail, and lightweight cushioned sole.',
    features: ['Hand-burnished copper hue upper', 'Aerodynamic lightweight profile', 'Moisture-wicking inner leather lining', 'Triple-reinforced T-strap joint'],
    materials: 'Burnished Cowhide Leather, Soft Goatskin Lining, Flexible Rubber Sole',
    craftingTime: '14 Hours Master Artisan Handwork', isCustomizable: true,
    images: { front: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800', back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800', left: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800', right: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800', top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800', sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800' },
    status3D: 'ready', availableSizes: [40, 41, 42, 43, 44], availableColors: ['burnt-copper', 'espresso', 'vintage-tan'],
    customization: { availableColors: ['burnt-copper', 'espresso', 'mustard-gold'], availableSoles: ['tire-recycled', 'cushioned-foam'], availableBuckles: ['burnt-copper', 'aged-brass'], allowInitials: true },
    averageRating: 4.8, reviewCount: 32, featured: true,
  },
  {
    id: 'prod-3',
    slug: 'norzi-classic-espresso',
    name: 'Norzi Master Espresso Edition',
    subtitle: 'Traditional high-curve toe design with deep espresso dark gloss',
    price: 3800, category: 'Norzi',
    description: 'The Norzi chappal represents the authentic vintage silhouette of Old Peshawar bazaar. Deep espresso leather with hand-carved floral motif borders.',
    features: ['High-curve traditional front toe guard', 'Deep espresso hand-stained leather', 'Artisanal hand-tooled border embossing', 'Heavy-duty double leather outsole'],
    materials: 'Vegetable Tanned Leather, Heavy Duty Thread, Aged Brass Buckle',
    craftingTime: '10 Hours Handcrafting', isCustomizable: true,
    images: { front: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800', back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800', left: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800', right: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800', top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800', sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800' },
    status3D: 'ready', availableSizes: [39, 40, 41, 42, 43, 44, 45], availableColors: ['espresso', 'midnight-black'],
    customization: { availableColors: ['espresso', 'midnight-black', 'saddle-tan'], availableSoles: ['double-leather', 'traditional-raw'], availableBuckles: ['aged-brass', 'antique-silver'], allowInitials: true },
    averageRating: 4.95, reviewCount: 64, featured: true,
  },
  {
    id: 'prod-4',
    slug: 'quetta-traditional-mustard-gold',
    name: 'Quetta Sovereign Gold Chappal',
    subtitle: 'Wide-bridged traditional Quetta design in rich mustard gold',
    price: 4800, category: 'Quetta',
    description: 'Distinctive wide-fitting upper with double stitch spine. Ideal for broader foot silhouettes and formal traditional attire.',
    features: ['Extra-wide bridge comfort design', 'Mustard gold oil-tanned leather', 'Dual spine central hand stitching', 'All-terrain grip sole'],
    materials: 'Oil-tanned cowhide, Solid Copper Buckle, Tire rubber base',
    craftingTime: '11 Hours Artisan Work', isCustomizable: false,
    images: { front: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800', back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800', left: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800', right: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800', top: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800', sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800' },
    status3D: 'ready', availableSizes: [41, 42, 43, 44, 45], availableColors: ['mustard-gold', 'saddle-tan'],
    customization: { availableColors: ['mustard-gold', 'saddle-tan'], availableSoles: ['tire-recycled'], availableBuckles: ['aged-brass'], allowInitials: false },
    averageRating: 4.7, reviewCount: 29, featured: false,
  },
  {
    id: 'prod-5',
    slug: 'royal-heritage-brass-edition',
    name: 'Royale Heritage Antique Brass',
    subtitle: 'Limited edition heirloom piece with solid brass filigree buckle & gold thread stitching',
    price: 7500, originalPrice: 8800, category: 'Royal',
    description: 'Our crown jewel. Handcrafted by master artisans with 30+ years of expertise. Features hand-carved antique brass filigree buckle, gold thread border, and premium calfskin lining.',
    features: ['Hand-filigreed solid brass heirloom buckle', 'Ultra-soft full-grain calfskin leather', 'Gold metallic hand-stitched details', 'Luxury velvet wooden storage box included'],
    materials: 'Grade-A Calfskin, Hand-molded Solid Brass, Premium Rubber Sole',
    craftingTime: '24 Hours Master Artisan Handwork', isCustomizable: true,
    images: { front: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800', back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800', left: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800', right: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800', top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800', sole: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800' },
    status3D: 'ready', availableSizes: [39, 40, 41, 42, 43, 44, 45], availableColors: ['saddle-tan', 'burnt-copper', 'espresso'],
    customization: { availableColors: ['saddle-tan', 'burnt-copper', 'espresso', 'midnight-black'], availableSoles: ['double-leather', 'cushioned-foam'], availableBuckles: ['aged-brass', 'burnt-copper'], allowInitials: true },
    averageRating: 5.0, reviewCount: 19, featured: true,
  },
];

const INITIAL_REVIEWS: Record<string, Review[]> = {
  'prod-1': [
    { id: 'rev-1', productId: 'prod-1', userName: 'Tariq Khan', rating: 5, comment: 'The leather smell, the weight, the flawless stitch quality — absolute perfection. Best Kaptaan chappal I have owned.', date: '2026-07-28', verifiedPurchase: true, status: 'approved' },
    { id: 'rev-2', productId: 'prod-1', userName: 'Zubair Ahmed', rating: 5, comment: 'Extremely comfortable for long walks and weddings. The glass aesthetic on the website made me buy it, but the product itself blew my mind.', date: '2026-07-15', verifiedPurchase: true, status: 'approved' },
  ],
  'prod-2': [{ id: 'rev-4', productId: 'prod-2', userName: 'Bilal Afridi', rating: 5, comment: 'The burnt copper shade is absolutely gorgeous. Paired with my cream shalwar kameez at mehndi and received countless compliments.', date: '2026-07-22', verifiedPurchase: true, status: 'approved' }],
  'prod-3': [{ id: 'rev-5', productId: 'prod-3', userName: 'Shah Nawaz', rating: 5, comment: 'Still like new after 3 months daily use. Deep espresso color with incredible sole durability.', date: '2026-06-18', verifiedPurchase: true, status: 'approved' }],
  'prod-5': [{ id: 'rev-6', productId: 'prod-5', userName: 'Dr. Faisal Rehan', rating: 5, comment: 'This is a true heirloom piece. The filigree brass buckle is hand-engraved and incredibly detailed.', date: '2026-07-05', verifiedPurchase: true, status: 'approved' }],
};

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001', orderNumber: 'PSH-89210', date: 'Aug 1, 2026',
    items: [{ id: 'item-1', product: INITIAL_PRODUCTS[0], size: 42, selectedColor: 'saddle-tan', quantity: 1, isCustomized: false }],
    shippingAddress: { fullName: 'Hamza Afridi', email: 'hamza.afridi@example.com', phone: '+92 300 1234567', address: 'House 42, Street 8, F-7/2', city: 'Islamabad', postalCode: '44000', country: 'Pakistan' },
    shippingMethod: 'artisan-courier', paymentMethod: 'cod', subtotal: 145, shippingFee: 18, discount: 0, total: 163, status: 'Shipped',
    trackingSteps: [
      { status: 'Placed', date: 'Aug 1, 10:00 AM', completed: true, description: 'Order confirmed and allocated to master artisan.' },
      { status: 'Crafting', date: 'Aug 2, 02:30 PM', completed: true, description: 'Upper leather cut and hand-stitched.' },
      { status: 'Quality Check', date: 'Aug 3, 11:15 AM', completed: true, description: 'Inspected for finish, durability & brass hardware shine.' },
      { status: 'Shipped', date: 'Aug 4, 09:00 AM', completed: true, description: 'Dispatched via Artisan Courier Express.' },
      { status: 'Delivered', date: 'Est Aug 7', completed: false, description: 'Out for final delivery.' },
    ],
    isCustomizedOrder: false,
  },
  {
    id: 'ord-1002', orderNumber: 'PSH-44109', date: 'Aug 3, 2026',
    items: [{ id: 'item-2', product: INITIAL_PRODUCTS[1], size: 43, selectedColor: 'burnt-copper', quantity: 2, isCustomized: true, customizationDetails: { productId: 'prod-2', productName: 'Zalmi Royal Burnt Copper', basePrice: 160, leatherColor: 'burnt-copper', soleType: 'tire-recycled', buckleFinish: 'burnt-copper', stitchingColor: 'contrast-brass', initials: 'FK', size: 43, customPrice: 190 } }],
    shippingAddress: { fullName: 'Fawad Khan', email: 'fawad@example.com', phone: '+92 321 9876543', address: 'Apartment 4B, Gulberg Heights', city: 'Lahore', postalCode: '54000', country: 'Pakistan' },
    shippingMethod: 'express', paymentMethod: 'card', subtotal: 380, shippingFee: 12, discount: 20, total: 372, status: 'Crafting',
    trackingSteps: [
      { status: 'Placed', date: 'Aug 3, 02:00 PM', completed: true, description: 'Bespoke order registered.' },
      { status: 'Crafting', date: 'Aug 4, 09:00 AM', completed: true, description: 'Engraving custom initials & sole shaping.' },
      { status: 'Quality Check', date: 'Pending', completed: false, description: 'Pending quality inspection.' },
      { status: 'Shipped', date: 'Pending', completed: false, description: 'Courier handover.' },
      { status: 'Delivered', date: 'Pending', completed: false, description: 'Doorstep delivery.' },
    ],
    isCustomizedOrder: true,
  },
];

const INITIAL_CUSTOMERS: AdminCustomer[] = [
  { id: 'cust-1', name: 'Hamza Afridi', email: 'hamza.afridi@example.com', phone: '+92 300 1234567', joinDate: '2026-01-15', totalOrders: 4, totalSpend: 620, lastOrderDate: '2026-08-01', status: 'active', savedAddresses: ['House 42, Street 8, F-7/2, Islamabad'], wishlistCount: 3 },
  { id: 'cust-2', name: 'Fawad Khan', email: 'fawad@example.com', phone: '+92 321 9876543', joinDate: '2026-03-20', totalOrders: 2, totalSpend: 372, lastOrderDate: '2026-08-03', status: 'active', savedAddresses: ['Apartment 4B, Gulberg Heights, Lahore'], wishlistCount: 5 },
  { id: 'cust-3', name: 'Shahid Tanveer', email: 'shahid.t@example.com', phone: '+92 333 5551234', joinDate: '2026-04-10', totalOrders: 1, totalSpend: 145, lastOrderDate: '2026-07-20', status: 'active', savedAddresses: ['University Town, Peshawar'], wishlistCount: 2 },
  { id: 'cust-4', name: 'Spam Account Bot', email: 'testbot@tempmail.org', phone: '+1 555 0192837', joinDate: '2026-08-02', totalOrders: 0, totalSpend: 0, lastOrderDate: 'Never', status: 'flagged', savedAddresses: [], wishlistCount: 0 }
];

const INITIAL_PROMOS: PromoCode[] = [
  { id: 'promo-1', code: 'HERITAGE20', discountType: 'percentage', value: 20, minOrderValue: 150, usageLimit: 200, timesUsed: 42, startDate: '2026-06-01', expiryDate: '2026-12-31', scope: 'store-wide', active: true, totalDiscountGiven: 1260, revenueGenerated: 6300 },
  { id: 'promo-2', code: 'ROYAL50', discountType: 'fixed', value: 50, minOrderValue: 200, usageLimit: 50, timesUsed: 18, startDate: '2026-07-01', expiryDate: '2026-08-31', scope: 'category', categoryScope: 'Royal', active: true, totalDiscountGiven: 900, revenueGenerated: 3960 },
  { id: 'promo-3', code: 'EIDVIP', discountType: 'percentage', value: 15, minOrderValue: 100, usageLimit: 500, timesUsed: 500, startDate: '2026-03-01', expiryDate: '2026-04-30', scope: 'store-wide', active: false, totalDiscountGiven: 4500, revenueGenerated: 30000 },
];

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  { id: 'notif-1', type: 'order', title: 'New Order Received', description: 'Order #PSH-44109 placed by Fawad Khan ($372)', timestamp: '10 mins ago', read: false, link: '/admin/orders' },
  { id: 'notif-2', type: 'replacement', title: 'Size Exchange Requested', description: 'Hamza Afridi requested replacement for Order #PSH-89210', timestamp: '1 hour ago', read: false, link: '/admin/orders' },
  { id: 'notif-3', type: 'stock', title: 'Low Stock Warning', description: 'Royale Heritage Antique Brass has only 3 units remaining', timestamp: '3 hours ago', read: false, link: '/admin/products' },
  { id: 'notif-4', type: 'review', title: 'Review Awaiting Approval', description: 'New 5-star review submitted for Kaptaan Signature', timestamp: '1 day ago', read: true, link: '/admin/reviews' }
];

const getStoredProducts = (): Product[] => {
  try { const local = localStorage.getItem('psh_products'); return local ? JSON.parse(local) : INITIAL_PRODUCTS; } catch { return INITIAL_PRODUCTS; }
};
const saveStoredProducts = (products: Product[]) => { try { localStorage.setItem('psh_products', JSON.stringify(products)); } catch {} };

const getStoredOrders = (): Order[] => {
  try { const local = localStorage.getItem('psh_orders'); return local ? JSON.parse(local) : INITIAL_ORDERS; } catch { return INITIAL_ORDERS; }
};
const saveStoredOrders = (orders: Order[]) => { try { localStorage.setItem('psh_orders', JSON.stringify(orders)); } catch {} };

export const apiService = {
  async getProducts(): Promise<Product[]> {
    try { const res = await fetch('http://localhost:5000/api/products'); if (res.ok) return await res.json(); } catch {}
    return getStoredProducts();
  },
  async getProductBySlug(slug: string): Promise<Product | null> {
    try { const res = await fetch(`http://localhost:5000/api/products/${slug}`); if (res.ok) return await res.json(); } catch {}
    const products = getStoredProducts();
    return products.find(p => p.slug === slug || p.id === slug) || null;
  },
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const products = getStoredProducts();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug: (productData.name || 'chappal').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: productData.name || 'New Peshawari Chappal',
      subtitle: productData.subtitle || 'Handcrafted leather footwear',
      price: productData.price || 150,
      category: productData.category || 'Kaptaan',
      description: productData.description || '',
      features: productData.features || ['100% Leather', 'Tire Sole'],
      materials: productData.materials || 'Full grain leather',
      craftingTime: productData.craftingTime || '12 Hours',
      isCustomizable: productData.isCustomizable ?? true,
      images: productData.images || { front: 'https://images.unsplash.com/photo-1549298916-b41d501d3772', back: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a', left: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86', right: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77', top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5', sole: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2' },
      status3D: 'ready',
      availableSizes: productData.availableSizes || [39, 40, 41, 42, 43, 44, 45],
      availableColors: productData.availableColors || ['saddle-tan', 'espresso'],
      customization: productData.customization || { availableColors: ['saddle-tan', 'espresso', 'burnt-copper'], availableSoles: ['tire-recycled', 'double-leather'], availableBuckles: ['aged-brass'], allowInitials: true },
      averageRating: 5.0, reviewCount: 0,
    };
    products.unshift(newProduct); saveStoredProducts(products); return newProduct;
  },
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const products = getStoredProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...updates };
      saveStoredProducts(products);
      return products[idx];
    }
    throw new Error('Product not found');
  },
  async deleteProduct(id: string): Promise<boolean> {
    const products = getStoredProducts();
    const filtered = products.filter(p => p.id !== id);
    saveStoredProducts(filtered);
    return true;
  },
  async bulkUpdateProducts(ids: string[], action: 'delete' | 'deactivate' | 'activate' | 'change-category', payload?: any): Promise<boolean> {
    let products = getStoredProducts();
    if (action === 'delete') {
      products = products.filter(p => !ids.includes(p.id));
    } else if (action === 'change-category' && payload?.category) {
      products = products.map(p => ids.includes(p.id) ? { ...p, category: payload.category } : p);
    } else if (action === 'deactivate') {
      products = products.map(p => ids.includes(p.id) ? { ...p, featured: false } : p);
    } else if (action === 'activate') {
      products = products.map(p => ids.includes(p.id) ? { ...p, featured: true } : p);
    }
    saveStoredProducts(products);
    return true;
  },
  async retry3DPipeline(productId: string): Promise<Product> {
    const products = getStoredProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      products[idx].status3D = 'processing';
      saveStoredProducts(products);
      setTimeout(() => {
        const latest = getStoredProducts();
        const pIdx = latest.findIndex(p => p.id === productId);
        if (pIdx !== -1) {
          latest[pIdx].status3D = 'ready';
          saveStoredProducts(latest);
        }
      }, 3000);
      return products[idx];
    }
    throw new Error('Product not found');
  },

  // --- REVIEWS & MODERATION ---
  async getReviews(productId: string): Promise<Review[]> {
    try { const res = await fetch(`http://localhost:5000/api/reviews/${productId}`); if (res.ok) return await res.json(); } catch {}
    const stored = localStorage.getItem(`psh_reviews_${productId}`);
    if (stored) return JSON.parse(stored);
    return INITIAL_REVIEWS[productId] || [];
  },
  async getAllReviews(): Promise<(Review & { productName?: string })[]> {
    const products = getStoredProducts();
    const all: (Review & { productName?: string })[] = [];
    for (const p of products) {
      const revs = await this.getReviews(p.id);
      revs.forEach(r => all.push({ ...r, productName: p.name }));
    }
    return all;
  },
  async addReview(productId: string, review: Omit<Review, 'id' | 'date' | 'status'>): Promise<Review> {
    const existing = await this.getReviews(productId);
    const newRev: Review = { ...review, id: `rev-${Date.now()}`, date: new Date().toISOString().split('T')[0], status: 'approved' };
    localStorage.setItem(`psh_reviews_${productId}`, JSON.stringify([newRev, ...existing]));
    return newRev;
  },
  async updateReviewStatus(productId: string, reviewId: string, status: 'approved' | 'hidden' | 'pending'): Promise<boolean> {
    const revs = await this.getReviews(productId);
    const updated = revs.map(r => r.id === reviewId ? { ...r, status } : r);
    localStorage.setItem(`psh_reviews_${productId}`, JSON.stringify(updated));
    return true;
  },
  async deleteReview(productId: string, reviewId: string): Promise<boolean> {
    const revs = await this.getReviews(productId);
    const filtered = revs.filter(r => r.id !== reviewId);
    localStorage.setItem(`psh_reviews_${productId}`, JSON.stringify(filtered));
    return true;
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    try { const res = await fetch('http://localhost:5000/api/orders'); if (res.ok) return await res.json(); } catch {}
    return getStoredOrders();
  },
  async getOrderById(id: string): Promise<Order | null> {
    try { const res = await fetch(`http://localhost:5000/api/orders/${id}`); if (res.ok) return await res.json(); } catch {}
    const orders = getStoredOrders();
    return orders.find(o => o.id === id || o.orderNumber === id) || null;
  },
  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'date' | 'status' | 'trackingSteps'>): Promise<Order> {
    const orders = getStoredOrders();
    const newOrder: Order = {
      ...orderData, id: `ord-${Date.now()}`, orderNumber: `PSH-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Crafting',
      trackingSteps: [
        { status: 'Placed', date: 'Just now', completed: true, description: 'Order confirmed and verified.' },
        { status: 'Crafting', date: 'In progress', completed: true, description: 'Master artisan working on your pair.' },
        { status: 'Quality Check', date: 'Pending', completed: false, description: 'Inspection and polish.' },
        { status: 'Shipped', date: 'Pending', completed: false, description: 'Handover to courier.' },
        { status: 'Delivered', date: 'Estimated 3-5 days', completed: false, description: 'Delivery to address.' },
      ],
    };
    orders.unshift(newOrder); saveStoredOrders(orders); return newOrder;
  },
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    const orders = getStoredOrders();
    const idx = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].trackingSteps = orders[idx].trackingSteps.map(step => {
        if (step.status === status) return { ...step, completed: true, date: 'Updated just now' };
        return step;
      });
      saveStoredOrders(orders);
      return orders[idx];
    }
    throw new Error('Order not found');
  },
  async requestReplacement(orderId: string, reason: string): Promise<Order> {
    const orders = getStoredOrders();
    const idx = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (idx !== -1) { orders[idx].replacementRequested = true; orders[idx].replacementStatus = 'pending'; orders[idx].replacementReason = reason; saveStoredOrders(orders); return orders[idx]; }
    throw new Error('Order not found');
  },
  async moderateReplacement(orderId: string, approved: boolean): Promise<Order> {
    const orders = getStoredOrders();
    const idx = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (idx !== -1) {
      orders[idx].replacementStatus = approved ? 'approved' : 'rejected';
      saveStoredOrders(orders);
      return orders[idx];
    }
    throw new Error('Order not found');
  },

  // --- CUSTOMERS ---
  async getAdminCustomers(): Promise<AdminCustomer[]> {
    const stored = localStorage.getItem('psh_customers');
    return stored ? JSON.parse(stored) : INITIAL_CUSTOMERS;
  },
  async toggleCustomerStatus(customerId: string, status: 'active' | 'flagged' | 'blocked'): Promise<boolean> {
    const customers = await this.getAdminCustomers();
    const updated = customers.map(c => c.id === customerId ? { ...c, status } : c);
    localStorage.setItem('psh_customers', JSON.stringify(updated));
    return true;
  },

  // --- PROMO CODES ---
  async getPromoCodes(): Promise<PromoCode[]> {
    const stored = localStorage.getItem('psh_promos');
    return stored ? JSON.parse(stored) : INITIAL_PROMOS;
  },
  async createPromoCode(promo: Omit<PromoCode, 'id' | 'timesUsed' | 'totalDiscountGiven' | 'revenueGenerated'>): Promise<PromoCode> {
    const promos = await this.getPromoCodes();
    const newP: PromoCode = {
      ...promo,
      id: `promo-${Date.now()}`,
      timesUsed: 0,
      totalDiscountGiven: 0,
      revenueGenerated: 0
    };
    promos.unshift(newP);
    localStorage.setItem('psh_promos', JSON.stringify(promos));
    return newP;
  },
  async togglePromoStatus(id: string): Promise<boolean> {
    const promos = await this.getPromoCodes();
    const updated = promos.map(p => p.id === id ? { ...p, active: !p.active } : p);
    localStorage.setItem('psh_promos', JSON.stringify(updated));
    return true;
  },
  async deletePromoCode(id: string): Promise<boolean> {
    const promos = await this.getPromoCodes();
    const filtered = promos.filter(p => p.id !== id);
    localStorage.setItem('psh_promos', JSON.stringify(filtered));
    return true;
  },

  // --- MESSAGES ---
  async sendMessage(msg: Omit<CustomerMessage, 'id' | 'date' | 'read'>): Promise<CustomerMessage> {
    const stored = localStorage.getItem('psh_messages');
    const messages: CustomerMessage[] = stored ? JSON.parse(stored) : [];
    const newMsg: CustomerMessage = { ...msg, id: `msg-${Date.now()}`, date: new Date().toISOString().split('T')[0], read: false };
    messages.unshift(newMsg); localStorage.setItem('psh_messages', JSON.stringify(messages)); return newMsg;
  },
  async getMessages(): Promise<CustomerMessage[]> {
    const stored = localStorage.getItem('psh_messages');
    return stored ? JSON.parse(stored) : [{ id: 'msg-1', name: 'Shahid Khan', email: 'shahid@example.com', subject: 'Wholesale Inquiry for Wedding Party', message: 'Hello, we would like to order 15 customized Kaptaan pairs for an upcoming family wedding.', date: '2026-08-04', read: false }];
  },
  async toggleMessageRead(id: string): Promise<boolean> {
    const messages = await this.getMessages();
    const updated = messages.map(m => m.id === id ? { ...m, read: !m.read } : m);
    localStorage.setItem('psh_messages', JSON.stringify(updated));
    return true;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<AdminNotification[]> {
    const stored = localStorage.getItem('psh_notifications');
    return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
  },
  async markNotificationRead(id: string): Promise<boolean> {
    const notifs = await this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('psh_notifications', JSON.stringify(updated));
    return true;
  },

  // --- STORE SETTINGS ---
  async getStoreSettings(): Promise<StoreSettings> {
    const stored = localStorage.getItem('psh_store_settings');
    if (stored) return JSON.parse(stored);
    return {
      storeName: 'Peshawari Chappal Co.',
      logoUrl: '/logo.png',
      supportEmail: 'concierge@peshawarichappal.com',
      supportPhone: '+92 91 111 222 333',
      currency: 'PKR (Rs.)',
      freeShippingThreshold: 4500,
      standardShippingFee: 250,
      expressShippingFee: 450,
      codEnabled: true,
      cardEnabled: true,
      walletEnabled: true,
      lowStockThreshold: 5,
      sizeChartMap: [
        { eu: 39, uk: 5, mm: 245, widthNote: 'Narrow bridge fit' },
        { eu: 40, uk: 6, mm: 252, widthNote: 'Regular slim fit' },
        { eu: 41, uk: 7, mm: 260, widthNote: 'Standard fit' },
        { eu: 42, uk: 8, mm: 268, widthNote: 'Standard regular bridge' },
        { eu: 43, uk: 9, mm: 275, widthNote: 'Wide bridge' },
        { eu: 44, uk: 10, mm: 283, widthNote: 'Extra wide fit' },
        { eu: 45, uk: 11, mm: 290, widthNote: 'Maximum comfort width' }
      ]
    };
  },
  async updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
    localStorage.setItem('psh_store_settings', JSON.stringify(settings));
    return settings;
  }
};
