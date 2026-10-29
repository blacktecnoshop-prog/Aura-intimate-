import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, History, Trash2, Heart, Eye } from 'lucide-react';
import { Product } from '../types/store';
import { useCart } from '../context/CartContext';

interface RecentlyViewedProps {
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ allProducts, onSelectProduct }) => {
  const { recentlyViewed, clearRecentlyViewed, isWishlisted, toggleWishlist, setQuickViewProduct, addRecentlyViewed } = useCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Map recently viewed IDs to full product objects preserving order
  const viewedProducts = recentlyViewed
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  if (viewedProducts.length === 0) {
    return null; // Don't take space if no items viewed yet
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleCardClick = (product: Product) => {
    addRecentlyViewed(product.id);
    onSelectProduct(product);
  };

  return (
    <section className="py-10 lg:py-14 bg-white border-t border-[#EFE8E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Scroll Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF5F2] text-[#3D1E2F] flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif-luxury font-medium text-[#2B1220]">
                Recently Viewed
              </h2>
              <p className="text-xs text-[#886A72]">
                Items you previously explored during your visit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearRecentlyViewed}
              className="text-xs text-[#886A72] hover:text-rose-600 transition-colors flex items-center gap-1 mr-2 px-2 py-1 rounded"
              title="Clear recently viewed history"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full border border-[#DED4CE] bg-white text-[#2B1220] hover:bg-[#FAF7F5] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full border border-[#DED4CE] bg-white text-[#2B1220] hover:bg-[#FAF7F5] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {viewedProducts.map((prod) => {
            const wishlisted = isWishlisted(prod.id);
            const image = prod.images[0] || '/images/hero_luxury_innerwear_1792781847179.jpg';

            return (
              <div
                key={prod.id}
                onClick={() => handleCardClick(prod)}
                className="w-56 sm:w-64 shrink-0 snap-start rounded-xl bg-white border border-[#EDE4DE] hover:border-[#D6BEBE] transition-all hover:shadow-md cursor-pointer flex flex-col overflow-hidden group"
              >
                {/* Image Viewport */}
                <div className="relative aspect-[4/5] bg-[#FAF7F5] overflow-hidden">
                  <img
                    src={image}
                    alt={prod.name}
                    width={256}
                    height={320}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.dataset.fallbackApplied) {
                        target.dataset.fallbackApplied = 'true';
                        console.warn(`[Aura Intimates] Recently viewed image failed: ${target.src}`);
                        target.src = '/images/hero_luxury_innerwear_1792781847179.jpg';
                      }
                    }}
                  />

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(prod.id);
                    }}
                    aria-label="Wishlist"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all text-stone-400 hover:text-rose-600"
                  >
                    <Heart
                      size={14}
                      className={`transition-colors duration-200 ${
                        wishlisted
                          ? 'fill-rose-600 text-rose-600'
                          : 'text-stone-400 hover:text-rose-500 fill-none'
                      }`}
                    />
                  </button>

                  {/* Quick View Button on Hover */}
                  <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addRecentlyViewed(prod.id);
                        setQuickViewProduct(prod);
                      }}
                      className="w-full py-1.5 bg-white/95 hover:bg-white text-[#2B1220] text-xs font-medium rounded shadow-sm flex items-center justify-center gap-1 backdrop-blur-xs transition-colors"
                    >
                      <Eye size={12} />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#886A72] tracking-wider">
                      {prod.categoryName || 'Innerwear'}
                    </span>
                    <h3 className="text-xs font-medium text-[#2B1220] group-hover:text-[#622D52] transition-colors line-clamp-1 mt-0.5">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-xs font-semibold text-[#2B1220] font-mono tabular-nums">
                      ₹{prod.sellingPrice.toLocaleString('en-IN')}
                    </span>
                    {prod.originalPrice && prod.originalPrice > prod.sellingPrice && (
                      <span className="text-[10px] text-[#886A72] line-through font-mono tabular-nums">
                        ₹{prod.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
