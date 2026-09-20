export type LeatherColor = 'saddle-tan' | 'espresso' | 'burnt-copper' | 'mustard-gold' | 'midnight-black' | 'vintage-tan' | (string & {});
export type SoleType = 'tire-recycled' | 'double-leather' | 'cushioned-foam' | 'traditional-raw';
export type BuckleFinish = 'aged-brass' | 'burnt-copper' | 'antique-silver' | 'matte-black';

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'hidden';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  disabled?: boolean;
  productCount?: number;
}

export interface Product {
  id: string;
  articleTag?: string; // e.g. KDM-00001 (Article code / tag)
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  costPrice?: number;
  originalPrice?: number;
  category: string;
  description: string;
  features: string[];
  materials: string;
  craftingTime: string;
  images: {
    front: string;
    back?: string;
    left?: string;
    right?: string;
    top?: string;
    sole?: string;
    gallery?: string[];
    [key: string]: any;
  };
  availableSizes: number[]; // EU sizes: 39, 40, 41, 42, 43, 44, 45
  availableColors: (LeatherColor | string)[];
  averageRating: number;
  reviewCount: number;
  featured?: boolean;
  freeShipping?: boolean;
  stockCount?: number;
}

export interface AiProductDetails {
  name: string;
  subtitle: string;
  category: string;
  detectedColor: string;
  colorHex: string;
  description: string;
  materials: string;
  craftingTime: string;
  features: string[];
}

export interface CartItem {
  id: string; // unique item instance id
  product: Product;
  size: number;
  selectedColor: LeatherColor;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderTrackingStep {
  status: 'Placed' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  completed: boolean;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: 'standard' | 'express' | 'artisan-courier';
  paymentMethod: 'cod' | 'card' | 'jazzcash' | 'easypaisa';
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: 'Placed' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingSteps: OrderTrackingStep[];
  replacementRequested?: boolean;
  replacementStatus?: 'pending' | 'approved' | 'rejected';
  replacementReason?: string;
  promoCode?: string;
}

export interface CustomerMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export type { InvestmentItem, InvestmentCategory } from './admin';
