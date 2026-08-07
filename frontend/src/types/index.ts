export type LeatherColor = 'saddle-tan' | 'espresso' | 'burnt-copper' | 'mustard-gold' | 'midnight-black' | 'vintage-tan';
export type SoleType = 'tire-recycled' | 'double-leather' | 'cushioned-foam' | 'traditional-raw';
export type BuckleFinish = 'aged-brass' | 'burnt-copper' | 'antique-silver' | 'matte-black';

export interface ProductCustomizationOptions {
  availableColors: LeatherColor[];
  availableSoles: SoleType[];
  availableBuckles: BuckleFinish[];
  allowInitials: boolean;
}

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

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  category: 'Kaptaan' | 'Zalmi' | 'Norzi' | 'Quetta' | 'Royal';
  description: string;
  features: string[];
  materials: string;
  craftingTime: string;
  isCustomizable: boolean;
  images: {
    front: string;
    back: string;
    left: string;
    right: string;
    top: string;
    sole: string;
  };
  model3dUrl?: string;
  status3D: 'queued' | 'processing' | 'ready' | 'failed';
  availableSizes: number[]; // EU sizes: 39, 40, 41, 42, 43, 44, 45
  availableColors: LeatherColor[];
  customization: ProductCustomizationOptions;
  averageRating: number;
  reviewCount: number;
  featured?: boolean;
  freeShipping?: boolean;
}

export interface CustomizationSelection {
  productId: string;
  productName: string;
  basePrice: number;
  leatherColor: LeatherColor;
  soleType: SoleType;
  buckleFinish: BuckleFinish;
  stitchingColor: 'matching' | 'contrast-brass' | 'cream-handstitched';
  initials?: string;
  size: number;
  customPrice: number;
}

export interface CartItem {
  id: string; // unique item instance id
  product: Product;
  size: number;
  selectedColor: LeatherColor;
  quantity: number;
  isCustomized: boolean;
  customizationDetails?: CustomizationSelection;
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
  status: 'Placed' | 'Crafting' | 'Quality Check' | 'Shipped' | 'Delivered';
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
  status: 'Pending' | 'Crafting' | 'Quality Check' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingSteps: OrderTrackingStep[];
  isCustomizedOrder: boolean;
  replacementRequested?: boolean;
  replacementStatus?: 'pending' | 'approved' | 'rejected';
  replacementReason?: string;
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
