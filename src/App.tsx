import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category } from './types/store';
import { fetchProducts, fetchCategories } from './services/api';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { InstagramOrderModal } from './components/InstagramOrderModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { SizeGuidePage } from './components/SizeGuidePage';
import { CartDrawer } from './components/CartDrawer';
import { FilterDrawer, FilterState } from './components/FilterDrawer';
import { PolicyPages } from './components/PolicyPages';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RecentlyViewed } from './components/RecentlyViewed';
import { NewsletterSubscription } from './components/NewsletterSubscription';
import { Footer } from './components/Footer';
import { SEOManager } from './components/SEOManager';
import {
  Sparkles,
  SlidersHorizontal,
  Instagram,
  ShieldCheck,
  PackageCheck,
  Heart,
  ArrowRight,
  Filter as FilterIcon
} from 'lucide-react';

const initialFilterState: FilterState = {
  categoryId: 'all',
  minPrice: 0,
  maxPrice: 5000,
  colors: [],
  sizes: [],
  inStockOnly: false,
  saleOnly: false,
};

const StoreContent: React.FC = () => {
  const {
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    activePolicyPage,
    setActivePolicyPage,
    quickViewProduct,
    setQuickViewProduct,
    settings,
    openSizeGuide,
    isAdminModalOpen,
    setIsAdminModalOpen,
    addRecentlyViewed,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected product for detailed modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productNotFound, setProductNotFound] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('featured');

  // Filter collections tab
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<'all' | 'bestsellers' | 'new' | 'matching' | 'sale'>('all');

  // Rich Filter Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts({ sort: sortBy }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load catalog. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sortBy]);

  // URL Deep-linking & History state synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromUrl = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const search = searchParams.get('search');
      if (search) {
        setSearchQuery(search);
      }

      if (path.startsWith('/product/')) {
        const prodId = decodeURIComponent(path.replace('/product/', '').trim());
        if (prodId) {
          const found = products.find((p) => p.id === prodId);
          if (found) {
            setSelectedProduct(found);
            setProductNotFound(null);
          } else if (!loading && products.length > 0) {
            setProductNotFound(prodId);
            setSelectedProduct(null);
          }
        }
      } else if (path.startsWith('/category/')) {
        const catSlug = decodeURIComponent(path.replace('/category/', '').trim());
        setActiveCategory(catSlug);
        setActivePolicyPage(null);
        setSelectedProduct(null);
        setProductNotFound(null);
      } else if (path.startsWith('/policy/')) {
        const policy = decodeURIComponent(path.replace('/policy/', '').trim());
        setActivePolicyPage(policy);
        setSelectedProduct(null);
        setProductNotFound(null);
      } else if (path === '/about') {
        setActivePolicyPage('about');
        setSelectedProduct(null);
        setProductNotFound(null);
      } else if (path === '/contact') {
        setActivePolicyPage('contact');
        setSelectedProduct(null);
        setProductNotFound(null);
      } else if (path === '/size-guide') {
        setActivePolicyPage('size-guide');
        setSelectedProduct(null);
        setProductNotFound(null);
      } else if (path === '/') {
        setSelectedProduct(null);
        setProductNotFound(null);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [products, loading]);

  const navigateToProduct = (p: Product) => {
    addRecentlyViewed(p.id);
    setSelectedProduct(p);
    setProductNotFound(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/product/${p.id}`);
    }
  };

  const handleCloseProductModal = () => {
    setSelectedProduct(null);
    setQuickViewProduct(null);
    setProductNotFound(null);
    if (typeof window !== 'undefined') {
      if (activeCategory && activeCategory !== 'all') {
        window.history.pushState(null, '', `/category/${activeCategory}`);
      } else {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const navigateToCategory = (catSlug: string) => {
    setActivePolicyPage(null);
    setActiveCategory(catSlug);
    setSelectedProduct(null);
    setProductNotFound(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', catSlug === 'all' ? '/' : `/category/${catSlug}`);
    }
  };

  // Extract available colors and sizes from loaded products
  const availableColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      p.colors?.forEach((c) => {
        if (!map.has(c.name)) map.set(c.name, c.hex);
      });
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.sizes?.forEach((s) => set.add(s));
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchCat = p.categoryName?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchSku && !matchCat) return false;
      }

      // 2. Nav Active Category
      if (activeCategory !== 'all') {
        if (activeCategory === 'sale') {
          if (!p.isSale) return false;
        } else if (p.categoryId !== activeCategory && p.categoryName?.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Collection Tabs Filter
      if (activeCollectionFilter === 'bestsellers' && !p.featured) return false;
      if (activeCollectionFilter === 'new' && !p.newArrival) return false;
      if (activeCollectionFilter === 'matching' && p.categoryId !== 'matching-sets') return false;
      if (activeCollectionFilter === 'sale' && !p.isSale) return false;

      // 4. Drawer Filter: Category
      if (filterState.categoryId !== 'all' && p.categoryId !== filterState.categoryId) {
        return false;
      }

      // 5. Drawer Filter: Price
      if (p.sellingPrice < filterState.minPrice || p.sellingPrice > filterState.maxPrice) {
        return false;
      }

      // 6. Drawer Filter: Colors
      if (filterState.colors.length > 0) {
        const hasColor = p.colors?.some((c) => filterState.colors.includes(c.name));
        if (!hasColor) return false;
      }

      // 7. Drawer Filter: Sizes
      if (filterState.sizes.length > 0) {
        const hasSize = p.sizes?.some((s) => filterState.sizes.includes(s));
        if (!hasSize) return false;
      }

      // 8. Drawer Filter: In Stock Only
      if (filterState.inStockOnly && p.stock <= 0) {
        return false;
      }

      // 9. Drawer Filter: Sale Only
      if (filterState.saleOnly && !p.isSale) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, activeCategory, activeCollectionFilter, filterState]);

  const activeFilterCount =
    (filterState.categoryId !== 'all' ? 1 : 0) +
    (filterState.minPrice > 0 || filterState.maxPrice < 5000 ? 1 : 0) +
    filterState.colors.length +
    filterState.sizes.length +
    (filterState.inStockOnly ? 1 : 0) +
    (filterState.saleOnly ? 1 : 0);

  const resetAllFilters = () => {
    setFilterState(initialFilterState);
    setActiveCategory('all');
    setActiveCollectionFilter('all');
    setSearchQuery('');
  };

  const currentCategory = categories.find((c) => c.slug === activeCategory || c.id === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCFA] text-[#2B1220]">
      {/* Dynamic Client-Side SEO Engine & Schema.org Structured Data */}
      <SEOManager
        product={selectedProduct || quickViewProduct}
        activeCategory={activeCategory}
        activePolicyPage={activePolicyPage}
        sizeGuideOpen={false}
        settings={settings}
        categories={categories}
      />

      {/* Primary Header */}
      <Header onOpenAdmin={() => setIsAdminModalOpen(true)} />

      {/* Main Body */}
      <main className="flex-1">
        {/* If user requested a direct product URL that does not exist */}
        {productNotFound && (
          <div className="py-16 text-center max-w-lg mx-auto px-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center">
              <PackageCheck size={28} />
            </div>
            <h1 className="text-2xl font-serif-luxury font-medium text-[#2B1220]">Product Not Found</h1>
            <p className="text-xs text-[#6E5D65]">
              The innerwear item you requested (<code className="font-mono text-[#2B1220] font-semibold">{productNotFound}</code>) is currently unavailable, out of stock, or archived.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setProductNotFound(null);
                  if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
                }}
                className="px-6 py-2.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Browse Available Catalogue
              </button>
            </div>
          </div>
        )}

        {/* If user is viewing a Policy or Info Page */}
        {activePolicyPage === 'size-guide' ? (
          <SizeGuidePage
            onBackToShop={() => {
              setActivePolicyPage(null);
              if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onFilterBySize={(size) => {
              setFilterState({ ...filterState, sizes: [size] });
              setActivePolicyPage(null);
              if (typeof window !== 'undefined') window.history.pushState(null, '', '/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : activePolicyPage ? (
          <PolicyPages page={activePolicyPage} onBack={() => setActivePolicyPage(null)} />
        ) : (
          /* Normal Storefront Homepage */
          <>
            {/* Hero Section */}
            <HeroBanner />

            {/* Dynamic Shop by Category Grid */}
            {categories.length > 0 && <CategoryGrid categories={categories} />}

            {/* Main Product Catalog Section */}
            <section id="catalog-section" className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Collection Header & Filter Tabs */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  {activeCategory !== 'all' ? (
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#886A72] mb-1">
                      <button
                        onClick={() => navigateToCategory('all')}
                        className="hover:text-[#2B1220] underline transition-colors cursor-pointer"
                      >
                        All Collections
                      </button>
                      <span>/</span>
                      <span className="text-[#2B1220] font-semibold">{currentCategory?.name || 'Category'}</span>
                    </nav>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#886A72]">
                      Curated Intimates
                    </span>
                  )}

                  <h2 className="text-2xl sm:text-3xl font-serif-luxury font-medium text-[#2B1220] mt-1">
                    {searchQuery
                      ? `Search Results for "${searchQuery}"`
                      : currentCategory
                      ? currentCategory.name
                      : 'The Everyday Collection'}
                  </h2>

                  {currentCategory?.description && !searchQuery && (
                    <p className="text-xs sm:text-sm text-[#6E5D65] mt-1.5 max-w-xl leading-relaxed">
                      {currentCategory.description}
                    </p>
                  )}
                </div>

                {/* Controls: Segmented Filter Buttons & Drawer Toggle & Sort */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Segmented Filter Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-[#F5EFEA] rounded-lg text-xs font-medium">
                    <button
                      onClick={() => {
                        setActiveCollectionFilter('all');
                        setActiveCategory('all');
                      }}
                      className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        activeCollectionFilter === 'all' && activeCategory === 'all'
                          ? 'bg-white text-[#2B1220] shadow-sm font-semibold'
                          : 'text-[#6E5D65] hover:text-[#2B1220]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveCollectionFilter('bestsellers')}
                      className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        activeCollectionFilter === 'bestsellers'
                          ? 'bg-white text-[#2B1220] shadow-sm font-semibold'
                          : 'text-[#6E5D65] hover:text-[#2B1220]'
                      }`}
                    >
                      Best Sellers
                    </button>
                    <button
                      onClick={() => setActiveCollectionFilter('new')}
                      className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        activeCollectionFilter === 'new'
                          ? 'bg-white text-[#2B1220] shadow-sm font-semibold'
                          : 'text-[#6E5D65] hover:text-[#2B1220]'
                      }`}
                    >
                      New Arrivals
                    </button>
                    <button
                      onClick={() => setActiveCollectionFilter('sale')}
                      className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        activeCollectionFilter === 'sale'
                          ? 'bg-white text-[#2B1220] shadow-sm font-semibold'
                          : 'text-[#6E5D65] hover:text-[#2B1220]'
                      }`}
                    >
                      Sale
                    </button>
                  </div>

                  {/* Filter Bottom Sheet Trigger */}
                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-[#2B1220] bg-white border border-[#EDE4DE] hover:border-[#2B1220] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <FilterIcon size={13} />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#2B1220] text-white text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Sort Selector */}
                  <div className="flex items-center gap-1.5 text-xs text-[#6E5D65] bg-white border border-[#EDE4DE] px-3 py-1.5 rounded-lg">
                    <SlidersHorizontal size={13} />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-0 outline-none text-[#2B1220] cursor-pointer"
                    >
                      <option value="featured">Featured First</option>
                      <option value="newest">Newest Designs</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Search / Category Indicator */}
              {(searchQuery || activeCategory !== 'all' || activeFilterCount > 0) && (
                <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-[#55464D]">
                  <span>Applied criteria:</span>
                  {activeCategory !== 'all' && (
                    <span className="font-semibold text-[#2B1220] bg-[#FAF5F2] px-2 py-0.5 rounded border border-[#EDE4DE]">
                      Category: {categories.find((c) => c.slug === activeCategory || c.id === activeCategory)?.name || activeCategory}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="font-semibold text-[#2B1220] bg-[#FAF5F2] px-2 py-0.5 rounded border border-[#EDE4DE]">
                      Keyword: "{searchQuery}"
                    </span>
                  )}
                  {filterState.colors.length > 0 && (
                    <span className="font-semibold text-[#2B1220] bg-[#FAF5F2] px-2 py-0.5 rounded border border-[#EDE4DE]">
                      Colours: {filterState.colors.join(', ')}
                    </span>
                  )}
                  {filterState.sizes.length > 0 && (
                    <span className="font-semibold text-[#2B1220] bg-[#FAF5F2] px-2 py-0.5 rounded border border-[#EDE4DE]">
                      Sizes: {filterState.sizes.join(', ')}
                    </span>
                  )}
                  <button
                    onClick={resetAllFilters}
                    className="ml-2 text-[#886A72] hover:text-[#2B1220] underline cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="rounded-xl border border-[#EFE8E5] bg-white p-4 space-y-3 animate-pulse">
                      <div className="aspect-[4/5] bg-[#F5EFEA] rounded-lg" />
                      <div className="h-4 bg-[#F5EFEA] rounded w-3/4" />
                      <div className="h-3 bg-[#F5EFEA] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-[#EDE4DE] p-8 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-full bg-[#FAF5F2] text-[#886A72] mx-auto flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-[#2B1220]">No items match your criteria</h3>
                  <p className="text-xs text-[#6E5D65]">
                    Try adjusting your filters or browse our full catalogue of everyday essentials.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="mt-2 px-5 py-2 bg-[#2B1220] text-white text-xs font-semibold rounded-md shadow-sm hover:bg-[#3D1E2F] transition-colors cursor-pointer"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map((prod, idx) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      index={idx}
                      onSelectProduct={(p) => {
                        navigateToProduct(p);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Recently Viewed Horizontal Scroll Section (persisted in localStorage) */}
            <RecentlyViewed
              allProducts={products}
              onSelectProduct={(p) => {
                navigateToProduct(p);
              }}
            />

            {/* Why Shop With Us Section (Claim-to-Proof Adjacency) */}
            <section className="py-14 bg-[#FAF7F5] border-y border-[#EFE8E5]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#886A72]">
                    The {settings.brandName || 'Aura Intimates'} Difference
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif-luxury font-medium text-[#2B1220]">
                    Why Discerning Women Choose Us
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6E5D65]">
                    Thoughtfully crafted innerwear with total confidentiality from consultation to delivery.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#2B1220]">100% Discreet Packaging</h3>
                    <p className="text-xs text-[#6E5D65] leading-relaxed">
                      Every parcel is delivered in an unmarked, plain exterior box or opaque flyer. No product descriptions or intimate logos appear anywhere on the courier package.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center">
                      <PackageCheck size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#2B1220]">Sanitary Hygiene Integrity</h3>
                    <p className="text-xs text-[#6E5D65] leading-relaxed">
                      All knickers and intimate sets feature untouched protective hygiene liner seals. You are guaranteed fresh, pristine garments directly from our sanitised facility.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center">
                      <Heart size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-[#2B1220]">Confidential Sizing Concierge</h3>
                    <p className="text-xs text-[#6E5D65] leading-relaxed">
                      Our fit specialists assist you one-on-one via Instagram Direct Message. Share your measurements privately to ensure a bespoke-like bra and panty fit.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Instagram Contact & Booking Feature Section */}
            <section className="py-14 sm:py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-gradient-to-br from-[#2B1220] via-[#35172B] to-[#49203C] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl">
                  {/* Subtle Background Pattern */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                  <div className="max-w-2xl space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#EED0C9] text-xs font-medium backdrop-blur-xs">
                      <Instagram size={14} />
                      <span>Direct Boutique Ordering Channel</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-luxury font-medium leading-tight">
                      Order Directly on Instagram: <br />
                      <span className="text-[#EED0C9]">{settings.instagramHandle}</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#FAF0ED]/90 leading-relaxed max-w-xl">
                      Experience personalized boutique shopping without impersonal checkouts. Select your preferred color and size, click "Order via Instagram", and send your order details straight to our Direct Message. We verify fit, arrange secure payment, and dispatch promptly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                      <a
                        href={settings.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3.5 bg-white hover:bg-[#FAF0ED] text-[#2B1220] text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Instagram size={16} />
                        <span>Open {settings.instagramHandle} Profile</span>
                        <ArrowRight size={14} />
                      </a>

                      <button
                        onClick={() => openSizeGuide()}
                        className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Check Fit Calculator</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Newsletter Subscription */}
      <NewsletterSubscription />

      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <ProductDetailsModal
        product={selectedProduct || quickViewProduct}
        onClose={handleCloseProductModal}
        onSelectMatchingProduct={(match) => {
          navigateToProduct(match);
        }}
        allProducts={products}
      />

      <InstagramOrderModal />

      <SizeGuideModal />

      <CartDrawer />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filterState}
        onFilterChange={setFilterState}
        categories={categories}
        availableColors={availableColors}
        availableSizes={availableSizes}
        totalMatches={filteredProducts.length}
        onReset={() => setFilterState(initialFilterState)}
      />

      <AdminDashboard
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        products={products}
        categories={categories}
        onRefreshData={loadData}
      />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <StoreContent />
    </CartProvider>
  );
}
