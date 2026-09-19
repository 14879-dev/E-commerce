import type { Product, Order, Review, CustomerMessage, Category } from '../types';
import type { PromoCode, AdminCustomer, AdminNotification, StoreSettings } from '../types/admin';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Kaptaan', slug: 'kaptaan', description: 'Iconic double-sole design with brass hardware and high durability tire soles.', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600', disabled: false },
  { id: 'cat-2', name: 'Zalmi', slug: 'zalmi', description: 'Contemporary sleek cut with hand-burnished edge detail and modern comfort.', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=600', disabled: false },
  { id: 'cat-3', name: 'Norzi', slug: 'norzi', description: 'Authentic vintage silhouette of Old Peshawar with traditional high-curve toe design.', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=600', disabled: false },
  { id: 'cat-4', name: 'Quetta', slug: 'quetta', description: 'Distinctive wide-fitting bridge with double spine stitch for formal attire.', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600', disabled: false },
  { id: 'cat-5', name: 'Royal', slug: 'royal', description: 'Limited edition heirloom collection with solid brass filigree and gold thread stitching.', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600', disabled: false },
];

const getStoredCategories = (): Category[] => {
  try { const local = localStorage.getItem('psh_categories'); return local ? JSON.parse(local) : INITIAL_CATEGORIES; } catch { return INITIAL_CATEGORIES; }
};
const saveStoredCategories = (cats: Category[]) => { try { localStorage.setItem('psh_categories', JSON.stringify(cats)); } catch {} };

const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_REVIEWS: Record<string, Review[]> = {};
const INITIAL_ORDERS: Order[] = [];
const INITIAL_CUSTOMERS: AdminCustomer[] = [];
const INITIAL_PROMOS: PromoCode[] = [];
const INITIAL_NOTIFICATIONS: AdminNotification[] = [];

// Automatic purge of obsolete cached demo data from previous sessions
const DATA_CLEAN_VERSION = 'v5_clean_zero_start';
try {
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('psh_data_version') !== DATA_CLEAN_VERSION) {
      localStorage.removeItem('psh_products');
      localStorage.removeItem('psh_orders');
      localStorage.removeItem('psh_customers');
      localStorage.removeItem('psh_promos');
      localStorage.removeItem('psh_notifications');
      localStorage.removeItem('psh_messages');
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('psh_reviews_')) {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem('psh_data_version', DATA_CLEAN_VERSION);
    }
  }
} catch {}

const getStoredProducts = (): Product[] => {
  try { const local = localStorage.getItem('psh_products'); return local ? JSON.parse(local) : INITIAL_PRODUCTS; } catch { return INITIAL_PRODUCTS; }
};
const saveStoredProducts = (products: Product[]) => { try { localStorage.setItem('psh_products', JSON.stringify(products)); } catch {} };

const getStoredOrders = (): Order[] => {
  try { const local = localStorage.getItem('psh_orders'); return local ? JSON.parse(local) : INITIAL_ORDERS; } catch { return INITIAL_ORDERS; }
};
const saveStoredOrders = (orders: Order[]) => { try { localStorage.setItem('psh_orders', JSON.stringify(orders)); } catch {} };
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
};
const API_BASE = getApiBase();

export const apiService = {
  async getProducts(all: boolean = false): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/api/products${all ? '?all=true' : ''}`);
      if (res.ok) return await res.json();
    } catch {}
    const stored = getStoredProducts();
    if (all) return stored;
    const disabledNames = new Set(
      getStoredCategories().filter(c => c.disabled).map(c => (c.name || '').toLowerCase())
    );
    return stored.filter(p => !disabledNames.has((p.category || '').toLowerCase()));
  },
  async getProductBySlug(slug: string): Promise<Product | null> {
    try { const res = await fetch(`${API_BASE}/api/products/${slug}`); if (res.ok) return await res.json(); } catch {}
    const products = getStoredProducts();
    return products.find(p => p.slug === slug || p.id === slug) || null;
  },
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const token = this.getAdminToken();
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(productData),
      });
      if (res.ok) {
        const created = await res.json();
        const products = getStoredProducts();
        products.unshift(created);
        saveStoredProducts(products);
        this.addNotification({
          type: 'stock',
          title: 'New Product Listed',
          description: `"${created.name}" was added to the catalog.`,
          link: '/admin/products',
        }).catch(() => {});
        return created;
      }
    } catch {}

    const products = getStoredProducts();
    const rawTag = (productData.articleTag || '').trim();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      articleTag: rawTag,
      slug: (productData.name || rawTag || 'chappal').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: productData.name || rawTag || 'New Peshawari Chappal',
      subtitle: productData.subtitle || 'Handcrafted leather footwear',
      price: productData.price || 150,
      costPrice: productData.costPrice || 0,
      stockCount: productData.stockCount ?? 50,
      category: productData.category || 'None',
      description: productData.description || '',
      features: productData.features || ['100% Leather', 'Tire Sole'],
      materials: productData.materials || 'Full grain leather',
      craftingTime: productData.craftingTime || '12 Hours',
      images: productData.images || { front: 'https://images.unsplash.com/photo-1549298916-b41d501d3772' },
      availableSizes: productData.availableSizes || [39, 40, 41, 42, 43, 44, 45],
      availableColors: productData.availableColors || ['saddle-tan', 'espresso'],
      averageRating: 5.0, reviewCount: 0,
    };
    products.unshift(newProduct);
    saveStoredProducts(products);
    this.addNotification({
      type: 'stock',
      title: 'New Product Listed',
      description: `"${newProduct.name}" was added to the catalog.`,
      link: '/admin/products',
    }).catch(() => {});
    return newProduct;
  },
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const token = this.getAdminToken();
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        const products = getStoredProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) { products[idx] = { ...products[idx], ...updated }; saveStoredProducts(products); }
        return updated;
      }
    } catch {}

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
    const token = this.getAdminToken();
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const products = getStoredProducts();
        const target = products.find(p => p.id === id);
        saveStoredProducts(products.filter(p => p.id !== id));
        this.addNotification({
          type: 'stock',
          title: 'Product Removed',
          description: `Product "${target?.name || id}" was deleted from catalog.`,
          link: '/admin/products',
        }).catch(() => {});
        return true;
      }
    } catch {}

    const products = getStoredProducts();
    const target = products.find(p => p.id === id);
    const filtered = products.filter(p => p.id !== id);
    saveStoredProducts(filtered);
    this.addNotification({
      type: 'stock',
      title: 'Product Removed',
      description: `Product "${target?.name || id}" was deleted from catalog.`,
      link: '/admin/products',
    }).catch(() => {});
    return true;
  },
  async bulkUpdateProducts(ids: string[], action: 'delete' | 'deactivate' | 'activate' | 'change-category', payload?: any): Promise<boolean> {
    let products = getStoredProducts();
    if (action === 'delete') {
      products = products.filter(p => !ids.includes(p.id));
      for (const id of ids) {
        this.deleteProduct(id).catch(() => {});
      }
    } else if (action === 'change-category' && payload?.category) {
      products = products.map(p => ids.includes(p.id) ? { ...p, category: payload.category } : p);
      for (const id of ids) {
        this.updateProduct(id, { category: payload.category }).catch(() => {});
      }
    } else if (action === 'deactivate') {
      products = products.map(p => ids.includes(p.id) ? { ...p, featured: false } : p);
      for (const id of ids) {
        this.updateProduct(id, { featured: false } as any).catch(() => {});
      }
    } else if (action === 'activate') {
      products = products.map(p => ids.includes(p.id) ? { ...p, featured: true } : p);
      for (const id of ids) {
        this.updateProduct(id, { featured: true } as any).catch(() => {});
      }
    }
    saveStoredProducts(products);
    return true;
  },
  getAdminToken(): string {
    return sessionStorage.getItem('psh_admin_token') || '';
  },
  // --- CATEGORIES MANAGEMENT ---
  async getCategories(all: boolean = false): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/api/categories${all ? '?all=true' : ''}`);
      if (res.ok) {
        const cats: Category[] = await res.json();
        if (all) {
          saveStoredCategories(cats);
        } else {
          // Merge active cats with existing disabled ones so disabled aren't wiped from cache
          const stored = getStoredCategories();
          const disabledCats = stored.filter(c => c.disabled);
          const combined = [...cats];
          for (const d of disabledCats) {
            if (!combined.some(c => c.id === d.id)) combined.push(d);
          }
          saveStoredCategories(combined);
        }
        return cats;
      }
    } catch {}
    const stored = getStoredCategories();
    return all ? stored : stored.filter(c => !c.disabled);
  },

  async createCategory(catData: Partial<Category>): Promise<Category> {
    const token = this.getAdminToken();
    let created: Category | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(catData),
      });
      if (res.ok) {
        created = await res.json();
      }
    } catch {}

    if (!created) {
      created = {
        id: `cat-${Date.now()}`,
        name: catData.name || 'New Category',
        slug: (catData.slug || catData.name || 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: catData.description || '',
        image: catData.image || '',
        disabled: !!catData.disabled,
      };
    }

    const cats = getStoredCategories();
    const existingIdx = cats.findIndex(c => c.id === created!.id);
    if (existingIdx !== -1) {
      cats[existingIdx] = created;
    } else {
      cats.push(created);
    }
    saveStoredCategories(cats);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psh:categories-changed'));
    }
    return created;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const token = this.getAdminToken();
    const cats = getStoredCategories();
    const existingCat = cats.find(c => c.id === id || c.slug === id);
    const oldName = existingCat?.name;

    let updated: Category | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        updated = await res.json();
      }
    } catch {}

    if (!updated) {
      const idx = cats.findIndex(c => c.id === id || c.slug === id);
      if (idx !== -1) {
        cats[idx] = { ...cats[idx], ...updates };
        updated = cats[idx];
      }
    }

    if (updated) {
      const idx = cats.findIndex(c => c.id === id || c.slug === id);
      if (idx !== -1) {
        cats[idx] = { ...cats[idx], ...updated };
      }
      saveStoredCategories(cats);

      // If category name changed, update product category in localStorage
      if (updates.name && oldName && oldName !== updates.name) {
        const prods = getStoredProducts();
        let changed = false;
        for (const p of prods) {
          if ((p.category || '').toLowerCase() === oldName.toLowerCase()) {
            p.category = updates.name;
            changed = true;
          }
        }
        if (changed) {
          saveStoredProducts(prods);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('psh:products-changed'));
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('psh:categories-changed'));
      }
      return updated;
    }

    throw new Error('Category not found');
  },

  async toggleCategoryStatus(id: string): Promise<Category> {
    const token = this.getAdminToken();
    let updated: Category | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}/toggle`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        updated = await res.json();
      }
    } catch {}

    const cats = getStoredCategories();
    const idx = cats.findIndex(c => c.id === id || c.slug === id);
    if (!updated && idx !== -1) {
      cats[idx].disabled = !cats[idx].disabled;
      updated = cats[idx];
    } else if (updated && idx !== -1) {
      cats[idx] = { ...cats[idx], ...updated };
    }

    if (updated) {
      saveStoredCategories(cats);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('psh:categories-changed'));
        window.dispatchEvent(new CustomEvent('psh:products-changed'));
      }
      return updated;
    }

    throw new Error('Category not found');
  },

  async deleteCategory(id: string): Promise<boolean> {
    const token = this.getAdminToken();
    const cats = getStoredCategories();
    const catToDelete = cats.find(c => c.id === id || c.slug === id);
    const catName = catToDelete?.name;

    try {
      await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}

    const remaining = cats.filter(c => c.id !== id && c.slug !== id);
    saveStoredCategories(remaining);

    // Update products with deleted category
    if (catName) {
      const prods = getStoredProducts();
      let changed = false;
      for (const p of prods) {
        if ((p.category || '').toLowerCase() === catName.toLowerCase()) {
          p.category = 'Uncategorized';
          changed = true;
        }
      }
      if (changed) {
        saveStoredProducts(prods);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('psh:products-changed'));
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psh:categories-changed'));
    }
    return true;
  },

  // --- REMOVE.BG IMAGE BACKGROUND REMOVAL ---
  getRemoveBgApiKey(): string {
    return localStorage.getItem('psh_removebg_key') || '';
  },

  setRemoveBgApiKey(key: string): void {
    localStorage.setItem('psh_removebg_key', key.trim());
  },

  async removeBackground(image: string, customApiKey?: string): Promise<{ success: boolean; image: string; provider?: string; error?: string }> {
    const apiKey = (customApiKey || this.getRemoveBgApiKey()).trim();

    // 1. Try backend remove-bg endpoint (supports remove.bg API key and local fallback)
    try {
      const res = await fetch(`${API_BASE}/api/images/remove-bg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, apiKey }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.image) {
        return { success: true, image: data.image, provider: data.provider || 'remove.bg' };
      }
      if (!res.ok && data.error) {
        // If Remove.bg returned an explicit error, propagate it
        return { success: false, image, error: data.error, provider: 'remove.bg' };
      }
    } catch {}

    // 2. Client-side fallback if server is unreachable or offline
    try {
      const { removeImageBackground } = await import('../utils/backgroundRemoval');
      const processed = await removeImageBackground(image);
      return { success: true, image: processed, provider: 'client-edge-feather' };
    } catch (err: any) {
      return { success: false, image, error: err.message || 'Background removal failed' };
    }
  },

  // --- REVIEWS & MODERATION ---
  async getReviews(productId: string): Promise<Review[]> {
    try { const res = await fetch(`${API_BASE}/api/reviews/${productId}`); if (res.ok) return await res.json(); } catch {}
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
    this.addNotification({
      type: 'review',
      title: 'New Product Review',
      description: `${newRev.userName} submitted a ${newRev.rating}★ rating.`,
      link: '/admin/reviews',
    }).catch(() => {});
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
    try { const res = await fetch(`${API_BASE}/api/orders`); if (res.ok) return await res.json(); } catch {}
    return getStoredOrders();
  },
  async getOrderById(id: string): Promise<Order | null> {
    try { const res = await fetch(`${API_BASE}/api/orders/${id}`); if (res.ok) return await res.json(); } catch {}
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
    orders.unshift(newOrder);
    saveStoredOrders(orders);
    this.addNotification({
      type: 'order',
      title: 'New Order Received',
      description: `Order #${newOrder.orderNumber} placed for Rs. ${newOrder.total.toLocaleString()} by ${newOrder.shippingAddress.fullName}.`,
      link: '/admin/orders',
    }).catch(() => {});
    return newOrder;
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
    if (idx !== -1) {
      orders[idx].replacementRequested = true;
      orders[idx].replacementStatus = 'pending';
      orders[idx].replacementReason = reason;
      saveStoredOrders(orders);
      this.addNotification({
        type: 'replacement',
        title: 'Size Exchange Requested',
        description: `Replacement requested for order #${orders[idx].orderNumber || orderId}.`,
        link: '/admin/orders',
      }).catch(() => {});
      return orders[idx];
    }
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
    try {
      const res = await fetch(`${API_BASE}/api/customers`);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          localStorage.setItem('psh_customers', JSON.stringify(list));
          return list;
        }
      }
    } catch {
      // offline/fallback to localStorage
    }
    const stored = localStorage.getItem('psh_customers');
    return stored ? JSON.parse(stored) : INITIAL_CUSTOMERS;
  },

  async registerCustomer(customerData: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    status?: 'active' | 'flagged' | 'blocked';
  }): Promise<AdminCustomer> {
    const customers = await this.getAdminCustomers();
    if (customers.some(c => c.email.toLowerCase() === customerData.email.toLowerCase())) {
      throw new Error('Customer with this email address already exists.');
    }
    const fullAddress = [
      customerData.address,
      customerData.city,
      customerData.postalCode,
      customerData.country
    ].filter(Boolean).join(', ');

    const newCustomer: AdminCustomer = {
      id: `cust-${Date.now()}`,
      name: customerData.name.trim(),
      email: customerData.email.trim(),
      phone: customerData.phone.trim(),
      joinDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      totalSpend: 0,
      lastOrderDate: 'Never',
      status: customerData.status || 'active',
      savedAddresses: fullAddress ? [fullAddress] : [],
      wishlistCount: 0,
    };

    try {
      const token = this.getAdminToken();
      await fetch(`${API_BASE}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newCustomer),
      });
    } catch {
      // local fallback
    }

    customers.unshift(newCustomer);
    localStorage.setItem('psh_customers', JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent('psh:customers-changed'));
    return newCustomer;
  },

  async toggleCustomerStatus(customerId: string, status: 'active' | 'flagged' | 'blocked'): Promise<boolean> {
    try {
      const token = this.getAdminToken();
      await fetch(`${API_BASE}/api/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
    } catch {
      // local fallback
    }
    const customers = await this.getAdminCustomers();
    const updated = customers.map(c => c.id === customerId ? { ...c, status } : c);
    localStorage.setItem('psh_customers', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('psh:customers-changed'));
    return true;
  },

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      const token = this.getAdminToken();
      await fetch(`${API_BASE}/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // local fallback
    }
    const customers = await this.getAdminCustomers();
    const updated = customers.filter(c => c.id !== customerId);
    localStorage.setItem('psh_customers', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('psh:customers-changed'));
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
    messages.unshift(newMsg);
    localStorage.setItem('psh_messages', JSON.stringify(messages));
    this.addNotification({
      type: 'message',
      title: 'Customer Inquiry Received',
      description: `${newMsg.name}: "${newMsg.subject}"`,
      link: '/admin/messages',
    }).catch(() => {});
    return newMsg;
  },
  async getMessages(): Promise<CustomerMessage[]> {
    const stored = localStorage.getItem('psh_messages');
    return stored ? JSON.parse(stored) : [];
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
  async addNotification(notif: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>): Promise<AdminNotification> {
    const notifs = await this.getNotifications();
    const newN: AdminNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: 'Just now',
      read: false,
    };
    notifs.unshift(newN);
    localStorage.setItem('psh_notifications', JSON.stringify(notifs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psh:notifications-changed'));
    }
    return newN;
  },
  async markNotificationRead(id: string): Promise<boolean> {
    const notifs = await this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('psh_notifications', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psh:notifications-changed'));
    }
    return true;
  },
  async clearAllNotifications(): Promise<boolean> {
    localStorage.setItem('psh_notifications', JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psh:notifications-changed'));
    }
    return true;
  },

  // --- STORE SETTINGS ---
  async getStoreSettings(): Promise<StoreSettings> {
    try {
      const res = await fetch('/api/store-settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          localStorage.setItem('psh_store_settings', JSON.stringify(data));
          return data;
        }
      }
    } catch {}
    const stored = localStorage.getItem('psh_store_settings');
    if (stored) return JSON.parse(stored);
    return {
      storeName: 'Peshawari Chappal Co.',
      logoUrl: '',
      faviconUrl: '/favicon.ico',
      supportEmail: 'concierge@peshawarichappal.com',
      supportPhone: '+92 91 111 222 333',
      currency: 'PKR (Rs.)',
      freeShippingMode: 'threshold',
      freeShippingThreshold: 4500,
      standardShippingFee: 250,
      expressShippingFee: 450,
      codEnabled: true,
      easypaisaEnabled: true,
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
    try {
      const token = this.getAdminToken();
      if (token) {
        await fetch('/api/admin/store-settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        });
      }
    } catch {}
    return settings;
  },

  // --- MANAGERS MANAGEMENT (SUPER ADMIN ONLY) ---
  async getManagers(): Promise<any[]> {
    const token = this.getAdminToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/managers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return [];
  },

  async createManager(data: { username: string; password: string; name?: string }): Promise<{ success: boolean; manager?: any; error?: string }> {
    const token = this.getAdminToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/managers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to create manager' };
      }
      return { success: true, manager: resData };
    } catch {
      return { success: false, error: 'Network error creating manager' };
    }
  },

  async deleteManager(id: string): Promise<{ success: boolean; error?: string }> {
    const token = this.getAdminToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/managers/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Failed to delete manager' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error deleting manager' };
    }
  },

  // --- STOREFRONT & ENGAGEMENT INTELLIGENCE ---
  recordProductVisit(productId: string): void {
    try {
      const key = 'psh_product_visits';
      const stored = localStorage.getItem(key);
      const visits: Record<string, number> = stored ? JSON.parse(stored) : {};
      visits[productId] = (visits[productId] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(visits));
    } catch {}
  },

  getAllProductVisits(): Record<string, number> {
    try {
      const stored = localStorage.getItem('psh_product_visits');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  recordSearchQuery(query: string): void {
    if (!query || query.trim().length < 2) return;
    try {
      const key = 'psh_search_logs';
      const stored = localStorage.getItem(key);
      const logs: Record<string, number> = stored ? JSON.parse(stored) : {};
      const trimmed = query.trim().toLowerCase();
      logs[trimmed] = (logs[trimmed] || 0) + 1;
      localStorage.setItem(key, JSON.stringify(logs));
    } catch {}
  },

  getSearchQueries(): { term: string; searches: number }[] {
    try {
      const stored = localStorage.getItem('psh_search_logs');
      if (!stored) return [];
      const logs: Record<string, number> = JSON.parse(stored);
      return Object.entries(logs)
        .map(([term, searches]) => ({ term, searches }))
        .sort((a, b) => b.searches - a.searches)
        .slice(0, 8);
    } catch {
      return [];
    }
  },

  recordAiEvent(event: 'size_scan' | 'outfit_match' | 'express_courier'): void {
    try {
      const key = 'psh_ai_event_stats';
      const stored = localStorage.getItem(key);
      const stats = stored ? JSON.parse(stored) : { sizeScans: 0, sizeSuccess: 0, outfitScans: 0, outfitAdds: 0, expressCouriers: 0 };
      if (event === 'size_scan') {
        stats.sizeScans = (stats.sizeScans || 0) + 1;
        stats.sizeSuccess = (stats.sizeSuccess || 0) + 1;
      } else if (event === 'outfit_match') {
        stats.outfitScans = (stats.outfitScans || 0) + 1;
        stats.outfitAdds = (stats.outfitAdds || 0) + 1;
      } else if (event === 'express_courier') {
        stats.expressCouriers = (stats.expressCouriers || 0) + 1;
      }
      localStorage.setItem(key, JSON.stringify(stats));
    } catch {}
  },

  getAiEventMetrics(): { sizeScans: number; sizeSuccess: number; outfitScans: number; outfitAdds: number; expressCouriers: number } {
    try {
      const stored = localStorage.getItem('psh_ai_event_stats');
      return stored ? JSON.parse(stored) : { sizeScans: 0, sizeSuccess: 0, outfitScans: 0, outfitAdds: 0, expressCouriers: 0 };
    } catch {
      return { sizeScans: 0, sizeSuccess: 0, outfitScans: 0, outfitAdds: 0, expressCouriers: 0 };
    }
  },

  // --- WEBSITE TRAFFIC TRACKING ---
  recordSiteVisit(): void {
    try {
      const sessionKey = 'psh_session_recorded';
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        const countKey = 'psh_site_visitors_count';
        const current = parseInt(localStorage.getItem(countKey) || '0', 10);
        localStorage.setItem(countKey, String(current + 1));
      }
    } catch {}
  },

  getWebsiteVisitors(): number {
    try {
      return parseInt(localStorage.getItem('psh_site_visitors_count') || '0', 10);
    } catch {
      return 0;
    }
  },
};
