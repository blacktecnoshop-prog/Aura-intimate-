export interface ProductColor {
  name: string;
  hex: string;
  imageIndex?: number;
}

export interface ProductVariant {
  id: string; // e.g. "bts-101-noir-black-32b"
  color: string;
  size: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  available: boolean;
  imageIndex?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  sellingPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  description: string;
  fabricAndCare: string;
  hygieneNotice: string;
  stock: number;
  featured: boolean;
  newArrival: boolean;
  isSale: boolean;
  isPublished?: boolean;
  images: string[];
  imageAlt?: string;
  colors: ProductColor[];
  sizes: string[];
  variants?: ProductVariant[];
  matchingProductIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  imageAlt?: string;
  order: number;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface StoreSettings {
  brandName: string;
  brandTagline: string;
  instagramHandle: string;
  instagramUrl: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  currencySymbol: string;
  announcementText: string;
  announcementEnabled: boolean;
  shippingFee: number;
  freeShippingThreshold: number;
  metaTitle?: string;
  metaDescription?: string;
  googleSiteVerification?: string;
  canonicalDomain?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  active: boolean;
}

export interface OrderEnquiryItem {
  productId: string;
  sku: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
}

export interface OrderEnquiry {
  id: string;
  items: OrderEnquiryItem[];
  subtotal: number;
  channel: 'instagram';
  copiedMessage: string;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique item key: productId-color-size
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface SecurityLogEntry {
  id: string;
  event: 'login_success' | 'login_failed' | 'password_changed' | 'session_revoked' | 'settings_updated';
  status: 'success' | 'warning' | 'alert';
  timestamp: string;
  ip: string;
  userAgent: string;
  details?: string;
}
