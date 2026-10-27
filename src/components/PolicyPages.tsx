import React from 'react';
import { ArrowLeft, ShieldCheck, Truck, RefreshCw, Mail, Instagram, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface PolicyPagesProps {
  page: string;
  onBack: () => void;
}

export const PolicyPages: React.FC<PolicyPagesProps> = ({ page, onBack }) => {
  const { settings, openSizeGuide } = useCart();

  const renderContent = () => {
    switch (page) {
      case 'about':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-medium text-[#2B1220]">
              About {settings.brandName}
            </h1>
            <p className="text-sm text-[#886A72] uppercase tracking-wider font-semibold">
              Elegance, Comfort, and Authentic Self-Expression
            </p>
            <div className="prose prose-stone text-sm text-[#55464D] leading-relaxed space-y-4">
              <p>
                Founded on the belief that everyday essentials should feel weightless and look immaculate, {settings.brandName} crafts innerwear designed for the contemporary woman. We balance structural support with sensory softness.
              </p>
              <p>
                Our collections are designed in consultation with women of all body silhouettes—focusing on wire-free comfort, seamless laser-cut edging, breathable organic cotton liners, and French scalloped lace that flatters without pinching.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE]">
                  <h4 className="font-semibold text-xs text-[#2B1220] uppercase mb-1">Buttery Softness</h4>
                  <p className="text-xs text-[#6E5D65]">Premium microfibres and combed cotton tested for zero-chafing all-day wear.</p>
                </div>
                <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE]">
                  <h4 className="font-semibold text-xs text-[#2B1220] uppercase mb-1">Inclusive Sizing</h4>
                  <p className="text-xs text-[#6E5D65]">Carefully graded cups from 30B to 38D and bottoms from S to XXL.</p>
                </div>
                <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE]">
                  <h4 className="font-semibold text-xs text-[#2B1220] uppercase mb-1">Discreet & Direct</h4>
                  <p className="text-xs text-[#6E5D65]">Private consultations and custom order bookings handled directly via Instagram.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-medium text-[#2B1220]">
              Contact & Concierge
            </h1>
            <p className="text-sm text-[#886A72] uppercase tracking-wider font-semibold">
              We are here to assist with sizing, orders, and inquiries
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="p-6 bg-[#FAF7F5] rounded-2xl border border-[#ECE4DE] space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center">
                  <Instagram size={20} />
                </div>
                <h3 className="text-sm font-semibold text-[#2B1220]">Instagram Direct Message</h3>
                <p className="text-xs text-[#6E5D65]">
                  Our primary channel for order placements, size guidance, stock checks, and payment confirmation.
                </p>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B1220] hover:text-[#622D52] underline underline-offset-2"
                >
                  <span>Connect @{settings.instagramHandle.replace('@', '')}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="p-6 bg-[#FAF7F5] rounded-2xl border border-[#ECE4DE] space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <h3 className="text-sm font-semibold text-[#2B1220]">Email Inquiries</h3>
                <p className="text-xs text-[#6E5D65]">
                  For corporate, bulk wholesale, or formal store correspondence:
                </p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B1220] hover:text-[#622D52] underline underline-offset-2"
                >
                  <span>{settings.contactEmail}</span>
                </a>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#EFE8E5] text-xs text-[#55464D]">
              <strong>Hours of Operation:</strong> Monday to Saturday: 10:00 AM – 8:00 PM IST. DM inquiries received on Sundays will be addressed first thing Monday morning.
            </div>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-medium text-[#2B1220]">
              Shipping & Discreet Packaging Policy
            </h1>
            <p className="text-sm text-[#886A72] uppercase tracking-wider font-semibold">
              Your privacy is our utmost priority
            </p>
            <div className="prose text-xs sm:text-sm text-[#55464D] leading-relaxed space-y-4">
              <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#ECE4DE] flex items-start gap-3">
                <ShieldCheck size={20} className="text-[#3D1E2F] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#2B1220] text-xs uppercase mb-1">100% Discreet Outer Packaging</h4>
                  <p className="text-xs text-[#6E5D65]">
                    All parcels are shipped in completely plain, unbranded kraft boxes or opaque tamper-evident security flyers. There is <strong>no mention</strong> of innerwear, lingerie, or product names on the shipping label. The sender name is listed quietly as "BTS Logistics".
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#2B1220] pt-2">Shipping Destinations & Delivery Timelines</h3>
              <p>
                We deliver to all serviced pin codes across India via verified express courier partners (BlueDart, Delhivery, DTDC, India Post).
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#6E5D65]">
                <li><strong>Metro Cities:</strong> 2 to 4 business days.</li>
                <li><strong>Rest of India:</strong> 4 to 7 business days.</li>
                <li><strong>Dispatch Time:</strong> Orders verified before 2:00 PM are dispatched on the same business day.</li>
              </ul>

              <h3 className="text-sm font-semibold text-[#2B1220] pt-2">Shipping Charges</h3>
              <p>
                Orders above <strong>₹{settings.freeShippingThreshold}</strong> qualify for <strong>Free Express Shipping</strong>. For orders below ₹{settings.freeShippingThreshold}, a flat standard shipping fee of <strong>₹{settings.shippingFee}</strong> applies nationwide.
              </p>
            </div>
          </div>
        );

      case 'returns':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-medium text-[#2B1220]">
              Hygiene, Returns & Exchange Policy
            </h1>
            <p className="text-sm text-[#886A72] uppercase tracking-wider font-semibold">
              Clear, transparent rules adhering to intimate hygiene standards
            </p>
            <div className="prose text-xs sm:text-sm text-[#55464D] leading-relaxed space-y-4">
              <div className="p-4 bg-[#FAF5F2] rounded-xl border border-[#ECDCD8] flex items-start gap-3">
                <RefreshCw size={20} className="text-[#3D1E2F] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#2B1220] text-xs uppercase mb-1">Our Hygiene Commitment</h4>
                  <p className="text-xs text-[#6E5D65]">
                    Due to the intimate nature of innerwear and strict sanitary health regulations, we maintain transparent rules to protect every customer. No customer will ever receive an item previously tried on or returned by another individual.
                  </p>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#2B1220] pt-2">1. Bras & Bralettes (7-Day Size Exchange)</h3>
              <p>
                We understand that bra sizing requires the perfect band and cup fit. Bras are eligible for a <strong>one-time size exchange within 7 days</strong> of delivery under the following conditions:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#6E5D65]">
                <li>Garment is completely unworn, unwashed, and odour-free.</li>
                <li>Original brand tags, barcode labels, and security seal rings remain completely attached and untampered.</li>
                <li>Item must be repacked in the original clean packaging.</li>
              </ul>

              <h3 className="text-sm font-semibold text-[#2B1220] pt-2">2. Panties, Thongs & Briefs (Final Sale for Hygiene)</h3>
              <p>
                Under Indian hygiene regulations and our health safety protocol, <strong>all panties and knickers are strictly non-returnable and non-exchangeable</strong> once the sanitary liner or packaging seal is opened. Please refer to our interactive Size Guide prior to placing your order.
              </p>

              <h3 className="text-sm font-semibold text-[#2B1220] pt-2">3. Damaged or Defective Deliveries</h3>
              <p>
                In the rare instance an item arrives with a manufacturing defect, please reach out to us within 48 hours of delivery via Instagram DM with an unboxing video. We will promptly dispatch a replacement or issue a full refund.
              </p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-medium text-[#2B1220]">
              Privacy & Data Protection Policy
            </h1>
            <p className="text-sm text-[#886A72] uppercase tracking-wider font-semibold">
              Strict confidentiality for your intimate shopping
            </p>
            <div className="prose text-xs sm:text-sm text-[#55464D] leading-relaxed space-y-4">
              <p>
                At {settings.brandName}, we hold your privacy in the highest regard. We collect only the minimal information strictly required to facilitate your order enquiry, courier dispatch, and delivery updates.
              </p>
              <h3 className="text-sm font-semibold text-[#2B1220]">What We Never Do:</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#6E5D65]">
                <li>We never publish customer names, phone numbers, delivery addresses, or sizes publicly.</li>
                <li>We do not sell, rent, or trade your contact details with any third-party marketing companies.</li>
                <li>We never post customer feedback or reviews without explicit, written customer permission with all identifying details scrubbed.</li>
              </ul>
              <h3 className="text-sm font-semibold text-[#2B1220]">Information Collected:</h3>
              <p className="text-xs text-[#6E5D65]">
                When you initiate an Instagram DM enquiry, you provide only the details needed for logistics (Delivery Name, Shipping Address, Pincode, and Contact Number for Courier SMS updates).
              </p>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-medium text-[#2B1220]">
              Terms & Conditions
            </h1>
            <p className="text-sm text-[#886A72] uppercase tracking-wider font-semibold">
              Store policies and ordering guidelines
            </p>
            <div className="prose text-xs sm:text-sm text-[#55464D] leading-relaxed space-y-4">
              <p>
                By browsing {settings.brandName} and placing order enquiries via Instagram Direct Message or WhatsApp, you agree to these transparent terms:
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs text-[#6E5D65]">
                <li><strong>Order Confirmation:</strong> An order is finalized only after stock verification and payment confirmation in DM. Adding items to your website bag does not reserve physical inventory.</li>
                <li><strong>Pricing & Taxes:</strong> All listed prices are in Indian Rupees (₹) and include all applicable taxes. Genuine discounts are reflected transparently with original prices shown.</li>
                <li><strong>Hygiene Compliance:</strong> All customers are required to observe our Hygiene & Exchange terms before ordering intimate apparel.</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#2B1220] hover:text-[#622D52] mb-8 cursor-pointer group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>Back to Storefront</span>
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#EDE4DE] shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};
