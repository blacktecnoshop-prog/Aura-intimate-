import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, ShieldCheck, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin }) => {
  const {
    settings,
    cartCount,
    setIsCartOpen,
    wishlist,
    setActiveCategory,
    activeCategory,
    searchQuery,
    setSearchQuery,
    setActivePolicyPage,
    activePolicyPage,
  } = useCart();

  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { label: 'All Collections', category: 'all' },
    { label: 'Bras', category: 'bras' },
    { label: 'Panties', category: 'panties' },
    { label: 'Matching Sets', category: 'matching-sets' },
    { label: 'Seamless', category: 'seamless-innerwear' },
    { label: 'Size Guide', category: 'size-guide', isPage: true },
    { label: 'Sale', category: 'sale' },
  ];

  const handleNavClick = (category: string, isPage?: boolean) => {
    if (isPage || category === 'size-guide') {
      setActivePolicyPage('size-guide');
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/size-guide');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActivePolicyPage(null);
    setActiveCategory(category);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', category === 'all' ? '/' : `/category/${category}`);
    }
    // Smooth scroll to catalog
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0EAE7] transition-all">
      {/* Slim Announcement Bar */}
      {settings.announcementEnabled && !announcementDismissed && (
        <div className="bg-[#2B1220] text-[#FDF8F7] text-xs font-medium tracking-wide py-2 px-4 flex items-center justify-between">
          <div className="flex-1 text-center truncate">
            <span>{settings.announcementText}</span>
            <span className="hidden sm:inline-block ml-3 opacity-60">·</span>
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-block ml-3 underline hover:opacity-90 underline-offset-2 transition-opacity"
            >
              Order directly via {settings.instagramHandle}
            </a>
          </div>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-[#eed0c9] hover:text-white transition-colors ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Bar Contract (Zone 1 - Zone 2 - Zone 3) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Official Logo & Brand Identity */}
        <button
          onClick={() => {
            setActivePolicyPage(null);
            setActiveCategory('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 sm:gap-3 group shrink-0 text-left cursor-pointer focus:outline-none"
        >
          <img
            src="/images/aura-intimates-logo.png"
            alt="Aura Intimates official logo"
            className="h-9 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-serif-luxury font-medium tracking-tight text-[#2B1220] group-hover:text-[#552743] transition-colors leading-tight">
              {settings.brandName || 'Aura Intimates'}
            </span>
            <span className="hidden sm:block text-[9px] tracking-widest uppercase text-[#886A72] font-medium">
              {settings.brandTagline || 'Comfort · Confidence · You'}
            </span>
          </div>
        </button>

        {/* Zone 2: clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium tracking-wide text-[#55464D]">
          {navLinks.map((link) => {
            const isActive = link.isPage
              ? activePolicyPage === link.category
              : !activePolicyPage && activeCategory === link.category;
            return (
              <button
                key={link.category}
                onClick={() => handleNavClick(link.category, link.isPage)}
                className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-[#2B1220] text-[#2B1220] font-semibold'
                    : 'border-transparent text-[#55464D] hover:text-[#2B1220] hover:border-[#D6BEBE]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Interactive Affordances (Search, Wishlist, Bag, Admin) */}
        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Search essentials"
            className="p-1.5 text-[#3D1E2F] hover:text-[#2B1220] transition-colors"
          >
            <Search size={20} strokeWidth={1.75} />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => handleNavClick('all')}
            aria-label="Wishlist"
            className="p-1.5 text-[#3D1E2F] hover:text-rose-600 transition-colors relative"
            title={`${wishlist.length} item(s) in wishlist`}
          >
            <Heart
              size={20}
              strokeWidth={1.75}
              className={`transition-colors duration-200 ${
                wishlist.length > 0
                  ? 'fill-rose-600 text-rose-600'
                  : 'text-[#3D1E2F] hover:text-rose-600 fill-none'
              }`}
            />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center tabular-nums shadow-xs">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag / Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Bag"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2B1220] hover:bg-[#3D1E2F] text-[#FDF8F7] rounded-md transition-colors text-xs font-medium whitespace-nowrap shrink-0 shadow-sm"
          >
            <ShoppingBag size={17} strokeWidth={1.8} />
            <span className="hidden sm:inline">Bag</span>
            <span className="bg-[#4D243B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
              {cartCount}
            </span>
          </button>

          {/* Owner Dashboard Lock Button */}
          <button
            onClick={onOpenAdmin}
            aria-label="Owner Admin Portal"
            className="p-1.5 text-[#886A72] hover:text-[#2B1220] transition-colors"
            title="Owner Portal"
          >
            <ShieldCheck size={19} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Expandable Instant Search Bar */}
      {isSearchOpen && (
        <div className="bg-[#FAF6F4] border-t border-[#EFE8E5] px-4 py-3 transition-all">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Search size={18} className="text-[#886A72] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bras, silk panties, seamless innerwear, lace bralettes..."
              autoFocus
              className="w-full bg-transparent border-0 outline-none text-sm text-[#2B1220] placeholder:text-[#9B7E84]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#886A72] hover:text-[#2B1220] uppercase font-semibold"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-[#886A72] hover:text-[#2B1220] p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Category Horizontal Scroll Strip */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-2.5 overflow-x-auto no-scrollbar border-t border-[#F0EAE7] bg-[#FCFBF9]">
        {navLinks.map((link) => {
          const isActive = activeCategory === link.category;
          return (
            <button
              key={link.category}
              onClick={() => handleNavClick(link.category)}
              className={`px-3 py-1 text-xs whitespace-nowrap rounded transition-colors ${
                isActive
                  ? 'bg-[#2B1220] text-white font-medium'
                  : 'text-[#55464D] hover:bg-[#F3ECE9]'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
