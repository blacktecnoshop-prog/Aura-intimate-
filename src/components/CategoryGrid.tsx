import React from 'react';
import { Category } from '../types/store';
import { useCart } from '../context/CartContext';
import { ArrowUpRight } from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  const { setActiveCategory } = useCart();

  const handleSelectCategory = (slug: string) => {
    setActiveCategory(slug);
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-[#FDFBF9] border-b border-[#EFE8E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#886A72]">
              Couture Silhouettes
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-luxury font-medium text-[#2B1220] mt-1">
              Shop by Category
            </h2>
          </div>
          <p className="text-xs text-[#6E5D65] max-w-md">
            Every piece is tailored for breathable everyday support, invisible contours under clothing, and indulgent tactile sensations.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.slug || cat.id)}
              className="group cursor-pointer rounded-xl overflow-hidden bg-white border border-[#EDE5E0] hover:border-[#D6BEBE] transition-all hover:shadow-md flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-[#F5EFEA] overflow-hidden">
                <img
                  src={cat.image || '/images/hero_luxury_innerwear_1792781847179.jpg'}
                  alt={cat.name}
                  width={320}
                  height={240}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      console.warn(`[Aura Intimates] Category image failed: ${target.src}`);
                      target.src = '/images/hero_luxury_innerwear_1792781847179.jpg';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#2B1220] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#2B1220] group-hover:text-[#622D52] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#6E5D65] mt-1 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-3 text-[11px] font-medium text-[#886A72] group-hover:text-[#2B1220] flex items-center gap-1 transition-colors">
                  <span>Explore items</span>
                  <span aria-hidden="true">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
