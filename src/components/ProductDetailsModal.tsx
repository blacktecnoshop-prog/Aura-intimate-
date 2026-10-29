import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Heart,
  ShieldCheck,
  Ruler,
  Instagram,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Truck,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { Product } from '../types/store';
import { useCart } from '../context/CartContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectMatchingProduct?: (p: Product) => void;
  allProducts?: Product[];
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onSelectMatchingProduct,
  allProducts = [],
}) => {
  const {
    isWishlisted,
    toggleWishlist,
    openOrderModal,
    openSizeGuide,
    addToCart,
    settings,
    addRecentlyViewed,
    cartCount,
    setIsCartOpen,
    setActivePolicyPage,
  } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
      setActiveImageIndex(0);
      setSelectedColorIndex(0);
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setQuantity(1);
      setAddedFeedback(false);

      // Organic Search & SEO Synchronization
      const originalTitle = document.title;
      const metaDescEl = document.querySelector('meta[name="description"]');
      const originalDesc = metaDescEl?.getAttribute('content') || '';
      const ogTitleEl = document.querySelector('meta[property="og:title"]');
      const ogDescEl = document.querySelector('meta[property="og:description"]');
      const originalOgTitle = ogTitleEl?.getAttribute('content') || '';
      const originalOgDesc = ogDescEl?.getAttribute('content') || '';

      const seoTitle = product.metaTitle || `${product.name} — Luxury Women's Innerwear | ${settings.brandName || 'Aura Intimates'}`;
      const seoDesc = product.metaDescription || product.description || originalDesc;

      document.title = seoTitle;
      if (metaDescEl) metaDescEl.setAttribute('content', seoDesc);
      if (ogTitleEl) ogTitleEl.setAttribute('content', seoTitle);
      if (ogDescEl) ogDescEl.setAttribute('content', seoDesc);

      // Inject Schema.org Product structured data (JSON-LD)
      const scriptId = 'bts-product-ldjson';
      let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.images,
        description: seoDesc,
        sku: product.sku,
        brand: {
          '@type': 'Brand',
          name: settings.brandName || 'Aura Intimates',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: product.sellingPrice,
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      });

      return () => {
        document.title = originalTitle;
        if (metaDescEl) metaDescEl.setAttribute('content', originalDesc);
        if (ogTitleEl) ogTitleEl.setAttribute('content', originalOgTitle);
        if (ogDescEl) ogDescEl.setAttribute('content', originalOgDesc);
        const el = document.getElementById(scriptId);
        if (el) el.remove();
      };
    }
  }, [product, settings.brandName]);

  const selectedColor = useMemo(() => {
    if (!product || !product.colors || product.colors.length === 0) return 'Standard';
    return product.colors[selectedColorIndex]?.name || product.colors[0].name;
  }, [product, selectedColorIndex]);

  // Variant resolution if variants exist
  const currentVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    return product.variants.find(
      (v) => v.color.toLowerCase() === selectedColor.toLowerCase() && v.size === selectedSize
    ) || null;
  }, [product, selectedColor, selectedSize]);

  // Determine stock for selected variant or fallback to general product stock
  const isAvailableInSelectedSize = useMemo(() => {
    if (!product) return false;
    if (currentVariant) {
      return currentVariant.available && currentVariant.stock > 0;
    }
    return product.stock > 0;
  }, [product, currentVariant]);

  const effectiveStock = useMemo(() => {
    if (currentVariant) return currentVariant.stock;
    return product?.stock ?? 0;
  }, [currentVariant, product]);

  const effectivePrice = useMemo(() => {
    if (currentVariant?.priceOverride && currentVariant.priceOverride > 0) {
      return currentVariant.priceOverride;
    }
    return product?.sellingPrice ?? 0;
  }, [currentVariant, product]);

  if (!product) return null;

  const wishlisted = isWishlisted(product.id);
  const currentImage = product.images[activeImageIndex] || product.images[0] || '/images/hero_luxury_innerwear_1792781847179.jpg';

  const handleColorChange = (idx: number) => {
    setSelectedColorIndex(idx);
    const colorObj = product.colors[idx];
    if (colorObj && colorObj.imageIndex !== undefined && product.images[colorObj.imageIndex]) {
      setActiveImageIndex(colorObj.imageIndex);
    }
  };

  const handleOrderInstagram = () => {
    openOrderModal([
      {
        productId: product.id,
        sku: currentVariant?.sku || product.sku,
        productName: product.name,
        color: selectedColor,
        size: selectedSize || 'Standard',
        quantity,
        unitPrice: effectivePrice,
        subtotal: effectivePrice * quantity,
        image: currentImage,
      },
    ]);
  };

  const handleAddToCart = () => {
    if (!isAvailableInSelectedSize) return;
    addToCart(product, selectedColor, selectedSize || 'Standard', quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `${product.name} at ${settings.brandName || 'Aura Intimates'}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }
  };

  const matchingProducts = allProducts.filter((p) =>
    product.matchingProductIds?.includes(p.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-2xl flex flex-col shadow-2xl border-0 sm:border border-[#EDE4DE] overflow-hidden">
        
        {/* Meesho-Inspired Compact Top Header Bar */}
        <div className="px-4 py-3 sm:px-6 border-b border-[#F0EAE7] flex items-center justify-between bg-[#FCFAF8] shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              aria-label="Back"
              className="p-1.5 -ml-1 text-[#2B1220] hover:bg-black/5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="text-xs font-medium sm:hidden">Back</span>
            </button>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72] truncate max-w-[160px] sm:max-w-xs">
              {product.categoryName || 'Innerwear Essentials'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              aria-label="Share product"
              className="p-2 text-[#55464D] hover:text-[#2B1220] hover:bg-black/5 rounded-full transition-colors relative"
              title="Share"
            >
              {shareFeedback ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-black/5 rounded-full transition-colors"
              title={wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
            >
              <Heart
                size={18}
                className={`transition-colors duration-200 ${
                  wishlisted
                    ? 'fill-rose-600 text-rose-600'
                    : 'text-stone-400 hover:text-rose-500 fill-none'
                }`}
              />
            </button>

            <button
              onClick={() => {
                onClose();
                setIsCartOpen(true);
              }}
              aria-label="Cart Bag"
              className="p-2 text-[#55464D] hover:text-[#2B1220] hover:bg-black/5 rounded-full transition-colors relative"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute 1 top-1 right-1 w-4 h-4 bg-[#2B1220] text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="hidden sm:flex p-1.5 text-[#886A72] hover:text-[#2B1220] rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Product Details Content */}
        <div className="flex-1 overflow-y-auto pb-24 sm:pb-8 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
            {/* Gallery Column */}
            <div className="md:col-span-6 space-y-3">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#FAF7F5] border border-[#ECE4DE]">
                <img
                  src={currentImage}
                  alt={product.name}
                  width={600}
                  height={750}
                  className="w-full h-full object-cover object-center transition-all duration-300"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      console.warn(`[Aura Intimates] Gallery image failed: ${target.src}`);
                      target.src = '/images/hero_luxury_innerwear_1792781847179.jpg';
                    }
                  }}
                />

                {product.isSale && product.discountPercent && product.discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-[#2B1220] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-sm">
                    {product.discountPercent}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnails Strip */}
              {product.images && product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeImageIndex === i ? 'border-[#2B1220] ring-1 ring-[#2B1220]' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        width={64}
                        height={80}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = 'true';
                            target.src = '/images/hero_luxury_innerwear_1792781847179.jpg';
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Information & Purchase Module */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Title & SKU */}
                <div>
                  <div className="text-[11px] font-mono text-[#886A72] tracking-wide mb-1">
                    SKU: {currentVariant?.sku || product.sku}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-serif-luxury font-medium text-[#2B1220] leading-snug">
                    {product.name}
                  </h1>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-3 mt-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold text-[#2B1220] font-mono tabular-nums">
                      ₹{effectivePrice.toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && product.originalPrice > effectivePrice && (
                      <span className="text-sm text-[#886A72] line-through font-mono tabular-nums">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    {product.discountPercent && product.discountPercent > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {product.discountPercent}% OFF
                      </span>
                    )}
                    <span className="text-[11px] text-[#886A72] ml-1">
                      (Inclusive of all taxes)
                    </span>
                  </div>

                  {/* Delivery Promise badge */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#55464D] bg-[#FBF7F5] p-2 rounded-lg border border-[#EFE5DF]">
                    <Truck size={14} className="text-[#886A72] shrink-0" />
                    <span>Free discreet courier delivery on orders above ₹999</span>
                  </div>

                  {/* Stock State */}
                  <div className="mt-2 text-xs font-medium">
                    {isAvailableInSelectedSize ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                        In Stock ({effectiveStock} left for selected choice)
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1.5 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                        Out of Stock in this size/colour combination
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#55464D] leading-relaxed">
                  {product.description}
                </p>

                {/* Colour Swatches */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#F0EAE7]">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#2B1220]">
                      <span>Colour: <strong className="font-medium text-[#622D52]">{selectedColor}</strong></span>
                      <span className="text-[11px] text-[#886A72] font-normal">{product.colors.length} choices</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {product.colors.map((c, i) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleColorChange(i)}
                          title={c.name}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            selectedColorIndex === i
                              ? 'border-[#2B1220] bg-[#FAF5F2] font-semibold text-[#2B1220] ring-1 ring-[#2B1220]'
                              : 'border-[#E2D8D2] bg-white text-[#55464D] hover:border-[#886A72]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0 shadow-xs"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#F0EAE7]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#2B1220]">
                        Select Size: <strong className="font-medium text-[#622D52]">{selectedSize || 'Choose size'}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openSizeGuide(product.categoryId)}
                          className="text-xs text-[#886A72] hover:text-[#2B1220] font-medium flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                        >
                          <Ruler size={13} />
                          <span>Quick Guide</span>
                        </button>
                        <span className="text-[#DED4CE]">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setActivePolicyPage('size-guide');
                            if (typeof window !== 'undefined') {
                              window.history.pushState(null, '', '/size-guide');
                            }
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs text-[#622D52] hover:text-[#2B1220] font-semibold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                        >
                          <span>Full Size Guide Page →</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        // Check variant stock for this specific size with current color
                        let isVariantAvailable = true;
                        if (product.variants && product.variants.length > 0) {
                          const v = product.variants.find(
                            (item) => item.color.toLowerCase() === selectedColor.toLowerCase() && item.size === sz
                          );
                          if (v) {
                            isVariantAvailable = v.available && v.stock > 0;
                          }
                        }

                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`min-w-12 py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-[#2B1220] text-white border-[#2B1220] shadow-sm'
                                : isVariantAvailable
                                ? 'bg-white text-[#2B1220] border-[#DED4CE] hover:border-[#886A72]'
                                : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
                            }`}
                            title={!isVariantAvailable ? 'Currently out of stock' : sz}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 pt-2 border-t border-[#F0EAE7]">
                  <span className="text-xs font-semibold text-[#2B1220]">Quantity:</span>
                  <div className="flex items-center border border-[#DED4CE] rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-2 text-[#55464D] hover:text-[#2B1220] disabled:opacity-30 cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-10 text-center text-xs font-semibold font-mono tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(effectiveStock || 99, quantity + 1))}
                      disabled={quantity >= effectiveStock}
                      className="p-2 text-[#55464D] hover:text-[#2B1220] disabled:opacity-30 cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="text-[11px] text-[#886A72]">
                    Subtotal: <strong className="font-mono text-[#2B1220]">₹{(effectivePrice * quantity).toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                {/* Desktop Buttons (Visible on desktop screen) */}
                <div className="hidden sm:block space-y-2.5 pt-3">
                  <button
                    type="button"
                    onClick={handleOrderInstagram}
                    className="w-full py-3.5 px-4 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Instagram size={17} />
                    <span>Order via Instagram DM (Concierge Booking)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!isAvailableInSelectedSize}
                    className="w-full py-2.5 px-3 bg-white hover:bg-[#FAF5F2] text-[#2B1220] border border-[#D8CDC7] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {addedFeedback ? <Check size={15} className="text-emerald-600" /> : <ShoppingBag size={15} />}
                    <span>{addedFeedback ? 'Added to Bag!' : 'Add to Bag'}</span>
                  </button>
                </div>

                {/* Fabric & Care & Hygiene Details */}
                <div className="space-y-3 pt-3 text-xs text-[#55464D]">
                  <div className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                    <div className="font-semibold text-[#2B1220]">Fabric Composition & Care:</div>
                    <p className="text-[11px] text-[#6E5D65] leading-relaxed">{product.fabricAndCare}</p>
                  </div>

                  <div className="p-3 bg-[#FDF9F8] rounded-xl border border-[#F0DFDC] space-y-1">
                    <div className="font-semibold text-[#2B1220] flex items-center gap-1">
                      <ShieldCheck size={14} className="text-[#886A72]" />
                      <span>100% Discreet Packaging & Sanitary Hygiene Policy:</span>
                    </div>
                    <p className="text-[11px] text-[#6E5D65] leading-relaxed">
                      {product.hygieneNotice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matching / Related Products Section */}
          {matchingProducts.length > 0 && (
            <div className="pt-6 border-t border-[#EFE8E5] space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#886A72]">
                Complete the Look (Matching Essentials)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {matchingProducts.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => onSelectMatchingProduct && onSelectMatchingProduct(match)}
                    className="p-2.5 rounded-xl bg-[#FAF7F5] hover:bg-[#F3ECE7] cursor-pointer transition-colors border border-[#ECE4DF]"
                  >
                    <img
                      src={match.images[0]}
                      alt={match.name}
                      className="w-full aspect-[4/5] object-cover rounded-lg bg-white"
                    />
                    <div className="mt-2 text-xs font-medium text-[#2B1220] truncate">{match.name}</div>
                    <div className="text-xs font-mono font-semibold text-[#886A72]">₹{match.sellingPrice.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Meesho-Inspired Sticky Bottom Action Bar on Mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-[#EFE8E5] shadow-lg flex items-center gap-2.5 z-20">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[10px] text-[#886A72]">Total Price</span>
            <span className="text-base font-bold font-mono text-[#2B1220] truncate">
              ₹{(effectivePrice * quantity).toLocaleString('en-IN')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailableInSelectedSize}
            className="p-3 bg-white text-[#2B1220] border border-[#D8CDC7] rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 disabled:opacity-40"
            title="Add to Bag"
          >
            {addedFeedback ? <Check size={18} className="text-emerald-600" /> : <ShoppingBag size={18} />}
          </button>

          <button
            type="button"
            onClick={handleOrderInstagram}
            className="flex-1 py-3 px-3 bg-[#2B1220] active:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer truncate"
          >
            <Instagram size={15} className="shrink-0" />
            <span className="truncate">Order via Instagram</span>
          </button>
        </div>

      </div>
    </div>
  );
};
