import React from 'react';
import { Instagram, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Footer: React.FC = () => {
  const { settings, setActiveCategory, setActivePolicyPage, openSizeGuide, setIsAdminModalOpen } = useCart();

  const handleCategoryClick = (cat: string) => {
    setActivePolicyPage(null);
    setActiveCategory(cat);
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePolicyClick = (page: string) => {
    setActivePolicyPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FAF7F5] border-t border-[#EFE8E5] text-[#2B1220] pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Working Newsletter & Brand Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-[#EFE8E5] items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/aura-intimates-logo.png"
                alt="Aura Intimates official logo"
                className="h-12 w-auto object-contain rounded"
              />
              <div>
                <h3 className="text-xl font-serif-luxury font-medium tracking-tight text-[#2B1220] leading-none">
                  {settings.brandName || 'Aura Intimates'}
                </h3>
                <span className="text-[10px] tracking-widest uppercase text-[#886A72] font-medium block mt-1">
                  {settings.brandTagline || 'Comfort · Confidence · You'}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#55464D] max-w-sm leading-relaxed">
              Everyday comfort crafted for confidence. Luxury bras, buttery-soft briefs, and matching intimates designed for effortless silhouettes and delivered in 100% discreet packaging.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#DED4CE] text-xs font-semibold text-[#2B1220] hover:bg-[#F6EEEC] transition-colors"
              >
                <Instagram size={14} />
                <span>Follow {settings.instagramHandle}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#EFE8E5] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2B1220]">
                <ShieldCheck size={16} className="text-[#886A72]" />
                <span>100% Confidential Packaging</span>
              </div>
              <p className="text-[11px] text-[#6E5D65] leading-relaxed">
                Plain exterior shipping flyer with no lingerie branding or garment descriptions. Your privacy is protected from dispatch to doorstep.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#EFE8E5] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2B1220]">
                <Instagram size={16} className="text-[#886A72]" />
                <span>Bespoke DM Concierge</span>
              </div>
              <p className="text-[11px] text-[#6E5D65] leading-relaxed">
                Need help finding your exact cup or band fit? Send your measurements directly to <span className="font-semibold text-[#2B1220]">{settings.instagramHandle}</span> for private styling.
              </p>
            </div>
          </div>
        </div>

        {/* 4-Column Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-[#55464D]">
          {/* Col 1: Categories */}
          <div className="space-y-3">
            <div className="font-semibold text-[#2B1220] uppercase tracking-wider text-[11px]">
              Categories
            </div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleCategoryClick('bras')} className="hover:text-[#2B1220] transition-colors">
                  Bras & Bralettes
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('panties')} className="hover:text-[#2B1220] transition-colors">
                  Silk & Cotton Panties
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('matching-sets')} className="hover:text-[#2B1220] transition-colors">
                  Matching Lingerie Sets
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('seamless-innerwear')} className="hover:text-[#2B1220] transition-colors">
                  Seamless Invisible Series
                </button>
              </li>
              <li>
                <button onClick={() => handleCategoryClick('sale')} className="hover:text-[#2B1220] transition-colors font-medium">
                  Genuine Seasonal Offers
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Fit & Support */}
          <div className="space-y-3">
            <div className="font-semibold text-[#2B1220] uppercase tracking-wider text-[11px]">
              Fit & Guidance
            </div>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handlePolicyClick('size-guide')}
                  className="hover:text-[#2B1220] transition-colors font-medium text-[#2B1220] flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span>Dedicated Size Guide Page</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FAF0ED] text-[#7A3E52]">
                    Full Matrix
                  </span>
                </button>
              </li>
              <li>
                <button onClick={() => openSizeGuide('bras')} className="hover:text-[#2B1220] transition-colors cursor-pointer text-left">
                  Interactive Bra Size Calculator
                </button>
              </li>
              <li>
                <button onClick={() => openSizeGuide('panties')} className="hover:text-[#2B1220] transition-colors cursor-pointer text-left">
                  Panty Sizing Chart
                </button>
              </li>
              <li>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#2B1220] transition-colors cursor-pointer"
                >
                  Personal Fit Consult (Instagram DM)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Policies */}
          <div className="space-y-3">
            <div className="font-semibold text-[#2B1220] uppercase tracking-wider text-[11px]">
              Customer Care
            </div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handlePolicyClick('about')} className="hover:text-[#2B1220] transition-colors">
                  About {settings.brandName}
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('contact')} className="hover:text-[#2B1220] transition-colors">
                  Contact Concierge
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('shipping')} className="hover:text-[#2B1220] transition-colors">
                  Discreet Shipping Policy
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('returns')} className="hover:text-[#2B1220] transition-colors">
                  Hygiene, Returns & Exchanges
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Transparency */}
          <div className="space-y-3">
            <div className="font-semibold text-[#2B1220] uppercase tracking-wider text-[11px]">
              Trust & Legal
            </div>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handlePolicyClick('privacy')} className="hover:text-[#2B1220] transition-colors">
                  Privacy & Data Protection
                </button>
              </li>
              <li>
                <button onClick={() => handlePolicyClick('terms')} className="hover:text-[#2B1220] transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="text-[#886A72] hover:text-[#2B1220] transition-colors font-medium flex items-center gap-1"
                >
                  <span>Owner Portal (मालिक लॉगिन)</span>
                </button>
              </li>
              <li className="pt-2 text-[11px] text-[#886A72] flex items-center gap-1.5">
                <ShieldCheck size={14} className="shrink-0" />
                <span>100% Unmarked Discreet Box</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quiet Bottom Strip */}
        <div className="pt-8 border-t border-[#EFE8E5] flex flex-col sm:flex-row items-center justify-between text-xs text-[#886A72] gap-4">
          <div>
            © {new Date().getFullYear()} {settings.brandName}. All rights reserved. Prices in INR (₹).
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Discreet Courier Dispatch</span>
            <span>·</span>
            <span>All-India Shipping</span>
            <span>·</span>
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#2B1220] underline underline-offset-2"
            >
              Instagram @{settings.instagramHandle.replace('@', '')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
