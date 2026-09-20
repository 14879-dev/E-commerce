export type AdminRole = 'superadmin' | 'staff';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  usageLimit: number;
  timesUsed: number;
  startDate: string;
  expiryDate: string;
  scope: 'store-wide' | 'category' | 'specific';
  categoryScope?: string;
  active: boolean;
  totalDiscountGiven: number;
  revenueGenerated: number;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  status: 'active' | 'flagged' | 'blocked';
  savedAddresses: string[];
  wishlistCount: number;
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'stock' | 'review' | 'replacement' | 'message';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface SizeMapping {
  size?: number;
  eu: number;
  uk: number;
  mm: number;
  widthNote: string;
}

export interface SocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  faviconUrl?: string;
  socialLinks?: SocialLinks;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  freeShippingMode: 'all' | 'threshold' | 'product-specific' | 'none';
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  codEnabled: boolean;
  easypaisaEnabled: boolean;
  cardEnabled?: boolean;
  walletEnabled: boolean;
  lowStockThreshold: number;
  sizeChartMap: SizeMapping[];
  hideCategories?: boolean;
  heroMediaUrl?: string | null;
  heroMediaType?: 'image' | 'video' | null;
  supplierProductBudget?: number;
  supplierBudgetLogs?: SupplierBudgetLog[];
}

export interface SupplierBudgetLog {
  id: string;
  type: 'add' | 'remove' | 'set' | 'sync-inventory';
  action?: 'add' | 'remove' | 'set' | 'sync-inventory';
  amount: number;
  previousBudget?: number;
  newBudget?: number;
  budgetAfter?: number;
  note?: string;
  date: string;
  createdAt?: string;
}

export type InvestmentCategory = 'packaging' | 'monetization' | 'marketing' | 'logistics' | 'equipment' | 'other';

export interface InvestmentItem {
  id: string;
  title: string;
  category: InvestmentCategory;
  amount: number;
  date: string;
  supplierOrVendor?: string;
  notes?: string;
  createdAt?: string;
}
