import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Ruler,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Lightbulb,
  Scan,
  Palette
} from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { normalizeAssetUrl } from '../utils/assetUrl';

export const HowAiModelsWorkPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const [activeTab, setActiveTab] = useState<'size' | 'outfit'>('size');

  const heroMedia = useMemo(() => {
    if (settings.heroMediaUrl) {
      const isVid = settings.heroMediaType === 'video' || /\.(mp4|webm|ogg)$/i.test(settings.heroMediaUrl);
      return {
        url: normalizeAssetUrl(settings.heroMediaUrl),
        type: isVid ? ('video' as const) : ('image' as const),
      };
    }
    if (Array.isArray(settings.heroSlides) && settings.heroSlides.length > 0) {
      const active = settings.heroSlides.find(s => s.active !== false);
      if (active && active.url) {
        const url = normalizeAssetUrl(active.url);
        const isVid = active.type === 'video' || /\.(mp4|webm|ogg)$/i.test(url);
        return {
          url,
          type: isVid ? ('video' as const) : ('image' as const),
        };
      }
    }
    return {
      url: '/uploads/hero.webp',
      type: 'image' as const,
    };
  }, [settings.heroMediaUrl, settings.heroMediaType, settings.heroSlides]);

  return (
    <div className="w-full bg-[#F7F4EB] min-h-screen">
      <SEOHelmet
        title="How AI Models Work | AI Foot Size Finder & Traditional Outfit Matcher"
        description="Learn how our dual AI models work: AI Camera Foot Size Calibration for millimeter-accurate Peshawari Chappal fit and AI Cultural Outfit Matcher for leather harmony."
        keywords="how ai size finder works, camera foot measurement, a4 paper calibration, ai outfit matcher, peshawari chappal size guide"
      />

      {/* Hero Header matching Product and other pages */}
      <section className="relative overflow-hidden min-h-[380px] sm:min-h-[440px] text-[#F7F4EB] py-14 sm:py-20 px-4 sm:px-6 lg:px-8 select-none flex items-center justify-center">
        {/* Background Media Layer */}
        <div className="absolute inset-0 w-full h-full">
          {heroMedia.type === 'video' ? (
            <video
              src={heroMedia.url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-[78%_center] sm:object-center"
            />
          ) : (
            <img
              src={heroMedia.url || '/uploads/hero.webp'}
              alt="How Our AI Models Work"
              className="w-full h-full object-cover object-[78%_center] sm:object-center"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/uploads/hero.webp')) {
                  target.src = '/uploads/hero.webp';
                }
              }}
            />
          )}
        </div>

        {/* Contrast Overlay: Olive Drab rich gradient matching other pages */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#565449]/95 via-[#565449]/80 to-[#45433A]/75 pointer-events-none z-[1]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F7F4EB]/15 border border-[#F7F4EB]/30 backdrop-blur-xs text-xs font-semibold text-[#F7F4EB] uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Computer Vision For Artisanal Footwear</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            How Our AI Models Work
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#F7F4EB]/85 leading-relaxed font-light">
            We engineered two bespoke AI models to eliminate guesswork when ordering authentic Peshawari Chappals online: 
            sub-millimeter camera size calibration and subcontinental cultural color matching.
          </p>

          {/* Quick Tab Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('size')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                activeTab === 'size'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105'
                  : 'bg-black/30 text-white hover:bg-black/50 border border-white/20'
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>1. AI Foot Size Finder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outfit')}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                activeTab === 'outfit'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105'
                  : 'bg-black/30 text-white hover:bg-black/50 border border-white/20'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>2. AI Outfit Matcher</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">

        {/* Model 1: AI Foot Size Finder Detailed Walkthrough */}
        <div id="ai-size-finder-section" className={`space-y-10 transition-all ${activeTab === 'outfit' ? 'opacity-85' : 'opacity-100'}`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white rounded-3xl p-6 sm:p-10 border border-[#A0988A]/40 shadow-sm">
            <div className="space-y-4 lg:w-3/5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold uppercase tracking-wider">
                <Scan className="w-3.5 h-3.5 text-cyan-600" />
                <span>Model 01 • Calibration Engine</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A18]">
                AI Foot Size Calibration
              </h2>

              <p className="text-sm sm:text-base text-[#1A1A18]/80 leading-relaxed">
                Traditional Peshawari Chappals are handcrafted around solid wooden lasts that do not bend like sports sneakers. 
                Our camera calibration model uses a standard international <strong>A4 sheet of paper (210mm × 297mm)</strong> as a known physical reference anchor to calculate your foot’s true dimensions with sub-millimeter precision.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/size-finder"
                  className="px-6 py-3 rounded-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <span>Launch AI Size Finder</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-[#A0988A]">Requires smartphone camera & A4 paper</span>
              </div>
            </div>

            <div className="lg:w-2/5 flex items-center justify-center">
              <div className="relative rounded-2xl border-2 border-cyan-400/70 shadow-[0_0_25px_rgba(56,189,248,0.25)] bg-slate-950 p-4 max-w-xs w-full text-center">
                <img
                  src="/images/ai-foot-scanner-visual.png"
                  alt="AI Foot Scanning Camera Visualization"
                  className="w-full h-44 object-contain mx-auto"
                />
                <div className="mt-3 pt-3 border-t border-cyan-500/30 text-left">
                  <div className="flex items-center justify-between text-[11px] text-cyan-300 font-mono">
                    <span>ACCURACY: ±1.5mm</span>
                    <span>CALIBRATED: A4 REF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Cards for Size Finder */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl text-[#1A1A18] flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#565449] text-[#F7F4EB] text-xs flex items-center justify-center font-bold">1</span>
              How To Measure In 4 Simple Steps
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
                  01
                </div>
                <h4 className="font-bold text-sm text-[#1A1A18]">Place A4 Paper</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Put a clean, unwrinkled white A4 paper flat on a hard, even floor against a wall or baseboard.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
                  02
                </div>
                <h4 className="font-bold text-sm text-[#1A1A18]">Step On Barefoot</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Place your bare foot firmly in the center of the sheet with your heel lightly touching the back edge.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
                  03
                </div>
                <h4 className="font-bold text-sm text-[#1A1A18]">Capture 90° Angle</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Hold your phone level directly above your foot so all four corners of the A4 paper are visible in frame.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
                  04
                </div>
                <h4 className="font-bold text-sm text-[#1A1A18]">Instant Size Match</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Our model corrects perspective tilt, computes foot length in mm, and recommends your exact size and bridge fit.
                </p>
              </div>
            </div>
          </div>

          {/* Pro Tips Banner */}
          <div className="bg-[#565449]/10 rounded-2xl p-5 border border-[#565449]/20 flex items-start gap-4">
            <Lightbulb className="w-6 h-6 text-[#565449] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm text-[#1A1A18]/90">
              <span className="font-bold block text-[#1A1A18]">Tips for 100% Sizing Precision:</span>
              <p>
                Ensure uniform room lighting without harsh shadows across the paper edge. 
                Do not wear socks while scanning. If your measurements fall between two sizes, our artisan sizing algorithm will advise you on whether a standard or wide bridge cut is optimal.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-[#A0988A]/30" />

        {/* Model 2: AI Traditional Outfit Matcher Detailed Walkthrough */}
        <div id="ai-outfit-matcher-section" className={`space-y-10 transition-all ${activeTab === 'size' ? 'opacity-85' : 'opacity-100'}`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white rounded-3xl p-6 sm:p-10 border border-[#A0988A]/40 shadow-sm">
            <div className="space-y-4 lg:w-3/5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5 text-amber-700" />
                <span>Model 02 • Cultural Styling & Tone Engine</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A18]">
                AI Traditional Outfit Matcher
              </h2>

              <p className="text-sm sm:text-base text-[#1A1A18]/80 leading-relaxed">
                Wearing the wrong leather color with traditional attire can diminish an otherwise regal look. 
                Our AI Outfit Matcher analyzes your fabric’s hue, saturation, and texture to recommend complementary pure leather shades 
                (Saddle Tan, Espresso Brown, Camel, Midnight Black, Slate Grey, Imperial Maroon) and classic silhouette designs.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  to="/outfit-matcher"
                  className="px-6 py-3 rounded-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
                >
                  <span>Launch AI Outfit Matcher</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-[#A0988A]">Works with Shalwar Kameez, Kurta, Suits</span>
              </div>
            </div>

            <div className="lg:w-2/5 flex items-center justify-center">
              <div className="relative rounded-2xl border-2 border-cyan-400/70 shadow-[0_0_25px_rgba(56,189,248,0.25)] bg-slate-950 p-4 max-w-xs w-full text-center">
                <img
                  src="/images/ai-outfit-matcher-visual.png"
                  alt="AI Outfit Matcher Matching Clothing to Chappal"
                  className="w-full h-44 object-contain mx-auto"
                />
                <div className="mt-3 pt-3 border-t border-cyan-500/30 text-left">
                  <div className="flex items-center justify-between text-[11px] text-cyan-300 font-mono">
                    <span>PALETTE: HARMONY</span>
                    <span>CUT: STATELY KAPTAAN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outfit Matching Rules Breakdown */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl text-[#1A1A18] flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#565449] text-[#F7F4EB] text-xs flex items-center justify-center font-bold">2</span>
              How The Styling Engine Categorizes Colors
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs">
                <div className="h-3 w-16 rounded-full bg-gradient-to-r from-[#F7F4EB] to-[#C19A6B]" />
                <h4 className="font-bold text-sm text-[#1A1A18]">White, Off-White & Cream</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Best matched with <strong>Saddle Tan, Camel Brown, or Burnt Copper</strong>. Creates authentic daytime contrast and enhances the rich leather grain.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs">
                <div className="h-3 w-16 rounded-full bg-gradient-to-r from-[#1A1A18] to-[#5A6065]" />
                <h4 className="font-bold text-sm text-[#1A1A18]">Black, Charcoal & Navy</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Best matched with <strong>Midnight Black or Slate Grey</strong> with tire soles for a powerful, regal presence at evening receptions.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#A0988A]/30 space-y-2 shadow-2xs">
                <div className="h-3 w-16 rounded-full bg-gradient-to-r from-[#8C3A18] to-[#7B4A28]" />
                <h4 className="font-bold text-sm text-[#1A1A18]">Earthy Green, Olive & Rust</h4>
                <p className="text-xs text-[#1A1A18]/75 leading-relaxed">
                  Best matched with <strong>Espresso Brown or Imperial Maroon</strong> for rich heritage harmony that exudes quiet confidence.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust, Privacy & Guarantee Section */}
        <div className="rounded-3xl bg-[#565449] text-[#F7F4EB] p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>100% Privacy Guaranteed</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                Your Photos Never Leave Your Phone
              </h3>
              <p className="text-xs sm:text-sm text-[#F7F4EB]/85 leading-relaxed font-light">
                Our AI vision inference executes entirely on-device inside your web browser. 
                Your camera frames, foot images, and outfit snapshots are analyzed locally and never stored on our cloud servers.
              </p>
            </div>

            <div className="space-y-3 bg-white/10 rounded-2xl p-5 border border-white/20">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-300" />
                <h4 className="font-bold text-sm sm:text-base">Guaranteed Artisanal Fit</h4>
              </div>
              <p className="text-xs text-[#F7F4EB]/85 leading-relaxed font-light">
                Every pair of Khyber Sole chappals comes with our Hassle-Free Size Guarantee. 
                If the size recommended by the AI Size Finder doesn’t feel like a custom glove, we replace it with zero exchange fees.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Strip */}
        <div className="text-center space-y-4 pt-4">
          <h3 className="font-serif text-2xl font-bold text-[#1A1A18]">
            Ready To Experience AI Footwear Sizing?
          </h3>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/size-finder"
              className="px-6 py-3 rounded-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              Try AI Size Finder
            </Link>
            <Link
              to="/outfit-matcher"
              className="px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              Try AI Outfit Matcher
            </Link>
            <Link
              to="/products"
              className="px-6 py-3 rounded-full bg-[#F7F4EB] hover:bg-[#EAE4D3] text-[#1A1A18] border border-[#A0988A]/50 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              Browse Handcrafted Catalog
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
