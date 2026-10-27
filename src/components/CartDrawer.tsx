import React from 'react';
import { X, Trash2, Plus, Minus, Instagram, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    openOrderModal,
    settings,
  } = useCart();

  if (!isCartOpen) return null;

  const freeThreshold = settings.freeShippingThreshold || 999;
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeThreshold) * 100));
  const diffToFree = freeThreshold - cartSubtotal;

  const handleCheckoutViaInstagram = () => {
    if (cart.length === 0) return;

    const items = cart.map((c) => ({
      productId: c.product.id,
      sku: c.product.sku,
      productName: c.product.name,
      color: c.selectedColor,
      size: c.selectedSize,
      quantity: c.quantity,
      unitPrice: c.product.sellingPrice,
      subtotal: c.product.sellingPrice * c.quantity,
      image: c.product.images[0],
    }));

    setIsCartOpen(false);
    openOrderModal(items);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-[#EDE4DE]">
          {/* Header */}
          <div className="p-5 border-b border-[#F0EAE7] flex items-center justify-between bg-[#FCFAF8]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#3D1E2F]" />
              <h2 className="text-sm font-semibold text-[#2B1220] uppercase tracking-wider">
                Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              aria-label="Close cart"
              className="p-1.5 text-[#886A72] hover:text-[#2B1220] rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#FAF7F5] px-5 py-3 border-b border-[#EFE8E5] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#55464D]">
                {diffToFree <= 0 ? (
                  <strong className="text-emerald-700">Congratulations! You unlocked Free Discreet Shipping</strong>
                ) : (
                  <span>
                    Add <strong className="font-mono text-[#2B1220]">₹{diffToFree}</strong> more for Free Shipping
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#886A72]">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-[#E8DDD7] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2B1220] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF5F2] text-[#886A72] flex items-center justify-center">
                  <ShoppingBag size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-[#2B1220]">Your bag is empty</h3>
                <p className="text-xs text-[#886A72] max-w-xs">
                  Discover our cloud-soft bras, mulberry silk knickers, and sensual lace sets.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-6 py-2 bg-[#2B1220] text-white text-xs font-semibold rounded-md shadow-sm hover:bg-[#3D1E2F] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 p-3 rounded-xl border border-[#EDE5DF] bg-[#FAF7F5]"
                >
                  <img
                    src={item.product.images[0] || '/images/hero_luxury_innerwear_1792781847179.jpg'}
                    alt={item.product.name}
                    width={64}
                    height={80}
                    className="w-16 h-20 object-cover rounded-lg bg-white shrink-0 border border-[#E5DDD7]"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.dataset.fallbackApplied) {
                        target.dataset.fallbackApplied = 'true';
                        target.src = '/images/hero_luxury_innerwear_1792781847179.jpg';
                      }
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-[#2B1220] truncate">
                      {item.product.name}
                    </h4>

                    <div className="text-[11px] text-[#6E5D65] flex items-center gap-2 mt-0.5">
                      <span>Colour: <strong className="text-[#2B1220]">{item.selectedColor}</strong></span>
                      <span>·</span>
                      <span>Size: <strong className="text-[#2B1220]">{item.selectedSize}</strong></span>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-[#DED4CE] rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-[#55464D] hover:text-[#2B1220]"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-7 text-center text-xs font-mono font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-[#55464D] hover:text-[#2B1220]"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-[#2B1220] font-mono tabular-nums">
                          ₹{(item.product.sellingPrice * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    className="p-1 text-[#886A72] hover:text-rose-600 transition-colors self-start"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#F0EAE7] bg-[#FCFAF8] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#55464D]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#2B1220] font-mono tabular-nums">
                    ₹{cartSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#55464D]">
                  <span>Estimated Shipping</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    {diffToFree <= 0 ? 'FREE' : `₹${settings.shippingFee}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-[#EFE8E5]">
                  <span className="font-bold text-[#2B1220]">Estimated Total</span>
                  <span className="font-bold text-[#2B1220] font-mono tabular-nums text-base">
                    ₹{(cartSubtotal + (diffToFree <= 0 ? 0 : settings.shippingFee)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutViaInstagram}
                className="w-full py-3.5 px-4 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs sm:text-sm font-semibold rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Instagram size={16} />
                <span>Order Bag via Instagram DM</span>
                <ArrowRight size={14} />
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#886A72] pt-1">
                <span>100% Discreet Billing & Packaging</span>
                <button
                  onClick={clearCart}
                  className="hover:text-rose-600 transition-colors"
                >
                  Clear Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
