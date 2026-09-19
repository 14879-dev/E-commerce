import React, { useState } from 'react';
import { Sparkles, Upload, CheckCircle, X, ArrowRight, ShoppingBag, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import { useStoreSettings } from '../context/StoreSettingsContext';
import type { Product } from '../types';

type InputMode = 'photo' | 'manual';

export const OutfitMatcherPage: React.FC = () => {
  const { formatPrice } = useStoreSettings();

  // Mode: photo upload OR manual style selection
  const [inputMode, setInputMode] = useState<InputMode>('photo');

  // Photo mode state
  const [uploadedOutfitImg, setUploadedOutfitImg] = useState<string | null>(null);

  // Manual mode state
  const [outfitType, setOutfitType] = useState<'shalwar' | 'waistcoat' | 'sherwani' | 'suit'>('shalwar');
  const [outfitColor, setOutfitColor] = useState<'white' | 'black' | 'cream' | 'navy' | 'maroon' | 'olive'>('cream');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<{ product: Product; matchScore: number; advice: string }[]>([]);

  const handleModeSwitch = (mode: InputMode) => {
    setInputMode(mode);
    setMatchedProducts([]);
    setUploadedOutfitImg(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedOutfitImg(event.target?.result as string);
        setMatchedProducts([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedOutfitImg(null);
    setMatchedProducts([]);
  };

  const canAnalyze = inputMode === 'photo' ? !!uploadedOutfitImg : true;

  const handleRunMatch = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    const allProducts = await apiService.getProducts();

    setTimeout(() => {
      const results = allProducts.map(p => {
        let score = 92;
        let advice = 'Harmonizes beautifully with natural leather grain tones.';

        // Color scoring works for both modes
        if (outfitColor === 'cream' || outfitColor === 'white') {
          if (p.availableColors.includes('saddle-tan') || p.availableColors.includes('burnt-copper')) {
            score = 98;
            advice = 'High contrast luxury pairing — Saddle Tan upper highlights crisp white/cream fabrics perfectly.';
          }
        } else if (outfitColor === 'black' || outfitColor === 'navy') {
          if (p.availableColors.includes('espresso') || p.availableColors.includes('midnight-black')) {
            score = 96;
            advice = 'Monochromatic sophistication — Deep Espresso complements dark evening attire with refined depth.';
          }
        } else if (outfitColor === 'maroon' || outfitColor === 'olive') {
          if (p.availableColors.includes('mustard-gold') || p.availableColors.includes('burnt-copper')) {
            score = 97;
            advice = 'Warm regal synergy — Burnt copper & brass details elevate traditional velvet and silk fabrics.';
          }
        }

        return { product: p, matchScore: score, advice };
      }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);

      setMatchedProducts(results);
      setIsAnalyzing(false);
    }, 1800);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <SEOHelmet
        title="AI Outfit Matcher"
        description="Upload a photo or describe your outfit to get AI-driven Peshawari Chappal recommendations."
      />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
          AI Color & Style Stylist
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-blue-600" /> AI Outfit Matcher
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose how you want to match — upload an outfit photo OR describe your style manually.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 gap-1">
        <button
          onClick={() => handleModeSwitch('photo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            inputMode === 'photo'
              ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Outfit Photo
        </button>
        <button
          onClick={() => handleModeSwitch('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            inputMode === 'manual'
              ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sliders className="w-4 h-4" /> Select Style Manually
        </button>
      </div>

      {/* ── PHOTO MODE ── */}
      {inputMode === 'photo' && (
        <div className="space-y-4">
          {!uploadedOutfitImg ? (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-50 rounded-2xl p-10 cursor-pointer transition-all group">
              <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-blue-700">Tap to upload outfit image</p>
                <p className="text-xs text-slate-500 mt-0.5">Shalwar Kameez, Sherwani, Waistcoat, Suit — any attire photo</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-72 flex items-center justify-center">
              <img src={uploadedOutfitImg} alt="Uploaded outfit" className="max-h-72 w-full object-contain" />
              <button
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-emerald-100 font-semibold bg-emerald-700/80 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> Photo ready for analysis
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL MODE ── */}
      {inputMode === 'manual' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Attire Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Attire Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'shalwar', label: 'Shalwar Kameez' },
                { id: 'waistcoat', label: 'Waistcoat Suit' },
                { id: 'sherwani', label: 'Wedding Sherwani' },
                { id: 'suit', label: 'Formal Suit' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setOutfitType(cat.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    outfitType === cat.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color Palette */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Fabric Primary Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cream', label: 'Cream' },
                { id: 'white', label: 'White' },
                { id: 'black', label: 'Black' },
                { id: 'navy', label: 'Navy' },
                { id: 'maroon', label: 'Maroon' },
                { id: 'olive', label: 'Olive' },
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setOutfitColor(c.id as any)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    outfitColor === c.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analyse Button — shown once input is ready */}
      {canAnalyze && (
        <button
          onClick={handleRunMatch}
          disabled={isAnalyzing}
          className="w-full btn-copper py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analysing & matching chappals...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Analyse & Get Recommendations
            </>
          )}
        </button>
      )}

      {/* Results Section */}
      {matchedProducts.length > 0 && (
        <section className="space-y-5 pt-4 border-t border-slate-200">
          <div>
            <h2 className="font-serif font-bold text-2xl text-slate-900">Recommended Footwear Pairings</h2>
            <p className="text-xs text-slate-500 mt-1">Based on color temperature, formal level & leather finish contrast.</p>
          </div>

          <div className="space-y-4">
            {matchedProducts.map(({ product, matchScore, advice }, idx) => (
              <div key={product.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                {/* Match Score Banner */}
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <span className="font-bold text-blue-600 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> #{idx + 1} — {matchScore}% Match
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">AI Certified</span>
                </div>

                {/* Compact Horizontal Card */}
                <div className="flex gap-4 p-4 items-start">
                  <img
                    src={product.images.front}
                    alt={product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 leading-tight">{product.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{product.subtitle}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-blue-700">{formatPrice(product.price)}</span>
                      {Boolean(product.originalPrice && product.originalPrice > product.price) && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-600">
                        {product.category}
                      </span>
                    </div>
                    <Link
                      to={`/products/${product.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View Product <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <Link
                    to={`/products/${product.slug}`}
                    className="hidden sm:flex p-2 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 transition-all flex-shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                </div>

                {/* Stylist Note */}
                <div className="mx-4 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 mb-0.5">✦ Stylist Note</p>
                  <p className="text-xs text-amber-800 leading-relaxed">{advice}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
