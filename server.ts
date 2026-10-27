import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sendSecurityAlert } from './server/services/notification.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure data and upload directories exist
const DATA_DIR = path.join(__dirname, 'server', 'data');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const DIST_IMAGES_DIR = path.join(__dirname, 'dist', 'images');
const DIST_UPLOADS_DIR = path.join(__dirname, 'dist', 'uploads');

[DATA_DIR, UPLOADS_DIR, IMAGES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Serve public images, uploads, and legacy asset paths reliably in both dev and production
app.use('/images', express.static(IMAGES_DIR, { maxAge: '7d' }));
if (fs.existsSync(DIST_IMAGES_DIR)) {
  app.use('/images', express.static(DIST_IMAGES_DIR, { maxAge: '7d' }));
}
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
if (fs.existsSync(DIST_UPLOADS_DIR)) {
  app.use('/uploads', express.static(DIST_UPLOADS_DIR, { maxAge: '7d' }));
}

// Legacy fallbacks so any cached browser sessions requesting /src/assets/images/... never fail
app.use('/src/assets/images', express.static(IMAGES_DIR));
if (fs.existsSync(DIST_IMAGES_DIR)) {
  app.use('/src/assets/images', express.static(DIST_IMAGES_DIR));
}
app.use('/src/assets/images', express.static(path.join(__dirname, 'src', 'assets', 'images')));

// If an image asset is not found, return 404 immediately rather than falling through to SPA index.html
app.use(['/images', '/uploads', '/src/assets/images'], (_req, res) => {
  res.status(404).json({ error: 'Image asset not found' });
});

const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Password security helpers
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const key = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// In-memory active admin sessions: token -> { expiresAt: number }
const activeSessions = new Map<string, { expiresAt: number }>();

function generateSessionToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { expiresAt: Date.now() + 24 * 60 * 60 * 1000 }); // 24 hours
  return token;
}

function isSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

// Rate Limiting for Admin Login: 5 failed attempts in 15 minutes locks out IP
const loginRateLimitMap = new Map<string, { attempts: number; lockedUntil?: number; firstAttemptAt: number }>();

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Reset if window has expired
  if (now - record.firstAttemptAt > 15 * 60 * 1000) {
    loginRateLimitMap.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const record = loginRateLimitMap.get(ip) || { attempts: 0, firstAttemptAt: now };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
  }
  loginRateLimitMap.set(ip, record);
}

function resetLoginRateLimit(ip: string): void {
  loginRateLimitMap.delete(ip);
}

// Security Audit Logger
function logSecurityEvent(
  store: any,
  event: 'login_success' | 'login_failed' | 'password_changed' | 'session_revoked' | 'settings_updated',
  status: 'success' | 'warning' | 'alert',
  req: Request,
  details?: string
) {
  if (!Array.isArray(store.securityLogs)) {
    store.securityLogs = [];
  }
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const ip = rawIp.replace('::ffff:', '');
  const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';
  const timestamp = new Date().toISOString();

  const entry = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    event,
    status,
    timestamp,
    ip,
    userAgent,
    details: details || ''
  };

  store.securityLogs.unshift(entry);
  if (store.securityLogs.length > 150) {
    store.securityLogs = store.securityLogs.slice(0, 150);
  }
  saveStore(store);

  // Send asynchronous notification
  sendSecurityAlert({
    event: event as any,
    ip,
    userAgent,
    timestamp,
    details
  }).catch((err) => console.warn('Alert delivery warning:', err));
}

// Initial admin configuration
const envAdminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
const initialSalt = crypto.randomBytes(16).toString('hex');
const initialHash = envAdminPassword ? hashPassword(envAdminPassword, initialSalt) : '';
const initialSetupCompleted = Boolean(envAdminPassword && envAdminPassword.length >= 8);

const defaultStoreData = {
  admin: {
    salt: initialSalt,
    passwordHash: initialHash,
    recoveryKeyHash: '',
    setupCompleted: initialSetupCompleted,
    lastPasswordChange: initialSetupCompleted ? new Date().toISOString() : null
  },
  settings: {
    brandName: 'Aura Intimates',
    brandTagline: 'Comfort · Confidence · You',
    instagramHandle: '@auraintimates',
    instagramUrl: 'https://www.instagram.com/auraintimates',
    contactEmail: 'contact@auraintimates.com',
    contactPhone: '+91 98765 43210',
    currency: 'INR',
    currencySymbol: '₹',
    announcementText: 'Free Discreet Delivery across India on orders above ₹999 | 100% Genuine Luxury Essentials',
    announcementEnabled: true,
    shippingFee: 99,
    freeShippingThreshold: 999,
    metaTitle: "Aura Intimates | Women's Innerwear",
    metaDescription: "Discover luxury women's bras, panties, matching lingerie sets, and seamless innerwear in India with discreet delivery from Aura Intimates."
  },
  categories: [
    {
      id: 'bras',
      name: 'Bras',
      slug: 'bras',
      description: 'Supportive, wire-free & balconette silhouettes crafted from buttery-soft fabrics.',
      image: '/images/product_seamless_bra_1792781849562.jpg',
      order: 1,
      featured: true
    },
    {
      id: 'panties',
      name: 'Panties',
      slug: 'panties',
      description: 'Breathable organic cotton and lustrous silk-satin knickers designed for all-day ease.',
      image: '/images/product_satin_panty_set_1792781849920.jpg',
      order: 2,
      featured: true
    },
    {
      id: 'matching-sets',
      name: 'Matching Sets',
      slug: 'matching-sets',
      description: 'Coordinated bra and panty pairs uniting sensual lace and rich plum satin.',
      image: '/images/product_matching_lingerie_1792781849792.jpg',
      order: 3,
      featured: true
    },
    {
      id: 'everyday-essentials',
      name: 'Everyday Essentials',
      slug: 'everyday-essentials',
      description: 'Second-skin foundations, invisible lines, and weightless comfort for your daily wardrobe.',
      image: '/images/hero_luxury_innerwear_1792781847179.jpg',
      order: 4,
      featured: true
    },
    {
      id: 'seamless-innerwear',
      name: 'Seamless Innerwear',
      slug: 'seamless-innerwear',
      description: 'Zero friction, laser-cut edges, and undetectable under-clothing support.',
      image: '/images/product_seamless_bra_1792781849562.jpg',
      order: 5,
      featured: false
    },
    {
      id: 'sports-bras',
      name: 'Sports Bras',
      slug: 'sports-bras',
      description: 'Moisture-wicking, bounce-control innerwear for yoga, workouts, and high mobility.',
      image: '/images/product_lace_bralette_1792781848040.jpg',
      order: 6,
      featured: false
    },
    {
      id: 'shapewear',
      name: 'Shapewear',
      slug: 'shapewear',
      description: 'Gentle contouring briefs and high-waist waist smoothers with flexible boning.',
      image: '/images/product_matching_lingerie_1792781849792.jpg',
      order: 7,
      featured: false
    },
    {
      id: 'sale',
      name: 'Sale & Offers',
      slug: 'sale',
      description: 'Genuine limited-run discounts on seasonal colors and curated bundles.',
      image: '/images/product_lace_bralette_1792781848040.jpg',
      order: 8,
      featured: false
    }
  ],
  banners: [
    {
      id: 'banner-1',
      title: 'Comfort Meets Confidence',
      subtitle: 'Discover your everyday essentials crafted with artisanal softness and flawless tailored support.',
      buttonText: 'Explore Collection',
      buttonLink: '#products',
      image: '/images/hero_luxury_innerwear_1792781847179.jpg',
      active: true
    }
  ],
  products: [
    {
      id: 'bts-101',
      sku: 'BTS-BR-01',
      name: 'Aura Cloud Seamless T-Shirt Bra',
      categoryId: 'seamless-innerwear',
      categoryName: 'Seamless Innerwear',
      sellingPrice: 1299,
      originalPrice: 1699,
      discountPercent: 23,
      description: 'The Aura Cloud T-Shirt Bra is engineered with micro-bonded seamless wings and ultra-plush molded cups. Designed to be completely invisible beneath silk tops, t-shirts, and bodycon dresses.',
      fabricAndCare: '82% Polyamide, 18% Elastane. 100% Cotton gusset lining. Hand wash cold with mild detergent. Do not wring or tumble dry.',
      hygieneNotice: 'Eligible for size exchange within 7 days if unworn, unwashed, and original security tags remain intact.',
      stock: 35,
      featured: true,
      newArrival: true,
      isSale: true,
      images: [
        '/images/product_seamless_bra_1792781849562.jpg',
        '/images/hero_luxury_innerwear_1792781847179.jpg'
      ],
      colors: [
        { name: 'Nude Blush', hex: '#D7A79D', imageIndex: 0 },
        { name: 'Warm Ivory', hex: '#F7F1E7', imageIndex: 1 },
        { name: 'Midnight Onyx', hex: '#1E1E24', imageIndex: 0 }
      ],
      sizes: ['32B', '32C', '34B', '34C', '36B', '36C', '38B'],
      matchingProductIds: ['bts-103'],
      metaTitle: 'Aura Cloud Seamless T-Shirt Bra — Invisible Comfort | Aura Intimates',
      metaDescription: 'Shop the Aura Cloud Seamless T-Shirt Bra at Aura Intimates. Ultra-soft molded cups, laser-cut invisible wings, and 100% discreet packaging across India.',
      metaKeywords: ['seamless bra', 't-shirt bra', 'wire-free bra', 'invisible innerwear', 'Aura Intimates'],
      createdAt: '2026-10-01T10:00:00Z'
    },
    {
      id: 'bts-102',
      sku: 'BTS-BR-02',
      name: 'Nocturne French Chantilly Lace Bralette',
      categoryId: 'bras',
      categoryName: 'Bras',
      sellingPrice: 1499,
      originalPrice: 1999,
      discountPercent: 25,
      description: 'Delicate floral eyelash lace meets soft underbust scalloping in our signature Nocturne Bralette. Wire-free with dual adjustable gold-finish sliders and a double-hook back closure.',
      fabricAndCare: '88% Nylon Lace, 12% Spandex. Delicate mesh lining. Hand wash cold in laundry bag. Dry flat in shade.',
      hygieneNotice: 'Non-returnable if hygiene seal is broken. Size exchange supported on unopened/sealed items.',
      stock: 22,
      featured: true,
      newArrival: false,
      isSale: true,
      images: [
        '/images/product_lace_bralette_1792781848040.jpg',
        '/images/product_matching_lingerie_1792781849792.jpg'
      ],
      colors: [
        { name: 'Noir Black', hex: '#191919', imageIndex: 0 },
        { name: 'Muted Mauve', hex: '#8B6B75', imageIndex: 1 },
        { name: 'Rose Petal', hex: '#DCAEAE', imageIndex: 0 }
      ],
      sizes: ['30B', '32B', '32C', '34B', '34C', '36B', '36C'],
      matchingProductIds: ['bts-104'],
      metaTitle: 'Nocturne French Chantilly Lace Bralette — Luxury Lingerie | Aura Intimates',
      metaDescription: 'Discover our handcrafted Nocturne French Chantilly lace bralette. Wire-free scalloped design, adjustable gold sliders, and delicate support for effortless allure.',
      metaKeywords: ['lace bralette', 'french chantilly lace', 'black bralette', 'luxury lingerie', 'Aura Intimates'],
      createdAt: '2026-10-05T12:00:00Z'
    },
    {
      id: 'bts-103',
      sku: 'BTS-PN-01',
      name: 'Luxe Mulberry Silk-Satin Briefs (Trio Pack)',
      categoryId: 'panties',
      categoryName: 'Panties',
      sellingPrice: 1199,
      originalPrice: 1599,
      discountPercent: 25,
      description: 'A curated 3-pack of mid-rise briefs spun from pure fluid silk-satin with fine floral scalloped eyelash edging. Features pure bamboo cotton breathable gusset for optimal hygiene.',
      fabricAndCare: '92% Mulberry Silk Satin, 8% Elastane. 100% Organic Bamboo Cotton gusset. Hand wash gentle. Flat air dry.',
      hygieneNotice: 'For health and intimate hygiene safety, panties with broken protective seal liners are strictly non-returnable.',
      stock: 40,
      featured: true,
      newArrival: true,
      isSale: true,
      images: [
        '/images/product_satin_panty_set_1792781849920.jpg',
        '/images/product_matching_lingerie_1792781849792.jpg'
      ],
      colors: [
        { name: 'Trio: Blush, Mauve & Champagne', hex: '#C4A69D', imageIndex: 0 }
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      matchingProductIds: ['bts-101'],
      metaTitle: 'Luxe Mulberry Silk-Satin Briefs Trio Pack — Hypoallergenic | Aura Intimates',
      metaDescription: 'Indulge in pure mulberry silk-satin knickers with organic bamboo cotton gussets. Elegant 3-pack in blush, mauve, and champagne with discreet India delivery.',
      metaKeywords: ['silk panties', 'satin briefs', 'bamboo gusset', 'lingerie pack', 'Aura Intimates'],
      createdAt: '2026-10-10T14:00:00Z'
    },
    {
      id: 'bts-104',
      sku: 'BTS-ST-01',
      name: 'Royal Plum Satin & Eyelash Lace Set',
      categoryId: 'matching-sets',
      categoryName: 'Matching Sets',
      sellingPrice: 2499,
      originalPrice: 3299,
      discountPercent: 24,
      description: 'The pinnacle of luxury tailoring. Includes our tailored demi-cup satin bra and matching high-waisted shaping brief. Finished in deep imperial plum with French scallop lace panels.',
      fabricAndCare: '85% Satin Silk, 15% Elastane. Lace embroidery. Hand wash in cold water with silk-safe liquid.',
      hygieneNotice: 'Sets must be tried on over existing garments with panty protective seal completely intact for exchange.',
      stock: 18,
      featured: true,
      newArrival: true,
      isSale: true,
      images: [
        '/images/product_matching_lingerie_1792781849792.jpg',
        '/images/hero_luxury_innerwear_1792781847179.jpg'
      ],
      colors: [
        { name: 'Imperial Plum', hex: '#441B33', imageIndex: 0 },
        { name: 'Champagne Ivory', hex: '#EBE2D5', imageIndex: 1 }
      ],
      sizes: ['32B / S', '32C / M', '34B / M', '34C / L', '36B / L', '36C / XL'],
      matchingProductIds: ['bts-102'],
      metaTitle: 'Royal Plum Satin & Eyelash Lace Lingerie Set | Aura Intimates',
      metaDescription: 'Experience imperial elegance with our Royal Plum Satin & Scalloped Lace matching set. Demi-cup bra and high-waist brief tailored for confident silhouettes.',
      metaKeywords: ['matching lingerie set', 'satin lingerie', 'plum innerwear', 'high waist brief', 'Aura Intimates'],
      createdAt: '2026-10-12T09:00:00Z'
    },
    {
      id: 'bts-105',
      sku: 'BTS-EE-01',
      name: 'Pure Cotton Wireless Daily Contour Bra',
      categoryId: 'everyday-essentials',
      categoryName: 'Everyday Essentials',
      sellingPrice: 899,
      originalPrice: 1099,
      discountPercent: 18,
      description: 'Crafted from 100% combed Pima cotton with double-layered fabric cups that provide natural shaping without underwires. Wide cushioned shoulder straps relieve back and shoulder strain.',
      fabricAndCare: '95% Combed Cotton, 5% Spandex. Machine wash gentle in mesh bag, dry in shade.',
      hygieneNotice: '7-day sizing exchange with original tags intact.',
      stock: 50,
      featured: false,
      newArrival: false,
      isSale: false,
      images: [
        '/images/hero_luxury_innerwear_1792781847179.jpg',
        '/images/product_seamless_bra_1792781849562.jpg'
      ],
      colors: [
        { name: 'Pearl Cream', hex: '#F6F2EC', imageIndex: 0 },
        { name: 'Soft Blush', hex: '#E5C4BF', imageIndex: 0 }
      ],
      sizes: ['30B', '32B', '32C', '34B', '34C', '36B', '36C', '38B', '38C'],
      matchingProductIds: ['bts-103'],
      metaTitle: 'Pure Cotton Wireless Daily Contour Bra — All-Day Ease | Aura Intimates',
      metaDescription: 'Breathe easy in 100% combed Pima cotton with double-layered contour cups and cushioned shoulder straps. Gentle everyday support with size exchange guarantee.',
      metaKeywords: ['cotton bra', 'wireless bra', 'daily innerwear', 'pima cotton', 'Aura Intimates'],
      createdAt: '2026-10-15T08:00:00Z'
    }
  ],
  subscribers: [] as Array<{ id: string; email: string; subscribedAt: string }>,
  orderEnquiries: [] as Array<any>
};

// Database loader and saver
function getStore() {
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultStoreData, null, 2), 'utf-8');
    return defaultStoreData;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all products have SEO metadata defined
    let changed = false;
    if (Array.isArray(parsed.products)) {
      parsed.products.forEach((p: any) => {
        if (!p.metaTitle) {
          p.metaTitle = `${p.name} — Luxury Women's Innerwear | Aura Intimates`;
          changed = true;
        }
        if (!p.metaDescription) {
          p.metaDescription = `Shop ${p.name} online at Aura Intimates. ${p.description ? p.description.slice(0, 110) : 'Luxury essentials'}... Discreet packaging across India.`;
          changed = true;
        }
      });
    }
    if (changed) {
      saveStore(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading store.json, reverting to default:', err);
    return defaultStoreData;
  }
}

function saveStore(data: typeof defaultStoreData) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Authentication middleware for Owner-Only routes
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Owner authentication required' });
  }
  const token = authHeader.substring(7).trim();
  if (!isSessionValid(token)) {
    return res.status(403).json({ error: 'Session expired or invalid. Please log in again.' });
  }
  next();
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Get Store Settings
app.get('/api/settings', (_req, res) => {
  const store = getStore();
  res.json({
    ...store.settings,
    setupCompleted: store.admin.setupCompleted
  });
});

// Get Categories
app.get('/api/categories', (_req, res) => {
  const store = getStore();
  const sorted = [...store.categories].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

// Get Banners
app.get('/api/banners', (_req, res) => {
  const store = getStore();
  const activeBanners = store.banners.filter((b: any) => b.active);
  res.json(activeBanners);
});

// Get Products (with category, search, and sorting)
app.get('/api/products', (req, res) => {
  const store = getStore();
  let list = [...store.products];

  const category = req.query.category as string;
  const search = req.query.search as string;
  const featured = req.query.featured as string;
  const newArrival = req.query.newArrival as string;
  const isSale = req.query.isSale as string;
  const sort = req.query.sort as string;

  if (category && category !== 'all') {
    list = list.filter((p) => p.categoryId === category || p.categoryName?.toLowerCase() === category.toLowerCase());
  }
  if (featured === 'true') {
    list = list.filter((p) => p.featured);
  }
  if (newArrival === 'true') {
    list = list.filter((p) => p.newArrival);
  }
  if (isSale === 'true') {
    list = list.filter((p) => p.isSale);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q)
    );
  }

  if (sort === 'price-low') {
    list.sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (sort === 'price-high') {
    list.sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(list);
});

// Get Single Product
app.get('/api/products/:id', (req, res) => {
  const store = getStore();
  const product = store.products.find((p: any) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  // Include matching products if any
  const matching = (product.matchingProductIds || [])
    .map((id: string) => store.products.find((p: any) => p.id === id))
    .filter(Boolean);

  res.json({ ...product, matchingProducts: matching });
});

// Newsletter Subscription
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  const store = getStore();
  const normalized = email.trim().toLowerCase();
  const exists = store.subscribers.some((s: any) => s.email === normalized);
  if (exists) {
    return res.json({ message: 'You are already subscribed to Aura Intimates updates.' });
  }
  const newSub = {
    id: `sub_${Date.now()}`,
    email: normalized,
    subscribedAt: new Date().toISOString()
  };
  store.subscribers.push(newSub);
  saveStore(store);
  res.json({ message: 'Thank you for subscribing! You will receive genuine collection updates.' });
});

// Log customer Instagram/WhatsApp Order Enquiry
app.post('/api/orders/log', (req, res) => {
  const { items, subtotal, channel, copiedMessage } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order details missing' });
  }
  const store = getStore();
  const enquiry = {
    id: `enq_${Date.now()}`,
    items,
    subtotal: Number(subtotal) || 0,
    channel: channel || 'instagram',
    copiedMessage: copiedMessage || '',
    createdAt: new Date().toISOString()
  };
  store.orderEnquiries.unshift(enquiry);
  // Keep last 200 enquiries
  if (store.orderEnquiries.length > 200) {
    store.orderEnquiries = store.orderEnquiries.slice(0, 200);
  }
  saveStore(store);
  res.json({ success: true, enquiryId: enquiry.id });
});

// ==========================================
// TECHNICAL SEO: ROBOTS.TXT & SITEMAP.XML
// ==========================================

// Serve dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const store = getStore();
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  const siteUrl = store.settings?.canonicalDomain ? store.settings.canonicalDomain.replace(/\/$/, '') : `${protocol}://${host}`;

  const robots = `# robots.txt for ${store.settings?.brandName || 'Aura Intimates'}
User-agent: *
Allow: /
Allow: /src/assets/
Allow: /uploads/
Disallow: /api/admin/
Disallow: /api/upload
Disallow: /admin
Disallow: /?search=*
Disallow: /*?*sort=*

# Crawlable XML Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(robots);
});

// Serve dynamic XML Sitemap with Google Image extension
app.get('/sitemap.xml', (req, res) => {
  const store = getStore();
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  const siteUrl = store.settings?.canonicalDomain ? store.settings.canonicalDomain.replace(/\/$/, '') : `${protocol}://${host}`;
  const now = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${siteUrl}/</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Categories / Collections
  if (Array.isArray(store.categories)) {
    store.categories.forEach((cat: any) => {
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/category/${encodeURIComponent(cat.slug || cat.id)}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    });
  }

  // 3. Published Public Products with image entries
  if (Array.isArray(store.products)) {
    store.products.forEach((prod: any) => {
      if (prod.isPublished === false) return;

      const prodDate = prod.updatedAt ? prod.updatedAt.split('T')[0] : prod.createdAt ? prod.createdAt.split('T')[0] : now;
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}/product/${encodeURIComponent(prod.id)}</loc>\n`;
      xml += `    <lastmod>${prodDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.80</priority>\n`;

      if (Array.isArray(prod.images) && prod.images.length > 0) {
        prod.images.slice(0, 3).forEach((imgUrl: string) => {
          const fullImgUrl = imgUrl.startsWith('http') ? imgUrl : `${siteUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
          xml += `    <image:image>\n`;
          xml += `      <image:loc>${fullImgUrl.replace(/&/g, '&amp;')}</image:loc>\n`;
          xml += `      <image:title>${(prod.metaTitle || prod.name || '').replace(/[<>&'"]/g, '')}</image:title>\n`;
          xml += `    </image:image>\n`;
        });
      }
      xml += `  </url>\n`;
    });
  }

  // 4. Information & Fit Guide Pages
  const staticPages = [
    { path: '/size-guide', priority: '0.70', freq: 'monthly' },
    { path: '/about', priority: '0.60', freq: 'monthly' },
    { path: '/contact', priority: '0.60', freq: 'monthly' },
    { path: '/policy/shipping', priority: '0.50', freq: 'monthly' },
    { path: '/policy/returns', priority: '0.50', freq: 'monthly' },
    { path: '/policy/privacy', priority: '0.40', freq: 'monthly' },
    { path: '/policy/terms', priority: '0.40', freq: 'monthly' },
  ];

  staticPages.forEach((p) => {
    xml += `  <url>\n`;
    xml += `    <loc>${siteUrl}${p.path}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${p.freq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

// ==========================================
// ADMIN AUTHENTICATION & MANAGEMENT
// ==========================================

// Check Auth Status
app.get('/api/admin/status', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
  const valid = isSessionValid(token);
  const store = getStore();
  const setupDone = Boolean(store.admin?.setupCompleted && store.admin?.passwordHash);
  res.json({
    authenticated: valid,
    setupCompleted: setupDone,
    lastPasswordChange: store.admin?.lastPasswordChange
  });
});

// Admin Login with Rate Limiting & Security Audit Log
app.post('/api/admin/login', (req, res) => {
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const clientIp = rawIp.replace('::ffff:', '');
  const store = getStore();

  const isSetupDone = Boolean(store.admin?.setupCompleted && store.admin?.passwordHash);
  if (!isSetupDone) {
    return res.status(400).json({
      error: 'Owner setup is not completed yet. Please configure your master password in the setup panel.',
      setupCompleted: false
    });
  }

  // 1. Check rate limit
  const rateLimitStatus = checkLoginRateLimit(clientIp);
  if (!rateLimitStatus.allowed) {
    logSecurityEvent(store, 'login_failed', 'alert', req, `Rate limit exceeded. Lockout active (${rateLimitStatus.retryAfterSeconds}s remaining)`);
    return res.status(429).json({
      error: `Too many failed login attempts. For security, access from your device is locked for ${Math.ceil((rateLimitStatus.retryAfterSeconds || 60) / 60)} more minutes.`
    });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  let isMatch = false;
  if (store.admin?.passwordHash && store.admin?.salt) {
    isMatch = verifyPassword(password, store.admin.passwordHash, store.admin.salt);
  }

  const envPwd = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  if (!isMatch && envPwd && password === envPwd) {
    isMatch = true;
    const newSalt = crypto.randomBytes(16).toString('hex');
    store.admin.salt = newSalt;
    store.admin.passwordHash = hashPassword(envPwd, newSalt);
    store.admin.setupCompleted = true;
    saveStore(store);
  }

  if (!isMatch) {
    recordFailedLoginAttempt(clientIp);
    logSecurityEvent(store, 'login_failed', 'warning', req, 'Incorrect master password attempt');
    return res.status(401).json({ error: 'Invalid owner credentials. Access denied.' });
  }

  // Success
  resetLoginRateLimit(clientIp);
  const token = generateSessionToken();
  logSecurityEvent(store, 'login_success', 'success', req, 'Owner master login authenticated successfully');

  res.json({
    success: true,
    token,
    message: 'Welcome back to Aura Intimates Owner Dashboard'
  });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Owner Password Setup / Update
app.post('/api/admin/setup', (req, res) => {
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const clientIp = rawIp.replace('::ffff:', '');
  const { currentPassword, newPassword } = req.body;
  const store = getStore();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const isAlreadySetup = Boolean(store.admin?.setupCompleted && store.admin?.passwordHash);

  // If already set up, verify authorization
  if (isAlreadySetup) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
    const isTokenValid = isSessionValid(token);
    const envPwd = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
    const isCurrentPasswordCorrect =
      Boolean(currentPassword && store.admin?.passwordHash && store.admin?.salt && verifyPassword(currentPassword, store.admin.passwordHash, store.admin.salt)) ||
      Boolean(currentPassword && envPwd && currentPassword === envPwd);

    if (!isTokenValid && !isCurrentPasswordCorrect) {
      return res.status(401).json({ error: 'Current password verification required to update security credentials.' });
    }
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  const recoveryKey = `bts_rec_${crypto.randomBytes(16).toString('hex')}`;
  const recoveryKeyHash = hashPassword(recoveryKey, newSalt);

  store.admin = {
    salt: newSalt,
    passwordHash: newHash,
    recoveryKeyHash,
    setupCompleted: true,
    lastPasswordChange: new Date().toISOString()
  };
  saveStore(store);

  // Reset any failed attempts lockout for owner
  resetLoginRateLimit(clientIp);

  // Invalidate all old sessions and issue fresh token
  activeSessions.clear();
  const newToken = generateSessionToken();

  const eventType = isAlreadySetup ? 'password_changed' : 'login_success';
  logSecurityEvent(store, eventType as any, 'success', req, isAlreadySetup ? 'Owner master credentials were changed.' : 'Owner master password initialized successfully.');

  res.json({
    success: true,
    token: newToken,
    recoveryKey,
    message: isAlreadySetup ? 'Owner password successfully updated.' : 'Owner master password successfully set and secured.'
  });
});

// Request One-Time Reset Code (Owner-Only)
app.post('/api/admin/request-reset', (req, res) => {
  const store = getStore();
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const clientIp = rawIp.replace('::ffff:', '');

  if (!store.admin?.setupCompleted || !store.admin?.passwordHash) {
    return res.json({
      success: true,
      setupNeeded: true,
      message: 'Owner setup has not been completed. You can initialize your master password directly in the setup view.'
    });
  }

  const resetCode = String(Math.floor(100000 + Math.random() * 900000));
  const salt = store.admin.salt || crypto.randomBytes(16).toString('hex');
  store.admin.resetCodeHash = hashPassword(resetCode, salt);
  store.admin.resetCodeExpiresAt = Date.now() + 15 * 60 * 1000;
  saveStore(store);

  logSecurityEvent(store, 'password_changed', 'alert', req, 'A master password reset code was requested.');

  sendSecurityAlert({
    event: 'password_changed',
    ip: clientIp,
    userAgent: (req.headers['user-agent'] as string) || 'Browser',
    timestamp: new Date().toISOString(),
    details: `Master password reset requested. One-time verification code: ${resetCode} (valid for 15 minutes).`
  }).catch((err) => console.warn('Alert delivery warning:', err));

  res.json({
    success: true,
    message: 'Reset verification code dispatched. If SMTP alerts are configured, check your email. You can also use your secure Recovery Key.'
  });
});

// Reset Password with Recovery Key or Reset Code
app.post('/api/admin/reset-password', (req, res) => {
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const clientIp = rawIp.replace('::ffff:', '');
  const { recoveryKey, resetCode, newPassword } = req.body;
  const store = getStore();

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  let authorized = false;

  // 1. Check against ADMIN_SETUP_SECRET from env
  const setupSecret = process.env.ADMIN_SETUP_SECRET || process.env.OWNER_SECRET;
  if (setupSecret && recoveryKey && recoveryKey.trim() === setupSecret.trim()) {
    authorized = true;
  }

  // 2. Check against stored recovery key
  if (!authorized && recoveryKey && store.admin?.recoveryKeyHash && store.admin?.salt) {
    if (verifyPassword(recoveryKey.trim(), store.admin.recoveryKeyHash, store.admin.salt)) {
      authorized = true;
    }
  }

  // 3. Check against reset code (valid for 15 mins)
  if (!authorized && resetCode && store.admin?.resetCodeHash && store.admin?.resetCodeExpiresAt) {
    if (Date.now() <= store.admin.resetCodeExpiresAt && verifyPassword(resetCode.trim(), store.admin.resetCodeHash, store.admin.salt)) {
      authorized = true;
    }
  }

  if (!authorized) {
    recordFailedLoginAttempt(clientIp);
    logSecurityEvent(store, 'login_failed', 'alert', req, 'Failed password recovery attempt: invalid recovery key or code.');
    return res.status(401).json({ error: 'Invalid recovery key or expired reset code. Access denied.' });
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  const newRecoveryKey = `bts_rec_${crypto.randomBytes(16).toString('hex')}`;
  const recoveryKeyHash = hashPassword(newRecoveryKey, newSalt);

  store.admin.salt = newSalt;
  store.admin.passwordHash = newHash;
  store.admin.recoveryKeyHash = recoveryKeyHash;
  store.admin.setupCompleted = true;
  store.admin.lastPasswordChange = new Date().toISOString();
  delete store.admin.resetCodeHash;
  delete store.admin.resetCodeExpiresAt;
  saveStore(store);

  resetLoginRateLimit(clientIp);
  activeSessions.clear();
  const newToken = generateSessionToken();

  logSecurityEvent(store, 'password_changed', 'warning', req, 'Master password reset via recovery authorization.');

  res.json({
    success: true,
    token: newToken,
    recoveryKey: newRecoveryKey,
    message: 'Master password successfully reset and authenticated.'
  });
});

// Security Activity Logs Endpoint (Owner-only)
app.get('/api/admin/security-logs', requireAdmin, (_req, res) => {
  const store = getStore();
  res.json(store.securityLogs || []);
});

// Revoke All Other Sessions Endpoint (Owner-only)
app.post('/api/admin/revoke-sessions', requireAdmin, (req, res) => {
  const authHeader = req.headers.authorization;
  const currentToken = authHeader?.substring(7).trim();

  // Clear all sessions except current session
  activeSessions.forEach((val, key) => {
    if (key !== currentToken) {
      activeSessions.delete(key);
    }
  });

  const store = getStore();
  logSecurityEvent(store, 'session_revoked', 'warning', req, 'Owner revoked all other active sessions.');

  res.json({
    success: true,
    message: 'All other active sessions have been revoked.'
  });
});

// Admin Stats
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const store = getStore();
  const totalProducts = store.products.length;
  const lowStock = store.products.filter((p: any) => p.stock <= 5).length;
  const totalSubscribers = store.subscribers.length;
  const totalEnquiries = store.orderEnquiries.length;
  const totalCategories = store.categories.length;

  res.json({
    totalProducts,
    lowStock,
    totalSubscribers,
    totalEnquiries,
    totalCategories,
    categories: store.categories,
    subscribersCount: totalSubscribers,
    recentEnquiries: store.orderEnquiries.slice(0, 10)
  });
});

// Admin Enquiries List
app.get('/api/admin/enquiries', requireAdmin, (_req, res) => {
  const store = getStore();
  res.json(store.orderEnquiries || []);
});

// Admin Subscribers List
app.get('/api/admin/subscribers', requireAdmin, (_req, res) => {
  const store = getStore();
  res.json(store.subscribers || []);
});

// ==========================================
// OWNER PRODUCT MANAGEMENT (CRUD)
// ==========================================

// Add Product
app.post('/api/products', requireAdmin, (req, res) => {
  const {
    name,
    sku,
    categoryId,
    sellingPrice,
    originalPrice,
    description,
    fabricAndCare,
    hygieneNotice,
    stock,
    featured,
    newArrival,
    isSale,
    isPublished,
    images,
    imageAlt,
    colors,
    sizes,
    variants,
    matchingProductIds,
    metaTitle,
    metaDescription,
    metaKeywords
  } = req.body;

  if (!name || !sellingPrice || !categoryId) {
    return res.status(400).json({ error: 'Name, selling price, and category are required.' });
  }

  const store = getStore();
  const category = store.categories.find((c: any) => c.id === categoryId);

  const priceNum = Math.max(0, Number(sellingPrice) || 0);
  const origPriceNum = originalPrice ? Math.max(0, Number(originalPrice) || 0) : undefined;
  let discountPercent: number | undefined;
  if (origPriceNum && origPriceNum > priceNum) {
    discountPercent = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
  }

  const cleanName = String(name).trim();
  const defaultMetaTitle = `${cleanName} — Luxury Women's Innerwear | Aura Intimates`;
  const defaultMetaDesc = description ? `${String(description).slice(0, 120)}... Discreet delivery across India.` : `Shop ${cleanName} at Aura Intimates.`;

  const newProduct = {
    id: `bts-${Date.now().toString().slice(-6)}`,
    sku: sku ? String(sku).trim() : `BTS-${Math.floor(1000 + Math.random() * 9000)}`,
    name: cleanName,
    categoryId,
    categoryName: category ? category.name : 'Essentials',
    sellingPrice: priceNum,
    originalPrice: origPriceNum,
    discountPercent,
    description: String(description || '').trim(),
    fabricAndCare: String(fabricAndCare || '').trim(),
    hygieneNotice: String(hygieneNotice || 'Non-returnable once opened for intimate hygiene reasons.').trim(),
    stock: Math.max(0, Number(stock) || 0),
    featured: Boolean(featured),
    newArrival: Boolean(newArrival),
    isSale: Boolean(isSale),
    isPublished: isPublished !== false,
    images: Array.isArray(images) && images.length > 0 ? images : ['/images/hero_luxury_innerwear_1792781847179.jpg'],
    imageAlt: imageAlt ? String(imageAlt).trim() : `${cleanName} — Women's Innerwear & Lingerie`,
    colors: Array.isArray(colors) && colors.length > 0 ? colors : [{ name: 'Classic Nude', hex: '#D7A79D' }],
    sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L'],
    variants: Array.isArray(variants) ? variants : [],
    matchingProductIds: Array.isArray(matchingProductIds) ? matchingProductIds : [],
    metaTitle: metaTitle ? String(metaTitle).trim() : defaultMetaTitle,
    metaDescription: metaDescription ? String(metaDescription).trim() : defaultMetaDesc,
    metaKeywords: Array.isArray(metaKeywords)
      ? metaKeywords
      : typeof metaKeywords === 'string'
      ? metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : [],
    createdAt: new Date().toISOString()
  };

  store.products.unshift(newProduct);
  saveStore(store);
  res.status(201).json(newProduct);
});

// Update Product
app.put('/api/products/:id', requireAdmin, (req, res) => {
  const store = getStore();
  const index = store.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const existing = store.products[index];
  const body = req.body;

  const category = body.categoryId ? store.categories.find((c: any) => c.id === body.categoryId) : null;

  const sellingPrice = body.sellingPrice !== undefined ? Math.max(0, Number(body.sellingPrice)) : existing.sellingPrice;
  const originalPrice = body.originalPrice !== undefined ? (body.originalPrice ? Math.max(0, Number(body.originalPrice)) : undefined) : existing.originalPrice;
  let discountPercent: number | undefined;
  if (originalPrice && originalPrice > sellingPrice) {
    discountPercent = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
  }

  const updatedProduct = {
    ...existing,
    ...body,
    sellingPrice,
    originalPrice,
    discountPercent,
    categoryName: category ? category.name : existing.categoryName,
    variants: body.variants !== undefined ? body.variants : existing.variants,
    imageAlt: body.imageAlt !== undefined ? String(body.imageAlt).trim() : existing.imageAlt,
    isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished !== false,
    metaTitle: body.metaTitle !== undefined ? String(body.metaTitle).trim() : existing.metaTitle,
    metaDescription: body.metaDescription !== undefined ? String(body.metaDescription).trim() : existing.metaDescription,
    metaKeywords: body.metaKeywords !== undefined
      ? (Array.isArray(body.metaKeywords)
        ? body.metaKeywords
        : typeof body.metaKeywords === 'string'
        ? body.metaKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
        : existing.metaKeywords)
      : existing.metaKeywords,
    updatedAt: new Date().toISOString()
  };

  store.products[index] = updatedProduct;
  saveStore(store);
  res.json(updatedProduct);
});

// Inline Stock Update
app.patch('/api/products/:id/stock', requireAdmin, (req, res) => {
  const store = getStore();
  const index = store.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const { stock } = req.body;
  if (stock !== undefined) {
    store.products[index].stock = Math.max(0, Number(stock) || 0);
    store.products[index].updatedAt = new Date().toISOString();
    saveStore(store);
  }
  res.json(store.products[index]);
});

// Duplicate Product
app.post('/api/products/:id/duplicate', requireAdmin, (req, res) => {
  const store = getStore();
  const existing = store.products.find((p: any) => p.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const duplicated = {
    ...existing,
    id: `bts-${Date.now().toString().slice(-6)}`,
    sku: `${existing.sku}-COPY`,
    name: `${existing.name} (Copy)`,
    createdAt: new Date().toISOString()
  };
  store.products.unshift(duplicated);
  saveStore(store);
  res.status(201).json(duplicated);
});

// Delete Product
app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const store = getStore();
  const initialLength = store.products.length;
  store.products = store.products.filter((p: any) => p.id !== req.params.id);
  if (store.products.length === initialLength) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  saveStore(store);
  res.json({ success: true, message: 'Product deleted successfully.' });
});

// ==========================================
// CATEGORY & SETTINGS & BANNER MANAGEMENT
// ==========================================

// Add Category
app.post('/api/categories', requireAdmin, (req, res) => {
  const { name, slug, description, image, featured } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const store = getStore();
  const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = {
    id: cleanSlug,
    name: String(name).trim(),
    slug: cleanSlug,
    description: String(description || '').trim(),
    image: image || '/images/hero_luxury_innerwear_1792781847179.jpg',
    order: store.categories.length + 1,
    featured: Boolean(featured)
  };
  store.categories.push(newCat);
  saveStore(store);
  res.status(201).json(newCat);
});

// Update Category
app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const store = getStore();
  const index = store.categories.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  store.categories[index] = { ...store.categories[index], ...req.body };
  saveStore(store);
  res.json(store.categories[index]);
});

// Delete Category
app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const store = getStore();
  store.categories = store.categories.filter((c: any) => c.id !== req.params.id);
  saveStore(store);
  res.json({ success: true, message: 'Category removed' });
});

// Update Store Settings
app.put('/api/settings', requireAdmin, (req, res) => {
  const store = getStore();
  store.settings = { ...store.settings, ...req.body };
  saveStore(store);
  res.json(store.settings);
});

// Update / Add Banners
app.post('/api/banners', requireAdmin, (req, res) => {
  const store = getStore();
  const newBanner = {
    id: `banner-${Date.now()}`,
    ...req.body,
    active: req.body.active !== false
  };
  store.banners.push(newBanner);
  saveStore(store);
  res.status(201).json(newBanner);
});

app.put('/api/banners/:id', requireAdmin, (req, res) => {
  const store = getStore();
  const index = store.banners.findIndex((b: any) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Banner not found' });
  }
  store.banners[index] = { ...store.banners[index], ...req.body };
  saveStore(store);
  res.json(store.banners[index]);
});

app.delete('/api/banners/:id', requireAdmin, (req, res) => {
  const store = getStore();
  store.banners = store.banners.filter((b: any) => b.id !== req.params.id);
  saveStore(store);
  res.json({ success: true, message: 'Banner removed' });
});

// Secure Image Upload Handler (accepts base64 or multipart)
app.post('/api/upload', requireAdmin, (req, res) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Validate data URL format and image MIME type
    const matches = base64Data.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format. Allowed formats: PNG, JPEG, WEBP.' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Max 8MB size check
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds maximum limit of 8MB.' });
    }

    const cleanName = (filename ? filename.replace(/[^a-zA-Z0-9_-]/g, '_') : 'product') + '_' + Date.now() + '.' + ext;
    const destPath = path.join(UPLOADS_DIR, cleanName);

    fs.writeFileSync(destPath, buffer);
    if (fs.existsSync(DIST_UPLOADS_DIR)) {
      try {
        fs.writeFileSync(path.join(DIST_UPLOADS_DIR, cleanName), buffer);
      } catch (mirrorErr) {
        console.warn('Could not mirror upload to dist/uploads:', mirrorErr);
      }
    }
    const publicUrl = `/uploads/${cleanName}`;

    res.json({ url: publicUrl, filename: cleanName });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process image upload.' });
  }
});

// ==========================================
// VITE SPA DEV & PRODUCTION INTEGRATION
// ==========================================
async function startServer() {
  if (!isProduction) {
    // In dev, attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Prevent static assets from being served as index.html
      if (/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?|ttf|eot)$/i.test(req.path)) {
        return res.status(404).send('Static asset not found');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aura Intimates] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
