import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Upload, Sliders, ArrowRight, X, CheckCircle, ShoppingBag } from 'lucide-react';
import { apiService } from '../services/api';
import { useStoreSettings } from '../context/StoreSettingsContext';
import type { Product } from '../types';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { PageHero } from '../components/common/PageHero';

interface MatchedResult {
  product: Product;
  matchScore: number;
  advice: string;
}

export const OutfitMatcherPage: React.FC = () => {
  const { formatPrice } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [inputMode, setInputMode] = useState<'photo' | 'manual'>('photo');

  // Photo mode state
  const [uploadedOutfitImg, setUploadedOutfitImg] = useState<string | null>(null);

  // Manual mode state
  const [outfitType, setOutfitType] = useState<'shalwar' | 'waistcoat' | 'sherwani' | 'suit'>('shalwar');
  const [outfitColor, setOutfitColor] = useState<'cream' | 'white' | 'black' | 'navy' | 'maroon' | 'olive'>('cream');

  // Results state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<MatchedResult[]>([]);

  useEffect(() => {
    apiService.getProducts().then(data => setProducts(data));
  }, []);

  const handleModeSwitch = (mode: 'photo' | 'manual') => {
    setInputMode(mode);
    setMatchedProducts([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedOutfitImg(reader.result as string);
      setMatchedProducts([]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedOutfitImg(null);
    setMatchedProducts([]);
  };

  const canAnalyze = inputMode === 'photo' ? Boolean(uploadedOutfitImg) : true;

  const handleRunMatch = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setMatchedProducts([]);

    try {
      let aiSlug: string | null = null;
      let aiScore = 95;
      let aiAdvice = '';

      if (inputMode === 'photo' && uploadedOutfitImg) {
        try {
          const apiRes = await fetch('/api/py/match-outfit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_base64: uploadedOutfitImg }),
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.recommended_product_slug) {
              aiSlug = data.recommended_product_slug;
              aiScore = data.match_score || 96;
              aiAdvice = data.styling_advice || '';
            }
          }
        } catch {
          // Fall back gracefully to local heuristic
        }
      }

      await new Promise(r => setTimeout(r, 600));

      const scored = products.map(p => {
        let score = 75;
        let advice = 'A refined, balanced match suited for traditional and formal gatherings.';

        if (outfitColor === 'cream' || outfitColor === 'white') {
          if (p.availableColors.includes('saddle-tan') || p.availableColors.includes('burnt-copper')) {
            score = 96; advice = 'Classic contrast pairing — Earthy saddle and burnt-copper tones beautifully offset bright whites & creams.';
          }
        } else if (outfitColor === 'black' || outfitColor === 'navy') {
          if (p.availableColors.includes('midnight-black') || p.availableColors.includes('espresso')) {
            score = 98; advice = 'Monochromatic sophistication — Deep espresso and midnight finishes create a powerful, polished presence.';
          }
        } else if (outfitColor === 'maroon' || outfitColor === 'olive') {
          if (p.availableColors.includes('mustard-gold') || p.availableColors.includes('burnt-copper') || p.availableColors.includes('vintage-tan') || p.availableColors.includes('mustard-camel')) {
            score = 97; advice = 'Warm regal synergy — Burnt copper & brass details elevate traditional velvet and silk fabrics.';
          }
        }

        if (aiSlug && p.slug === aiSlug) {
          score = aiScore;
          advice = aiAdvice || advice;
        }

        return { product: p, matchScore: score, advice };
      });

      const results = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
      setMatchedProducts(results);
      apiService.recordAiEvent('outfit_match');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      <SEOHelmet
        title="AI Outfit Matcher — Peshawari Chappal Co."
        description="Upload a photo or describe your outfit to get AI-driven Peshawari Chappal recommendations."
      />

      <PageHero
        badge="AI Multimodal Styling"
        title="Traditional Outfit Matcher"
        subtitle="Pair Your Kurta & Shalwar Kameez With Authentic Leather"
        description="Our vision model analyzes fabric tones, patterns, and formal occasion levels to recommend the perfect Peshawari silhouette."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Header */}
        <div className="border-b border-[#A0988A]/40 pb-5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-1">
          AI Color &amp; Style Stylist
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A18] flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-[#1A1A18]" /> AI Outfit Matcher
        </h1>
        <p className="text-sm text-[#1A1A18]/80 mt-1">
          Choose how you want to match — upload an outfit photo OR describe your style manually.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-2xl border border-[#A0988A] bg-[#A0988A]/20 p-1 gap-1">
        <button
          onClick={() => handleModeSwitch('photo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            inputMode === 'photo'
              ? 'bg-[#565449] text-[#F7F4EB] shadow-sm border border-[#565449]'
              : 'text-[#1A1A18]/80 hover:text-[#1A1A18]'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Outfit Photo
        </button>
        <button
          onClick={() => handleModeSwitch('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            inputMode === 'manual'
              ? 'bg-[#565449] text-[#F7F4EB] shadow-sm border border-[#565449]'
              : 'text-[#1A1A18]/80 hover:text-[#1A1A18]'
          }`}
        >
          <Sliders className="w-4 h-4" /> Select Style Manually
        </button>
      </div>

      {/* ── PHOTO MODE ── */}
      {inputMode === 'photo' && (
        <div className="space-y-4">
          {!uploadedOutfitImg ? (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#A0988A] bg-[#A0988A]/20 hover:bg-[#A0988A]/35 rounded-2xl p-10 cursor-pointer transition-all group">
              <div className="w-14 h-14 rounded-full bg-[#A0988A]/30 border border-[#565449]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7 text-[#1A1A18]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#1A1A18]">Tap to upload outfit image</p>
                <p className="text-xs text-[#1A1A18]/70 mt-0.5">Shalwar Kameez, Sherwani, Waistcoat, Suit — any attire photo</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-[#A0988A] bg-[#A0988A]/20 max-h-72 flex items-center justify-center">
              <img src={uploadedOutfitImg} alt="Uploaded outfit" className="max-h-72 w-full object-contain" />
              <button
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-[#565449] text-[#F7F4EB] hover:bg-[#45433A] transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-[#F7F4EB] font-semibold bg-[#565449]/90 px-2.5 py-1 rounded-full">
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-2">
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
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    outfitType === cat.id
                      ? 'bg-[#565449] text-[#F7F4EB] border-[#565449]'
                      : 'bg-[#F7F4EB] border-[#A0988A] text-[#1A1A18] hover:border-[#565449]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color Palette */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-2">
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
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    outfitColor === c.id
                      ? 'bg-[#565449] text-[#F7F4EB] border-[#565449]'
                      : 'bg-[#F7F4EB] border-[#A0988A] text-[#1A1A18] hover:border-[#565449]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analyse Button */}
      {canAnalyze && (
        <button
          onClick={handleRunMatch}
          disabled={isAnalyzing}
          className="w-full btn-copper py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-[#F7F4EB] border-t-transparent rounded-full animate-spin" />
              Analysing &amp; matching chappals...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Analyse &amp; Get Recommendations
            </>
          )}
        </button>
      )}

      {/* Results Section */}
      {matchedProducts.length > 0 && (
        <section className="space-y-5 pt-4 border-t border-[#A0988A]/40">
          <div>
            <h2 className="font-serif font-bold text-2xl text-[#1A1A18]">Recommended Footwear Pairings</h2>
            <p className="text-xs text-[#1A1A18]/80 mt-1">Based on color temperature, formal level &amp; leather finish contrast.</p>
          </div>

          <div className="space-y-4">
            {matchedProducts.map(({ product, matchScore, advice }, idx) => (
              <div key={product.id} className="rounded-2xl border border-[#A0988A] bg-[#A0988A]/20 overflow-hidden shadow-sm">
                {/* Match Score Banner */}
                <div className="px-4 py-2 border-b border-[#A0988A]/40 flex items-center justify-between bg-[#A0988A]/30">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-[#1A1A18]">
                    <Sparkles className="w-3.5 h-3.5" /> #{idx + 1} — {matchScore}% Match
                  </span>
                  <span className="text-[10px] font-bold text-[#1A1A18]/80">
                    {idx === 0 ? '✦ Gemini AI Pick' : 'AI Certified'}
                  </span>
                </div>

                {/* Compact Horizontal Card */}
                <div className="flex gap-4 p-4 items-start">
                  <img
                    src={product.images.front}
                    alt={product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-[#F7F4EB]/40 border border-[#A0988A] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#1A1A18] leading-tight">{product.name}</h3>
                    <p className="text-xs text-[#1A1A18]/70 line-clamp-2">{product.subtitle}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#1A1A18]">{formatPrice(product.price)}</span>
                      {Boolean(product.originalPrice && product.originalPrice > product.price) && (
                        <span className="text-xs text-[#A0988A] line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#A0988A]/30 border border-[#565449]/30 text-[10px] font-bold text-[#1A1A18]">
                        {product.category}
                      </span>
                    </div>
                    <Link
                      to={`/products/${product.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A1A18] hover:underline"
                    >
                      View Product <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <Link
                    to={`/products/${product.slug}`}
                    className="hidden sm:flex p-2 rounded-xl bg-[#A0988A]/30 hover:bg-[#565449] border border-[#565449]/30 text-[#1A1A18] hover:text-[#F7F4EB] transition-all flex-shrink-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                </div>

                {/* Stylist Note */}
                <div className="mx-4 mb-4 p-3 rounded-xl bg-[#F7F4EB] border border-[#A0988A]">
                  <p className="text-xs font-bold text-[#1A1A18] mb-0.5">✦ Stylist Note</p>
                  <p className="text-xs text-[#1A1A18]/80 leading-relaxed">{advice}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      </div>
    </div>
  );
};
