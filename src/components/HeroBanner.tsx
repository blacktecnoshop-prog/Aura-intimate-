import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Truck, HeartHandshake } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const HeroBanner: React.FC = () => {
  const { settings, setActiveCategory } = useCart();

  const handleShopNow = () => {
    setActiveCategory('all');
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-[#FAF7F5] border-b border-[#EFE8E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#886A72]">
              <Sparkles size={14} className="text-[#886A72]" />
              <span>Autumn / Winter Luxury Intimates</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-luxury font-medium tracking-tight text-[#2B1220] leading-[1.1] text-balance">
              Comfort Meets Confidence
            </h1>

            <p className="text-base sm:text-lg text-[#55464D] max-w-xl font-normal leading-relaxed">
              Discover comfortable everyday bras, seamless panties, and matching lingerie sets designed with buttery-soft microfibres, gentle contours, and breathable cotton gussets for effortless silhouette perfection across India.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={handleShopNow}
                className="px-8 py-3.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-white font-medium text-sm tracking-wide rounded-md transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Shop Collection</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-white hover:bg-[#F6EEEC] text-[#2B1220] border border-[#E0D5CF] font-medium text-sm tracking-wide rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <span>Order via Instagram ({settings.instagramHandle})</span>
              </a>
            </div>

            {/* Quick Sizing Guarantee Note */}
            <p className="text-xs text-[#886A72] flex items-center gap-1.5 pt-1">
              <ShieldCheck size={14} />
              <span>100% Discreet Packaging · Unmarked Outer Parcel · Sizing Assistance via Instagram DM</span>
            </p>
          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] shadow-md border border-[#ECE4DF] bg-[#F4EDE8]">
              <img
                src="/images/hero_luxury_innerwear_1792781847179.jpg"
                alt={`${settings.brandName || 'Aura Intimates'} - Women's Bras, Panties & Matching Lingerie Sets`}
                width={800}
                height={600}
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded text-xs font-medium text-[#2B1220] shadow-sm">
                Aura Cloud & French Chantilly Series
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 4-Column Proof & Trust Row */}
        <div className="mt-12 pt-8 border-t border-[#EFE8E5] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-[#F4EDE8] text-[#3D1E2F] flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">Discreet Delivery</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5">Plain eco-friendly packaging with no product labels on parcel.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-[#F4EDE8] text-[#3D1E2F] flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">Artisanal Fabrics</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5">Hypoallergenic cotton & silk satin engineered for Indian climates.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-[#F4EDE8] text-[#3D1E2F] flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">Hygiene Certified</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5">Untouched sanitary liner seals and 7-day size exchange guarantee.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded bg-[#F4EDE8] text-[#3D1E2F] flex items-center justify-center shrink-0">
              <HeartHandshake size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">Personal Fit Assist</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5">DM our intimate fit specialists directly on Instagram anytime.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
