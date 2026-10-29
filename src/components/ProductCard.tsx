import React, { useState, useEffect, useRef } from 'react';
import { Heart, Eye, ShoppingBag } from 'lucide-react';
import { Product } from '../types/store';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct, index = 0 }) => {
  const { isWishlisted, toggleWishlist, setQuickViewProduct, openOrderModal, addRecentlyViewed } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Accessibility check: immediately show if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    const el = cardRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, []);

  const wishlisted = isWishlisted(product.id);
  const primaryImage = product.images[activeImageIndex] || product.images[0] || '/images/hero_luxury_innerwear_1792781847179.jpg';
  const secondaryImage = product.images[1] || primaryImage;

  const handleColorHover = (colorIndex: number) => {
    setSelectedColorIndex(colorIndex);
    const colorObj = product.colors[colorIndex];
    if (colorObj && colorObj.imageIndex !== undefined && product.images[colorObj.imageIndex]) {
      setActiveImageIndex(colorObj.imageIndex);
    }
  };

  const handleDirectInstagramOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const chosenColor = product.colors[selectedColorIndex]?.name || product.colors[0]?.name || 'Standard';
    const chosenSize = product.sizes[0] || 'Standard';
    openOrderModal([
      {
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        color: chosenColor,
        size: chosenSize,
        quantity: 1,
        unitPrice: product.sellingPrice,
        subtotal: product.sellingPrice,
        image: primaryImage,
      },
    ]);
  };

  const activeColorName = product.colors[selectedColorIndex]?.name || '';
  const computedAltText = product.imageAlt || `${product.name}${activeColorName ? ` in ${activeColorName}` : ''} - ${product.categoryName || "Women's Innerwear"}`;

  return (
    <article
      ref={cardRef}
      style={{
        transitionDelay: isVisible ? `${(index % 4) * 60}ms` : '0ms',
      }}
      className={`group rounded-xl bg-white border border-[#EFE8E5] hover:border-[#D6BEBE] hover:shadow-lg flex flex-col overflow-hidden relative transform-gpu transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-5 scale-[0.98]'
      }`}
    >
      {/* Visual Image Container with Crawler-Friendly Deep Link */}
      <a
        href={`/product/${product.id}`}
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            onSelectProduct(product);
          }
        }}
        aria-label={`View details for ${product.name}`}
        className="block relative aspect-[4/5] bg-[#FAF7F5] overflow-hidden cursor-pointer"
      >
        {/* Main Image with secondary hover fade */}
        <img
          src={primaryImage}
          alt={computedAltText}
          width={400}
          height={500}
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.dataset.fallbackApplied) {
              target.dataset.fallbackApplied = 'true';
              console.warn(`[Aura Intimates] Product image failed to load: ${target.src}`);
              target.src = '/images/hero_luxury_innerwear_1792781847179.jpg';
            }
          }}
        />

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all z-10 text-stone-400 hover:text-rose-600"
        >
          <Heart
            size={16}
            className={`transition-colors duration-200 ${
              wishlisted
                ? 'fill-rose-600 text-rose-600'
                : 'text-stone-400 hover:text-rose-500 fill-none'
            }`}
          />
        </button>

        {/* Genuine Badge Indicator (e.g. Sale, New Arrival) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.isSale && product.discountPercent && (
            <span className="text-[10px] font-semibold tracking-wider uppercase bg-[#2B1220] text-white px-2 py-0.5 rounded shadow-sm">
              {product.discountPercent}% Off
            </span>
          )}
          {product.newArrival && (
            <span className="text-[10px] font-medium tracking-wider uppercase bg-[#FAF5F2] text-[#552743] border border-[#E6D4D1] px-2 py-0.5 rounded shadow-sm">
              New
            </span>
          )}
        </div>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addRecentlyViewed(product.id);
              setQuickViewProduct(product);
            }}
            className="flex-1 py-2 px-3 bg-white/95 hover:bg-white text-[#2B1220] text-xs font-medium rounded shadow-sm flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors"
          >
            <Eye size={13} />
            <span>Quick View</span>
          </button>
          <button
            type="button"
            onClick={handleDirectInstagramOrder}
            title="Order via Instagram"
            className="py-2 px-3 bg-[#2B1220] hover:bg-[#49203C] text-white text-xs font-medium rounded shadow-sm flex items-center justify-center gap-1 transition-colors"
          >
            <ShoppingBag size={13} />
            <span className="hidden sm:inline">Order DM</span>
          </button>
        </div>
      </a>

      {/* Product Details Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category kicker */}
          <div className="text-[11px] font-medium text-[#886A72] tracking-wider uppercase">
            {product.categoryName || 'Innerwear'}
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-medium text-[#2B1220] group-hover:text-[#622D52] transition-colors mt-0.5 line-clamp-1">
            <a
              href={`/product/${product.id}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                  e.preventDefault();
                  onSelectProduct(product);
                }
              }}
              className="hover:underline focus:outline-none focus:ring-1 focus:ring-[#8B6B75] rounded"
            >
              {product.name}
            </a>
          </h3>

          {/* Pricing with genuine discount if available */}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-sm font-semibold text-[#2B1220] font-mono tabular-nums">
              ₹{product.sellingPrice.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.sellingPrice && (
              <span className="text-xs text-[#886A72] line-through font-mono tabular-nums">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Swatches & Sizes Row */}
        <div className="space-y-2 pt-1 border-t border-[#F5EFEA]">
          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {product.colors.slice(0, 4).map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onMouseEnter={() => handleColorHover(i)}
                  onClick={() => handleColorHover(i)}
                  title={c.name}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedColorIndex === i ? 'ring-2 ring-offset-1 ring-[#2B1220]' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-[#886A72]">+{product.colors.length - 4}</span>
              )}
            </div>
          )}

          {/* Available Sizes List */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="flex items-center gap-1 overflow-hidden text-[10px] text-[#6E5D65]">
              <span className="text-[#886A72] shrink-0">Sizes:</span>
              <span className="truncate font-mono">
                {product.sizes.join(' · ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
