import React, { useState, useRef, useEffect } from 'react';
import { X, SlidersHorizontal, Check, RotateCcw, Info, Ruler, ChevronRight } from 'lucide-react';
import { Category, Product } from '../types/store';
import { useCart } from '../context/CartContext';

export interface FilterState {
  categoryId: string;
  minPrice: number;
  maxPrice: number;
  colors: string[];
  sizes: string[];
  inStockOnly: boolean;
  saleOnly: boolean;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: Category[];
  availableColors: { name: string; hex: string }[];
  availableSizes: string[];
  totalMatches: number;
  onReset: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  categories,
  availableColors,
  availableSizes,
  totalMatches,
  onReset,
}) => {
  const { openSizeGuide, setActivePolicyPage } = useCart();
  const [showSizeTooltip, setShowSizeTooltip] = useState(false);
  const sizeTooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeTooltipRef.current && !sizeTooltipRef.current.contains(event.target as Node)) {
        setShowSizeTooltip(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSizeTooltip(false);
      }
    };
    if (showSizeTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSizeTooltip]);

  if (!isOpen) return null;

  const handleColorToggle = (colorName: string) => {
    const exists = filters.colors.includes(colorName);
    const updated = exists
      ? filters.colors.filter((c) => c !== colorName)
      : [...filters.colors, colorName];
    onFilterChange({ ...filters, colors: updated });
  };

  const handleSizeToggle = (size: string) => {
    const exists = filters.sizes.includes(size);
    const updated = exists
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFilterChange({ ...filters, sizes: updated });
  };

  const activeFilterCount =
    (filters.categoryId !== 'all' ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < 5000 ? 1 : 0) +
    filters.colors.length +
    filters.sizes.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.saleOnly ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-transparent"
      />

      <div className="relative z-10 bg-white w-full max-h-[85vh] sm:max-h-[88vh] sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl border border-[#EDE4DE] overflow-hidden text-[#2B1220]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F0EAE7] flex items-center justify-between bg-[#FCFAF8] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#2B1220]">
                Filter Silhouette & Sizing
              </h3>
              <p className="text-[11px] text-[#886A72]">
                {activeFilterCount > 0 ? `${activeFilterCount} active filters applied` : 'Refine collection parameters'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="text-xs text-[#886A72] hover:text-[#2B1220] underline transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#886A72] hover:text-[#2B1220] rounded-full hover:bg-black/5"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Options */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, categoryId: 'all' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  filters.categoryId === 'all'
                    ? 'bg-[#2B1220] text-white border-[#2B1220]'
                    : 'bg-white text-[#55464D] border-[#DED4CE] hover:border-[#886A72]'
                }`}
              >
                All Collections
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, categoryId: c.id })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    filters.categoryId === c.id
                      ? 'bg-[#2B1220] text-white border-[#2B1220]'
                      : 'bg-white text-[#55464D] border-[#DED4CE] hover:border-[#886A72]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-[#886A72]">Price Range</span>
              <span className="font-mono text-[#2B1220] font-semibold">
                ₹{filters.minPrice} – ₹{filters.maxPrice}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[10px] text-[#886A72]">Min (₹)</span>
                <input
                  type="number"
                  min={0}
                  max={filters.maxPrice}
                  step={100}
                  value={filters.minPrice}
                  onChange={(e) => onFilterChange({ ...filters, minPrice: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-[#DED4CE] bg-white font-mono"
                />
              </div>
              <span className="text-stone-400 self-end pb-2">—</span>
              <div className="flex-1">
                <span className="text-[10px] text-[#886A72]">Max (₹)</span>
                <input
                  type="number"
                  min={filters.minPrice}
                  max={10000}
                  step={100}
                  value={filters.maxPrice}
                  onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-[#DED4CE] bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. Colour Filter */}
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                Colours ({filters.colors.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((col) => {
                  const isSelected = filters.colors.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleColorToggle(col.name)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF5F2] border-[#2B1220] ring-1 ring-[#2B1220] text-[#2B1220] font-semibold'
                          : 'bg-white border-[#DED4CE] text-[#55464D] hover:border-[#886A72]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Sizes Filter with Sizing Info Tooltip */}
          {availableSizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                    Sizes {filters.sizes.length > 0 && `(${filters.sizes.length} selected)`}
                  </label>

                  {/* Sizing Tooltip / Info Icon Popover */}
                  <div className="relative inline-flex items-center" ref={sizeTooltipRef}>
                    <button
                      type="button"
                      onClick={() => setShowSizeTooltip((prev) => !prev)}
                      onMouseEnter={() => setShowSizeTooltip(true)}
                      aria-label="How to read sizing labels"
                      aria-expanded={showSizeTooltip}
                      className="p-1 rounded-full text-[#886A72] hover:text-[#2B1220] hover:bg-[#FAF0ED] focus:outline-none focus:ring-1 focus:ring-[#2B1220] transition-colors cursor-pointer"
                      title="How to read our sizing labels"
                    >
                      <Info size={13} className="shrink-0" />
                    </button>

                    {showSizeTooltip && (
                      <div
                        className="absolute left-0 top-full mt-1.5 z-50 w-[270px] sm:w-[290px] bg-white border border-[#EDE4DE] rounded-xl shadow-xl p-3 text-left animate-in fade-in zoom-in-95 duration-150"
                        role="tooltip"
                        onMouseLeave={() => setShowSizeTooltip(false)}
                      >
                        {/* Decorative triangle arrow */}
                        <div className="absolute -top-1.5 left-2.5 w-3 h-3 bg-white border-t border-l border-[#EDE4DE] rotate-45 transform" />

                        <div className="relative z-10 space-y-2.5">
                          <div className="flex items-center justify-between pb-1.5 border-b border-[#F0EAE7]">
                            <div className="flex items-center gap-1.5">
                              <span className="p-1 rounded-md bg-[#FAF0ED] text-[#2B1220]">
                                <Ruler size={12} />
                              </span>
                              <span className="text-xs font-semibold text-[#2B1220]">
                                Sizing Guide Reference
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSizeTooltip(false)}
                              className="text-[#886A72] hover:text-[#2B1220] p-0.5 rounded transition-colors cursor-pointer"
                              aria-label="Close sizing tooltip"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <div className="text-[11px] text-[#55464D] space-y-2 leading-relaxed">
                            <div>
                              <strong className="text-[#2B1220] font-semibold block mb-0.5">
                                • Bras (e.g., 34B, 36C)
                              </strong>
                              <span className="text-[#6E5D65]">
                                Number = Underbust band in inches (32, 34, 36...).
                                Letter = Cup fullness projection (B = standard, C = full, D = fuller).
                              </span>
                            </div>

                            <div>
                              <strong className="text-[#2B1220] font-semibold block mb-0.5">
                                • Briefs & Panties (XS–XXL)
                              </strong>
                              <span className="text-[#6E5D65]">
                                Standard waist/hip fit: S (34–36"), M (36–38"), L (38–40"), XL (40–42").
                              </span>
                            </div>

                            <div>
                              <strong className="text-[#2B1220] font-semibold block mb-0.5">
                                • Free Size
                              </strong>
                              <span className="text-[#6E5D65]">
                                Engineered 4-way stretch fabric adapting to XS through L.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowSizeTooltip(false);
                                openSizeGuide();
                              }}
                              className="py-1.5 px-2 bg-[#FAF7F5] hover:bg-[#FAF0ED] text-[#2B1220] border border-[#EDE4DE] hover:border-[#D0C2BD] rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Calculator</span>
                              <ChevronRight size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSizeTooltip(false);
                                onClose();
                                setActivePolicyPage('size-guide');
                                if (typeof window !== 'undefined') {
                                  window.history.pushState(null, '', '/size-guide');
                                }
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="py-1.5 px-2 bg-[#2B1220] hover:bg-[#3D1E2F] text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            >
                              <span>Full Size Guide</span>
                              <ChevronRight size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {filters.sizes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onFilterChange({ ...filters, sizes: [] })}
                    className="text-[11px] text-[#886A72] hover:text-[#2B1220] underline transition-colors cursor-pointer"
                  >
                    Clear sizes
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((sz) => {
                  const isSelected = filters.sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSizeToggle(sz)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#2B1220] text-white border-[#2B1220]'
                          : 'bg-white text-[#55464D] border-[#DED4CE] hover:border-[#886A72]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Toggles: In-stock only & Sale only */}
          <div className="space-y-3 pt-2 border-t border-[#F0EAE7]">
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#EDE4DE] bg-[#FAF7F5] cursor-pointer">
              <span className="text-xs font-semibold text-[#2B1220]">In-Stock Only</span>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
                className="w-4 h-4 rounded accent-[#2B1220]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-[#EDE4DE] bg-[#FAF7F5] cursor-pointer">
              <span className="text-xs font-semibold text-[#2B1220]">Sale / Discounted Offers Only</span>
              <input
                type="checkbox"
                checked={filters.saleOnly}
                onChange={(e) => onFilterChange({ ...filters, saleOnly: e.target.checked })}
                className="w-4 h-4 rounded accent-[#2B1220]"
              />
            </label>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-[#F0EAE7] bg-[#FCFAF8] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2.5 border border-[#DED4CE] text-[#55464D] hover:text-[#2B1220] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply Filters ({totalMatches} Products)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
