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
  eu: number;
  uk: number;
  mm: number;
  widthNote: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  codEnabled: boolean;
  easypaisaEnabled: boolean;
  walletEnabled: boolean;
  lowStockThreshold: number;
  sizeChartMap: SizeMapping[];
}
