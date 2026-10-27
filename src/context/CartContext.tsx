import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, StoreSettings, CartItem, OrderEnquiryItem } from '../types/store';
import { fetchSettings } from '../services/api';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedColor: string, selectedSize: string, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;

  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  orderModalItems: OrderEnquiryItem[] | null;
  openOrderModal: (items: OrderEnquiryItem[]) => void;
  closeOrderModal: () => void;

  sizeGuideOpen: boolean;
  sizeGuideCategory: string;
  openSizeGuide: (categorySlug?: string) => void;
  closeSizeGuide: () => void;

  settings: StoreSettings;
  refreshSettings: () => Promise<void>;

  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  activePolicyPage: string | null;
  setActivePolicyPage: (page: string | null) => void;

  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
}

const defaultSettings: StoreSettings = {
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
  metaDescription: "Discover luxury women's bras, panties, matching lingerie sets, and seamless innerwear in India with discreet delivery from Aura Intimates.",
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bts_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bts_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bts_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [orderModalItems, setOrderModalItems] = useState<OrderEnquiryItem[] | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeGuideCategory, setSizeGuideCategory] = useState<string>('bras');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePolicyPage, setActivePolicyPage] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('bts_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('bts_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('bts_recently_viewed', JSON.stringify(recentlyViewed));
    } catch (e) {
      console.error(e);
    }
  }, [recentlyViewed]);

  const addRecentlyViewed = (productId: string) => {
    if (!productId) return;
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 12);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      console.warn('Using default settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const addToCart = (product: Product, selectedColor: string, selectedSize: string, quantity = 1) => {
    const itemKey = `${product.id}-${selectedColor}-${selectedSize}`;
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === itemKey);
      if (index > -1) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          selectedColor,
          selectedSize,
          quantity,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  const openOrderModal = (items: OrderEnquiryItem[]) => {
    setOrderModalItems(items);
  };

  const closeOrderModal = () => {
    setOrderModalItems(null);
  };

  const openSizeGuide = (categorySlug?: string) => {
    if (categorySlug) setSizeGuideCategory(categorySlug);
    setSizeGuideOpen(true);
  };

  const closeSizeGuide = () => {
    setSizeGuideOpen(false);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isWishlisted,
        recentlyViewed,
        addRecentlyViewed,
        clearRecentlyViewed,
        quickViewProduct,
        setQuickViewProduct,
        orderModalItems,
        openOrderModal,
        closeOrderModal,
        sizeGuideOpen,
        sizeGuideCategory,
        openSizeGuide,
        closeSizeGuide,
        settings,
        refreshSettings: loadSettings,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        activePolicyPage,
        setActivePolicyPage,
        isAdminModalOpen,
        setIsAdminModalOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
