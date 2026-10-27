import React, { useState } from 'react';
import { X, Ruler, Sparkles, HelpCircle, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const SizeGuideModal: React.FC = () => {
  const { sizeGuideOpen, closeSizeGuide, sizeGuideCategory, settings } = useCart();
  const [activeTab, setActiveTab] = useState<'bras' | 'panties' | 'calculator'>('calculator');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  // Calculator state
  const [underbust, setUnderbust] = useState<number>(30);
  const [bust, setBust] = useState<number>(34);

  if (!sizeGuideOpen) return null;

  // Bra calculation math
  const calculateBraSize = () => {
    let ubInches = unit === 'cm' ? underbust / 2.54 : underbust;
    let bInches = unit === 'cm' ? bust / 2.54 : bust;

    if (ubInches <= 0 || bInches <= 0 || bInches < ubInches) {
      return { band: '--', cup: '--', recommended: 'Please check measurements', sister: '' };
    }

    // Band calculation (conventional standard)
    let roundedBand = Math.round(ubInches);
    if (roundedBand % 2 !== 0) {
      roundedBand += 1;
    }
    // Cup difference
    const diff = Math.round(bInches - ubInches);
    let cup = 'A';
    if (diff <= 1) cup = 'A';
    else if (diff === 2) cup = 'B';
    else if (diff === 3) cup = 'C';
    else if (diff === 4) cup = 'D';
    else if (diff === 5) cup = 'DD/E';
    else cup = 'F+';

    const recommended = `${roundedBand}${cup}`;

    // Sister sizes
    const sisterTighter = `${roundedBand - 2}${cup === 'B' ? 'C' : cup === 'C' ? 'D' : 'B'}`;
    const sisterLooser = `${roundedBand + 2}${cup === 'B' ? 'A' : cup === 'C' ? 'B' : 'C'}`;

    return {
      band: `${roundedBand}`,
      cup,
      recommended,
      sister: `Tighter band: ${sisterTighter} · Looser band: ${sisterLooser}`,
    };
  };

  const calculated = calculateBraSize();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EDE4DE] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F0EAE7] flex items-center justify-between bg-[#FCFAF8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#3D1E2F] flex items-center justify-center">
              <Ruler size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#2B1220]">
                Interactive Sizing & Fit Guide
              </h2>
              <p className="text-xs text-[#886A72]">
                Find your perfect comfortable silhouette with zero guesswork
              </p>
            </div>
          </div>
          <button
            onClick={closeSizeGuide}
            className="p-1.5 text-[#886A72] hover:text-[#2B1220] rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#F0EAE7] bg-white">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              activeTab === 'calculator'
                ? 'border-[#2B1220] text-[#2B1220]'
                : 'border-transparent text-[#6E5D65] hover:text-[#2B1220]'
            }`}
          >
            Interactive Bra Size Calculator
          </button>
          <button
            onClick={() => setActiveTab('bras')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              activeTab === 'bras'
                ? 'border-[#2B1220] text-[#2B1220]'
                : 'border-transparent text-[#6E5D65] hover:text-[#2B1220]'
            }`}
          >
            Bra Size Chart
          </button>
          <button
            onClick={() => setActiveTab('panties')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-colors ${
              activeTab === 'panties'
                ? 'border-[#2B1220] text-[#2B1220]'
                : 'border-transparent text-[#6E5D65] hover:text-[#2B1220]'
            }`}
          >
            Panty & Brief Sizing
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              {/* Unit Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6E5D65]">Choose Measurement Unit:</span>
                <div className="flex items-center p-1 bg-[#F5EFEA] rounded-md text-xs font-medium">
                  <button
                    onClick={() => setUnit('inches')}
                    className={`px-3 py-1 rounded transition-colors ${
                      unit === 'inches' ? 'bg-white text-[#2B1220] shadow-sm' : 'text-[#6E5D65]'
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    onClick={() => setUnit('cm')}
                    className={`px-3 py-1 rounded transition-colors ${
                      unit === 'cm' ? 'bg-white text-[#2B1220] shadow-sm' : 'text-[#6E5D65]'
                    }`}
                  >
                    Centimetres (cm)
                  </button>
                </div>
              </div>

              {/* Slider Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#FAF7F5] p-5 rounded-xl border border-[#EDE4DE]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-[#2B1220]">
                    <span>1. Underbust (Band snug)</span>
                    <span className="font-mono font-bold text-[#622D52]">
                      {underbust} {unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={unit === 'inches' ? 26 : 65}
                    max={unit === 'inches' ? 44 : 112}
                    step={unit === 'inches' ? 0.5 : 1}
                    value={underbust}
                    onChange={(e) => setUnderbust(parseFloat(e.target.value))}
                    className="w-full accent-[#2B1220]"
                  />
                  <p className="text-[11px] text-[#886A72]">
                    Measure directly under your bust, keeping tape parallel to ground.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-[#2B1220]">
                    <span>2. Overbust (Fullest point)</span>
                    <span className="font-mono font-bold text-[#622D52]">
                      {bust} {unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={unit === 'inches' ? 28 : 70}
                    max={unit === 'inches' ? 50 : 125}
                    step={unit === 'inches' ? 0.5 : 1}
                    value={bust}
                    onChange={(e) => setBust(parseFloat(e.target.value))}
                    className="w-full accent-[#2B1220]"
                  />
                  <p className="text-[11px] text-[#886A72]">
                    Measure gently across the fullest part of your bust while breathing normally.
                  </p>
                </div>
              </div>

              {/* Result Showcase Card */}
              <div className="p-5 rounded-xl bg-[#2B1220] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs text-[#EED0C9] uppercase tracking-wider font-medium">
                    Recommended Starting Size
                  </span>
                  <div className="text-3xl font-serif-luxury font-bold tracking-wide">
                    {calculated.recommended}
                  </div>
                  <div className="text-xs text-[#FAF0ED]/80 font-mono">
                    Band: {calculated.band} · Cup: {calculated.cup}
                  </div>
                </div>

                <div className="text-xs text-[#FAF0ED]/90 bg-white/10 px-4 py-2.5 rounded-lg border border-white/15 max-w-xs text-center sm:text-right">
                  <div className="font-medium text-[#EED0C9] mb-0.5">Sister Sizes for Best Fit:</div>
                  <div>{calculated.sister}</div>
                </div>
              </div>

              {/* Fit Tips */}
              <div className="text-xs text-[#55464D] space-y-1.5 bg-[#FAF6F4] p-4 rounded-xl border border-[#EDE5E0]">
                <div className="font-semibold text-[#2B1220] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#886A72]" />
                  <span>Personal Consultation Available</span>
                </div>
                <p className="text-[11px] text-[#6E5D65]">
                  Not sure between two sizes? Our intimate stylists provide 1-on-1 confidential sizing guidance via Instagram DM ({settings.instagramHandle || '@auraintimates'}) prior to dispatch.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'bras' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8DFD9] bg-[#FAF7F5] text-[#2B1220]">
                      <th className="py-2.5 px-3 font-semibold">Underbust (Inches)</th>
                      <th className="py-2.5 px-3 font-semibold">Band Size</th>
                      <th className="py-2.5 px-3 font-semibold">Bust Difference</th>
                      <th className="py-2.5 px-3 font-semibold">Cup Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE7] font-mono tabular-nums text-[#55464D]">
                    <tr><td className="py-2 px-3">28" - 29"</td><td className="py-2 px-3 font-medium text-[#2B1220]">30</td><td className="py-2 px-3">1" difference</td><td className="py-2 px-3">A Cup</td></tr>
                    <tr><td className="py-2 px-3">30" - 31"</td><td className="py-2 px-3 font-medium text-[#2B1220]">32</td><td className="py-2 px-3">2" difference</td><td className="py-2 px-3">B Cup</td></tr>
                    <tr><td className="py-2 px-3">32" - 33"</td><td className="py-2 px-3 font-medium text-[#2B1220]">34</td><td className="py-2 px-3">3" difference</td><td className="py-2 px-3">C Cup</td></tr>
                    <tr><td className="py-2 px-3">34" - 35"</td><td className="py-2 px-3 font-medium text-[#2B1220]">36</td><td className="py-2 px-3">4" difference</td><td className="py-2 px-3">D Cup</td></tr>
                    <tr><td className="py-2 px-3">36" - 37"</td><td className="py-2 px-3 font-medium text-[#2B1220]">38</td><td className="py-2 px-3">5" difference</td><td className="py-2 px-3">DD / E Cup</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'panties' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8DFD9] bg-[#FAF7F5] text-[#2B1220]">
                      <th className="py-2.5 px-3 font-semibold">Size</th>
                      <th className="py-2.5 px-3 font-semibold">Waist (Inches)</th>
                      <th className="py-2.5 px-3 font-semibold">Hips (Inches)</th>
                      <th className="py-2.5 px-3 font-semibold">Standard Fit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE7] font-mono tabular-nums text-[#55464D]">
                    <tr><td className="py-2 px-3 font-semibold text-[#2B1220]">S</td><td className="py-2 px-3">26" - 27"</td><td className="py-2 px-3">35" - 37"</td><td className="py-2 px-3 font-sans">Snug / Mid-rise</td></tr>
                    <tr><td className="py-2 px-3 font-semibold text-[#2B1220]">M</td><td className="py-2 px-3">28" - 29"</td><td className="py-2 px-3">38" - 40"</td><td className="py-2 px-3 font-sans">Classic Comfort</td></tr>
                    <tr><td className="py-2 px-3 font-semibold text-[#2B1220]">L</td><td className="py-2 px-3">30" - 32"</td><td className="py-2 px-3">41" - 43"</td><td className="py-2 px-3 font-sans">Full Coverage</td></tr>
                    <tr><td className="py-2 px-3 font-semibold text-[#2B1220]">XL</td><td className="py-2 px-3">33" - 35"</td><td className="py-2 px-3">44" - 46"</td><td className="py-2 px-3 font-sans">Relaxed Contour</td></tr>
                    <tr><td className="py-2 px-3 font-semibold text-[#2B1220]">XXL</td><td className="py-2 px-3">36" - 38"</td><td className="py-2 px-3">47" - 49"</td><td className="py-2 px-3 font-sans">Curvaceous Fit</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F0EAE7] bg-[#FCFAF8] flex justify-end">
          <button
            onClick={closeSizeGuide}
            className="px-5 py-2 bg-[#2B1220] hover:bg-[#3D1E2F] text-white text-xs font-semibold rounded-md transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
