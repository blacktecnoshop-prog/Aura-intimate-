import React, { useState } from 'react';
import {
  Ruler,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Check,
  Instagram,
  RefreshCw,
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';

interface SizeGuidePageProps {
  onBackToShop: () => void;
  onFilterBySize?: (size: string) => void;
}

export const SizeGuidePage: React.FC<SizeGuidePageProps> = ({ onBackToShop, onFilterBySize }) => {
  const { settings, setActiveCategory } = useCart();
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  // Calculator State
  const [underbust, setUnderbust] = useState<number>(32);
  const [bust, setBust] = useState<number>(36);

  // Active sub-tab
  const [activeSection, setActiveSection] = useState<'calculator' | 'bras' | 'panties' | 'sister-sizes' | 'care'>('calculator');

  // Calculate Bra Size
  const calculateSize = () => {
    const ubInches = unit === 'cm' ? underbust / 2.54 : underbust;
    const bInches = unit === 'cm' ? bust / 2.54 : bust;

    if (ubInches < 26 || ubInches > 46 || bInches < 28 || bInches > 52 || bInches < ubInches) {
      return {
        band: '--',
        cup: '--',
        recommended: 'Please check your measurements',
        sisterUp: '',
        sisterDown: '',
        valid: false
      };
    }

    // Conventional band sizing: round to nearest even number
    let band = Math.round(ubInches);
    if (band % 2 !== 0) band += 1;

    // Cup sizing by difference
    const diff = Math.round(bInches - band);
    const cupLetters: Record<number, string> = {
      0: 'AA',
      1: 'A',
      2: 'B',
      3: 'C',
      4: 'D',
      5: 'DD / E',
      6: 'F',
      7: 'FF / G'
    };

    const cup = diff in cupLetters ? cupLetters[diff] : diff > 7 ? 'G+' : 'A';
    const recommended = `${band}${cup}`;

    // Sister sizes calculation
    const sisterUpBand = band + 2;
    const sisterDownBand = band - 2;

    // Sister size: larger band needs smaller cup, smaller band needs larger cup
    const cupOrder = ['AA', 'A', 'B', 'C', 'D', 'DD / E', 'F', 'FF / G'];
    const currentCupIndex = cupOrder.indexOf(cup);

    const sisterUpCup = currentCupIndex > 0 ? cupOrder[currentCupIndex - 1] : '';
    const sisterDownCup = currentCupIndex < cupOrder.length - 1 ? cupOrder[currentCupIndex + 1] : '';

    const sisterUp = sisterUpCup ? `${sisterUpBand}${sisterUpCup}` : '';
    const sisterDown = sisterDownCup ? `${sisterDownBand}${sisterDownCup}` : '';

    return {
      band: `${band}`,
      cup,
      recommended,
      sisterUp,
      sisterDown,
      valid: true
    };
  };

  const calculated = calculateSize();

  const handleSelectSizeFilter = (size: string) => {
    if (onFilterBySize) {
      onFilterBySize(size);
    } else {
      setActiveCategory('all');
      onBackToShop();
    }
  };

  return (
    <div className="bg-[#FAF7F5] min-h-screen py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#886A72]">
          <button
            onClick={onBackToShop}
            className="hover:text-[#2B1220] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-[#2B1220] font-semibold">Size & Fit Guide</span>
        </nav>

        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#EBE1DB] rounded-full text-xs font-semibold text-[#886A72] uppercase tracking-wider shadow-2xs">
            <Ruler size={13} className="text-[#886A72]" />
            <span>Aura Intimates Fit Constitution</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif-luxury font-medium text-[#2B1220] tracking-tight">
            The Definitive Size & Fit Guide
          </h1>
          <p className="text-sm sm:text-base text-[#55464D] leading-relaxed">
            Finding your ideal fit should be effortless. Follow our certified measuring protocol to discover your true bra and panty size, explore sister sizing, and shop with total confidence.
          </p>
        </div>

        {/* Quick Trust Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#EDE4DE] shadow-2xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center shrink-0">
              <RefreshCw size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">7-Day Size Exchange</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5 leading-relaxed">
                If the fit isn't second-skin perfection, exchange unwashed garments with original tags intact.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE4DE] shadow-2xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">Untouched Hygiene Seals</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5 leading-relaxed">
                All knickers feature pristine protective liner seals ensuring sanitised personal safety.
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EDE4DE] shadow-2xs flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0ED] text-[#2B1220] flex items-center justify-center shrink-0">
              <Instagram size={18} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#2B1220]">1-on-1 Sizing Concierge</h4>
              <p className="text-[11px] text-[#6E5D65] mt-0.5 leading-relaxed">
                Send your measurements to <span className="font-semibold text-[#2B1220]">{settings.instagramHandle}</span> for private recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center border-b border-[#E8DFD9] gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'calculator', label: 'Interactive Fit Calculator', icon: Ruler },
            { id: 'bras', label: 'Bra Size Charts & International Matrix', icon: Sparkles },
            { id: 'panties', label: 'Panty & Bottoms Sizing', icon: Heart },
            { id: 'sister-sizes', label: 'Sister Sizing Guide', icon: Info },
            { id: 'care', label: 'Fabric Care & Hygiene', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2B1220] text-white shadow-sm'
                    : 'text-[#6E5D65] hover:text-[#2B1220] hover:bg-white/80'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: INTERACTIVE CALCULATOR */}
        {activeSection === 'calculator' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Step-by-Step Measuring Instructions */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0EAE7] pb-4">
                <div>
                  <h3 className="text-xl font-serif-luxury font-medium text-[#2B1220]">
                    Step-by-Step Measurement Guide
                  </h3>
                  <p className="text-xs text-[#6E5D65] mt-0.5">
                    For greatest accuracy, measure wearing a non-padded, wire-free bra or unlined bralette.
                  </p>
                </div>

                {/* Unit Switcher */}
                <div className="flex items-center p-1 bg-[#FAF7F5] rounded-lg border border-[#EDE4DE] self-start sm:self-auto">
                  <button
                    onClick={() => setUnit('inches')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      unit === 'inches' ? 'bg-[#2B1220] text-white shadow-2xs' : 'text-[#6E5D65]'
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    onClick={() => setUnit('cm')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      unit === 'cm' ? 'bg-[#2B1220] text-white shadow-2xs' : 'text-[#6E5D65]'
                    }`}
                  >
                    Centimetres (cm)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1: Band */}
                <div className="p-5 bg-[#FCFBF9] rounded-xl border border-[#EDE5E0] space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#2B1220] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-sm font-semibold text-[#2B1220]">Measure Your Underbust (Band)</h4>
                  </div>
                  <p className="text-xs text-[#55464D] leading-relaxed">
                    Wrap a soft measuring tape directly under your bust around your ribcage. Keep the tape completely level and snug against your body. Exhale naturally before noting the measurement.
                  </p>
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-[#2B1220] flex items-center justify-between mb-1.5">
                      <span>Underbust Measurement:</span>
                      <span className="font-mono text-sm text-[#2B1220] font-bold">
                        {underbust} {unit}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={unit === 'inches' ? 26 : 65}
                      max={unit === 'inches' ? 44 : 110}
                      step={unit === 'inches' ? 0.5 : 1}
                      value={underbust}
                      onChange={(e) => setUnderbust(parseFloat(e.target.value))}
                      className="w-full accent-[#2B1220] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Step 2: Bust */}
                <div className="p-5 bg-[#FCFBF9] rounded-xl border border-[#EDE5E0] space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#2B1220] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-sm font-semibold text-[#2B1220]">Measure Your Fullest Bust (Cup)</h4>
                  </div>
                  <p className="text-xs text-[#55464D] leading-relaxed">
                    Place the tape around the fullest point of your bust (usually at nipple level). Keep the tape parallel to the floor, resting comfortably without pressing into your tissue.
                  </p>
                  <div className="pt-2">
                    <label className="text-xs font-semibold text-[#2B1220] flex items-center justify-between mb-1.5">
                      <span>Bust Measurement:</span>
                      <span className="font-mono text-sm text-[#2B1220] font-bold">
                        {bust} {unit}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={unit === 'inches' ? 28 : 70}
                      max={unit === 'inches' ? 50 : 125}
                      step={unit === 'inches' ? 0.5 : 1}
                      value={bust}
                      onChange={(e) => setBust(parseFloat(e.target.value))}
                      className="w-full accent-[#2B1220] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Calculator Results Card */}
              <div className="p-6 bg-[#FAF0ED] rounded-2xl border border-[#E9D5D0] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 text-center md:text-left">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#886A72]">
                    Your Recommended Fit
                  </span>
                  <div className="flex items-baseline gap-3 justify-center md:justify-start">
                    <span className="text-3xl sm:text-4xl font-serif-luxury font-bold text-[#2B1220]">
                      {calculated.recommended}
                    </span>
                    {calculated.valid && (
                      <span className="text-xs text-[#6E5D65] font-medium">
                        (Band: {calculated.band} · Cup: {calculated.cup})
                      </span>
                    )}
                  </div>
                  {calculated.valid && (
                    <p className="text-xs text-[#55464D]">
                      {calculated.sisterUp || calculated.sisterDown ? (
                        <>
                          Possible sister sizes:{' '}
                          <span className="font-semibold text-[#2B1220]">
                            {[calculated.sisterUp, calculated.sisterDown].filter(Boolean).join(' or ')}
                          </span>
                        </>
                      ) : (
                        'Standard Indian / UK sizing ratio.'
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleSelectSizeFilter(calculated.recommended)}
                    className="w-full sm:w-auto px-6 py-3 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Shop Size {calculated.recommended}</span>
                    <ArrowRight size={14} />
                  </button>

                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-[#FAF7F5] text-[#2B1220] border border-[#DED4CE] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Instagram size={14} />
                    <span>DM Fit Stylist</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: BRA CONVERSION CHARTS */}
        {activeSection === 'bras' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-5">
              <div>
                <h3 className="text-xl font-serif-luxury font-medium text-[#2B1220]">
                  Comprehensive Bra Size Conversion Matrix
                </h3>
                <p className="text-xs text-[#6E5D65] mt-0.5">
                  Standard sizing across India/UK, US, European (EU), and French/Spanish numbering conventions.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#EDE4DE]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F5] border-b border-[#EDE4DE] text-[#2B1220] font-semibold">
                      <th className="py-3 px-4">India / UK</th>
                      <th className="py-3 px-4">US Equivalent</th>
                      <th className="py-3 px-4">EU Equivalent</th>
                      <th className="py-3 px-4">FR / ES</th>
                      <th className="py-3 px-4">Underbust (Inches)</th>
                      <th className="py-3 px-4">Underbust (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE7] text-[#55464D]">
                    {[
                      { uk: '30B - 30D', us: '30B - 30D', eu: '65B - 65D', fr: '80B - 80D', in: '26" – 28"', cm: '66 – 71 cm' },
                      { uk: '32A - 32D', us: '32A - 32D', eu: '70A - 70D', fr: '85A - 85D', in: '28" – 30"', cm: '71 – 76 cm' },
                      { uk: '34A - 34D', us: '34A - 34D', eu: '75A - 75D', fr: '90A - 90D', in: '30" – 32"', cm: '76 – 81 cm' },
                      { uk: '36A - 36D', us: '36A - 36D', eu: '80A - 80D', fr: '95A - 95D', in: '32" – 34"', cm: '81 – 86 cm' },
                      { uk: '38A - 38D', us: '38A - 38D', eu: '85A - 85D', fr: '100A - 100D', in: '34" – 36"', cm: '86 – 91 cm' },
                      { uk: '40B - 40D', us: '40B - 40D', eu: '90B - 90D', fr: '105B - 105D', in: '36" – 38"', cm: '91 – 96 cm' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#FCFBF9] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#2B1220] font-mono">{row.uk}</td>
                        <td className="py-3 px-4 font-mono">{row.us}</td>
                        <td className="py-3 px-4 font-mono">{row.eu}</td>
                        <td className="py-3 px-4 font-mono">{row.fr}</td>
                        <td className="py-3 px-4 font-mono">{row.in}</td>
                        <td className="py-3 px-4 font-mono">{row.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cup Difference Matrix */}
              <div className="pt-4 border-t border-[#F0EAE7] space-y-3">
                <h4 className="text-sm font-semibold text-[#2B1220]">
                  Cup Size Lettering by Bust-to-Band Difference
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { diff: '1 inch (2.5 cm)', cup: 'A Cup', note: 'Petite fullness' },
                    { diff: '2 inches (5 cm)', cup: 'B Cup', note: 'Standard soft contour' },
                    { diff: '3 inches (7.5 cm)', cup: 'C Cup', note: 'Moderate fullness' },
                    { diff: '4 inches (10 cm)', cup: 'D Cup', note: 'Generous projection' },
                    { diff: '5 inches (12.5 cm)', cup: 'DD / E Cup', note: 'Full silhouette' },
                    { diff: '6 inches (15 cm)', cup: 'F Cup', note: 'Curvy silhouette' },
                  ].map((c, i) => (
                    <div key={i} className="p-3 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] text-center space-y-1">
                      <div className="text-sm font-serif-luxury font-bold text-[#2B1220]">{c.cup}</div>
                      <div className="text-[11px] font-mono text-[#886A72]">{c.diff}</div>
                      <div className="text-[10px] text-[#6E5D65]">{c.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: PANTY SIZING */}
        {activeSection === 'panties' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-6">
              <div>
                <h3 className="text-xl font-serif-luxury font-medium text-[#2B1220]">
                  Panty & Bottoms Sizing Guide
                </h3>
                <p className="text-xs text-[#6E5D65] mt-0.5">
                  Designed for seamless comfort with breathable 100% bamboo cotton intimate gussets.
                </p>
              </div>

              {/* Sizing Table */}
              <div className="overflow-x-auto rounded-xl border border-[#EDE4DE]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F5] border-b border-[#EDE4DE] text-[#2B1220] font-semibold">
                      <th className="py-3 px-4">Size Label</th>
                      <th className="py-3 px-4">Waist (Inches)</th>
                      <th className="py-3 px-4">Waist (cm)</th>
                      <th className="py-3 px-4">Hips (Inches)</th>
                      <th className="py-3 px-4">Hips (cm)</th>
                      <th className="py-3 px-4">Indian Dress Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE7] text-[#55464D]">
                    {[
                      { size: 'XS', waistIn: '24" – 26"', waistCm: '61 – 66 cm', hipIn: '34" – 36"', hipCm: '86 – 91 cm', dress: 'UK 6 / IND XS' },
                      { size: 'S', waistIn: '26" – 28"', waistCm: '66 – 71 cm', hipIn: '36" – 38"', hipCm: '91 – 96 cm', dress: 'UK 8 / IND S' },
                      { size: 'M', waistIn: '28" – 30"', waistCm: '71 – 76 cm', hipIn: '38" – 40"', hipCm: '96 – 101 cm', dress: 'UK 10 / IND M' },
                      { size: 'L', waistIn: '30" – 32"', waistCm: '76 – 81 cm', hipIn: '40" – 42"', hipCm: '101 – 106 cm', dress: 'UK 12 / IND L' },
                      { size: 'XL', waistIn: '32" – 34"', waistCm: '81 – 86 cm', hipIn: '42" – 44"', hipCm: '106 – 111 cm', dress: 'UK 14 / IND XL' },
                      { size: 'XXL', waistIn: '34" – 37"', waistCm: '86 – 94 cm', hipIn: '44" – 47"', hipCm: '111 – 119 cm', dress: 'UK 16 / IND XXL' },
                      { size: 'Free Size', waistIn: '26" – 34"', waistCm: '66 – 86 cm', hipIn: '36" – 44"', hipCm: '91 – 111 cm', dress: 'Adapts S – XL' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#FCFBF9] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#2B1220] font-mono">{row.size}</td>
                        <td className="py-3 px-4 font-mono">{row.waistIn}</td>
                        <td className="py-3 px-4 font-mono">{row.waistCm}</td>
                        <td className="py-3 px-4 font-mono">{row.hipIn}</td>
                        <td className="py-3 px-4 font-mono">{row.hipCm}</td>
                        <td className="py-3 px-4">{row.dress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* How to Measure Bottoms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#2B1220] uppercase">Measuring Your Waist</h4>
                  <p className="text-xs text-[#6E5D65] leading-relaxed">
                    Measure around the natural narrowest point of your torso, typically an inch above your belly button. Keep the tape comfortably snug.
                  </p>
                </div>
                <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#2B1220] uppercase">Measuring Your Hips</h4>
                  <p className="text-xs text-[#6E5D65] leading-relaxed">
                    Stand with your feet together and measure around the widest, fullest part of your hips and buttocks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SISTER SIZING GUIDE */}
        {activeSection === 'sister-sizes' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-5">
              <div>
                <h3 className="text-xl font-serif-luxury font-medium text-[#2B1220]">
                  Understanding "Sister Sizing"
                </h3>
                <p className="text-xs text-[#6E5D65] mt-0.5">
                  Sister sizes share the exact same cup volume, but feature different band circumferences.
                </p>
              </div>

              <div className="prose text-xs text-[#55464D] leading-relaxed space-y-3">
                <p>
                  If a bra cup fits your breasts comfortably but the band feels either too snug or too loose, you do not need to change cup size directly. Instead, shift to a sister size:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                    <span className="text-xs font-semibold text-[#2B1220]">When the Band is Too Tight:</span>
                    <p className="text-xs text-[#6E5D65]">
                      Go UP a band size and DOWN a cup size. Example: If <strong>34C</strong> is suffocating your ribs, try <strong>36B</strong>.
                    </p>
                  </div>
                  <div className="p-4 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-1">
                    <span className="text-xs font-semibold text-[#2B1220]">When the Band is Too Loose:</span>
                    <p className="text-xs text-[#6E5D65]">
                      Go DOWN a band size and UP a cup size. Example: If <strong>34C</strong> rides up your back, try <strong>32D</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sister Size Family Chart */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#886A72]">
                  Common Sister Size Families (Same Cup Capacity)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'B Family', sizes: '30D = 32C = 34B = 36A' },
                    { label: 'C Family', sizes: '30DD = 32D = 34C = 36B = 38A' },
                    { label: 'D Family', sizes: '32DD = 34D = 36C = 38B = 40A' },
                  ].map((f, i) => (
                    <div key={i} className="p-3.5 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE]">
                      <div className="text-xs font-bold text-[#2B1220]">{f.label}</div>
                      <div className="text-xs font-mono text-[#886A72] mt-1">{f.sizes}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: FABRIC CARE & HYGIENE */}
        {activeSection === 'care' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE4DE] shadow-xs space-y-6">
              <div>
                <h3 className="text-xl font-serif-luxury font-medium text-[#2B1220]">
                  Fabric Care & Longevity Protocol
                </h3>
                <p className="text-xs text-[#6E5D65] mt-0.5">
                  Maintain the softness, contour elasticity, and hygiene integrity of your intimate essentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-2">
                  <h4 className="text-xs font-semibold text-[#2B1220] uppercase">1. Silk Satin & Chantilly Lace</h4>
                  <ul className="text-xs text-[#6E5D65] space-y-1 list-disc list-inside leading-relaxed">
                    <li>Hand wash in cool water with silk-safe liquid detergent.</li>
                    <li>Never wring or twist delicate scalloped eyelash lace.</li>
                    <li>Press gently between dry towels and lay flat in the shade.</li>
                    <li>Avoid direct iron heat; use cool steam from a distance.</li>
                  </ul>
                </div>

                <div className="p-5 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-2">
                  <h4 className="text-xs font-semibold text-[#2B1220] uppercase">2. Seamless Laser-Cut Microfibres</h4>
                  <ul className="text-xs text-[#6E5D65] space-y-1 list-disc list-inside leading-relaxed">
                    <li>Machine wash in cold water using a protective lingerie mesh bag.</li>
                    <li>Fasten bra hooks prior to washing to prevent snagging.</li>
                    <li>Never tumble dry—high heat degrades micro-bonding adhesives.</li>
                    <li>Reshape molded cups immediately while damp.</li>
                  </ul>
                </div>

                <div className="p-5 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-2">
                  <h4 className="text-xs font-semibold text-[#2B1220] uppercase">3. Combed Cotton & Bamboo Liners</h4>
                  <ul className="text-xs text-[#6E5D65] space-y-1 list-disc list-inside leading-relaxed">
                    <li>Wash with gentle eco-friendly detergents free of bleaching agents.</li>
                    <li>Line dry in indirect sunlight for natural sanitisation.</li>
                    <li>Gusset materials are hypoallergenic and antimicrobial.</li>
                  </ul>
                </div>

                <div className="p-5 bg-[#FAF7F5] rounded-xl border border-[#EDE4DE] space-y-2">
                  <h4 className="text-xs font-semibold text-[#2B1220] uppercase">4. Sanitary Hygiene Seals</h4>
                  <p className="text-xs text-[#6E5D65] leading-relaxed">
                    For your intimate health, panties and lingerie sets are fitted with sealed hygiene strips. When trying on sets for size confirmation, please keep your existing undergarments on and leave the seal untouched.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="p-8 bg-[#2B1220] text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-2xl font-serif-luxury font-medium">Ready to Experience True Comfort?</h3>
            <p className="text-xs text-[#EED0C9] max-w-lg leading-relaxed">
              Explore our collection of seamless wire-free bras, silk briefs, and coordinating luxury sets delivered in 100% discreet packaging.
            </p>
          </div>
          <button
            onClick={onBackToShop}
            className="px-8 py-3.5 bg-white text-[#2B1220] hover:bg-[#FAF0ED] text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Explore Collection</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
