import React, { useState } from 'react';
import { X, Copy, Check, Instagram, AlertCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { logOrderEnquiry } from '../services/api';

export const InstagramOrderModal: React.FC = () => {
  const { orderModalItems, closeOrderModal, settings } = useCart();
  const [copied, setCopied] = useState(false);

  if (!orderModalItems || orderModalItems.length === 0) return null;

  const isMultiItem = orderModalItems.length > 1;
  const overallSubtotal = orderModalItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Generate suggested order message adhering exactly to specification
  const generateOrderMessage = () => {
    const brand = settings.brandName || 'Aura Intimates';
    if (!isMultiItem) {
      const item = orderModalItems[0];
      return `Hello! I would like to place an order from ${brand}.

Product: ${item.productName}
Product ID: ${item.sku || item.productId}
Colour: ${item.color}
Size: ${item.size}
Quantity: ${item.quantity}
Unit Price: ₹${item.unitPrice.toLocaleString('en-IN')}
Subtotal: ₹${item.subtotal.toLocaleString('en-IN')}

Please confirm sizing availability, shipping charges, and delivery details.`;
    }

    // Consolidated message for multiple items from cart
    const itemsText = orderModalItems
      .map(
        (it, idx) =>
          `Item ${idx + 1}: ${it.productName} (ID: ${it.sku || it.productId})
 - Colour: ${it.color} | Size: ${it.size} | Qty: ${it.quantity}
 - Price: ₹${it.unitPrice.toLocaleString('en-IN')} each (₹${it.subtotal.toLocaleString('en-IN')})`
      )
      .join('\n\n');

    return `Hello! I would like to place an order from ${brand}.

${itemsText}

Total Estimated Items: ${orderModalItems.reduce((acc, i) => acc + i.quantity, 0)}
Total Subtotal: ₹${overallSubtotal.toLocaleString('en-IN')}

Please confirm sizing availability, shipping charges, and delivery details.`;
  };

  const formattedMessage = generateOrderMessage();

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      // Log enquiry on server for owner dashboard
      logOrderEnquiry({
        items: orderModalItems,
        subtotal: overallSubtotal,
        channel: 'instagram',
        copiedMessage: formattedMessage,
      }).catch((e) => console.warn('Enquiry log error:', e));
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenInstagram = () => {
    handleCopyMessage();
    const url = settings.instagramUrl || 'https://www.instagram.com/auraintimates';
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EDE4DE] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F0EAE7] flex items-center justify-between bg-[#FCFAF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center shrink-0">
              <Instagram size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#2B1220]">
                Order Enquiry via Instagram DM
              </h2>
              <p className="text-[11px] sm:text-xs text-[#886A72]">
                Direct boutique concierge with {settings.instagramHandle}
              </p>
            </div>
          </div>
          <button
            onClick={closeOrderModal}
            className="p-1.5 text-[#886A72] hover:text-[#2B1220] rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-[#2B1220]">
          {/* Selected Product Summary Box */}
          <div className="bg-[#FAF7F5] rounded-xl p-4 border border-[#ECE4DE] space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
              Order Summary ({orderModalItems.length} {orderModalItems.length === 1 ? 'item' : 'items'})
            </div>

            <div className="divide-y divide-[#EFE8E5] max-h-48 overflow-y-auto pr-1">
              {orderModalItems.map((item, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-14 object-cover rounded bg-white border border-[#E6DCD6] shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-[#2B1220] truncate">{item.productName}</h4>
                    <div className="text-[11px] text-[#6E5D65] flex items-center gap-2 mt-0.5">
                      <span>Colour: <strong className="font-medium text-[#2B1220]">{item.color}</strong></span>
                      <span>·</span>
                      <span>Size: <strong className="font-medium text-[#2B1220]">{item.size}</strong></span>
                      <span>·</span>
                      <span>Qty: <strong className="font-medium text-[#2B1220]">{item.quantity}</strong></span>
                    </div>
                    <div className="text-[11px] font-mono text-[#886A72] mt-0.5">
                      SKU: {item.sku || item.productId}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-[#2B1220] font-mono tabular-nums">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-[10px] text-[#886A72] font-mono">
                        (₹{item.unitPrice} each)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E5DAD4] flex items-center justify-between text-sm">
              <span className="font-medium text-[#55464D]">Estimated Subtotal</span>
              <span className="font-bold text-[#2B1220] font-mono text-base tabular-nums">
                ₹{overallSubtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Formatted Order Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                Order Details to Send
              </label>
              <button
                onClick={handleCopyMessage}
                className="text-xs font-medium text-[#2B1220] hover:text-[#622D52] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'Copied to clipboard!' : 'Copy Order Details'}</span>
              </button>
            </div>
            <div className="relative">
              <textarea
                readOnly
                rows={5}
                value={formattedMessage}
                className="w-full text-xs font-mono bg-[#FCFBF9] border border-[#E6DDD8] rounded-lg p-3 text-[#3D2533] leading-relaxed resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-[#FFFDFB] border border-[#F2ECE7] rounded-xl p-3.5 space-y-2 text-xs text-[#55464D]">
            <div className="font-semibold text-[#2B1220] flex items-center gap-1.5">
              <span>Simple 2-Step Ordering:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#6E5D65] leading-relaxed">
              <li>Tap <strong>“Copy Details & Open Instagram”</strong> below.</li>
              <li>In Instagram DM to <strong>{settings.instagramHandle}</strong>, paste the message and hit send.</li>
              <li>Our sizing concierge will confirm exact availability, calculate discreet delivery fee, and share secure payment methods (UPI/Card).</li>
            </ol>
          </div>

          {/* Important Transparent Notice */}
          <div className="flex items-start gap-2 text-[11px] text-[#886A72] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EDE5DF]">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#886A72]" />
            <p>
              <strong>Confidentiality Guarantee:</strong> Your order inquiry remains completely confidential. All deliveries are made in 100% unmarked, discreet exterior parcels with no intimate brand labels outside.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#F0EAE7] bg-[#FCFAF8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={handleCopyMessage}
            className="px-4 py-2.5 border border-[#D8CDC7] bg-white hover:bg-[#F8F2F0] text-[#2B1220] text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Details!' : '1. Copy Order Details'}</span>
          </button>

          <button
            onClick={handleOpenInstagram}
            className="flex-1 px-6 py-2.5 bg-[#2B1220] hover:bg-[#49203C] text-white text-xs font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Instagram size={15} />
            <span>2. Open Instagram DM ({settings.instagramHandle})</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
