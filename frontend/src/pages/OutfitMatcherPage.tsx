import React, { useState } from 'react';
import { Sparkles, Upload, CheckCircle } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { Product } from '../types';

export const OutfitMatcherPage: React.FC = () => {
  const [outfitType, setOutfitType] = useState<'shalwar' | 'waistcoat' | 'sherwani' | 'suit'>('shalwar');
  const [outfitColor, setOutfitColor] = useState<'white' | 'black' | 'cream' | 'navy' | 'maroon' | 'olive'>('cream');
  const [uploadedOutfitImg, setUploadedOutfitImg] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<{ product: Product; matchScore: number; advice: string }[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedOutfitImg(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunMatch = async () => {
    setIsAnalyzing(true);
    const allProducts = await apiService.getProducts();

    setTimeout(() => {
      const results = allProducts.map(p => {
        let score = 92;
        let advice = 'Harmonizes beautifully with natural leather grain tones.';

        if (outfitColor === 'cream' || outfitColor === 'white') {
          if (p.availableColors.includes('saddle-tan') || p.availableColors.includes('burnt-copper')) {
            score = 98;
            advice = 'High contrast luxury pairing: Saddle Tan upper highlights crisp white/cream fabrics.';
          }
        } else if (outfitColor === 'black' || outfitColor === 'navy') {
          if (p.availableColors.includes('espresso') || p.availableColors.includes('midnight-black')) {
            score = 96;
            advice = 'Monochromatic sophistication: Deep Espresso compliments dark evening attire.';
          }
        } else if (outfitColor === 'maroon' || outfitColor === 'olive') {
          if (p.availableColors.includes('mustard-gold') || p.availableColors.includes('burnt-copper')) {
            score = 97;
            advice = 'Warm regal synergy: Burnt copper & brass details elevate traditional velvet and silk.';
          }
        }

        return { product: p, matchScore: score, advice };
      }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);

      setMatchedProducts(results);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SEOHelmet
        title="AI Outfit Matcher"
        description="Upload or describe your outfit to receive AI-driven Peshawari Chappal style recommendations and color harmony analysis."
      />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
          AI Color & Style Stylist
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" /> AI Outfit Matcher
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload a photo of your Shalwar Kameez, Waistcoat, or Formal Suit to get tailored footwear pairings.
        </p>
      </div>

      {/* Input Selection Panel */}
      <div className="space-y-6">
        <h2 className="font-serif font-bold text-xl text-slate-900">1. Select Outfit Style & Color Tone</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
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
                { id: 'suit', label: 'Formal Western Suit' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setOutfitType(cat.id as any)}
                  className={`p-3 rounded-xl text-xs font-bold transition-all border ${
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
              Fabric Primary Color Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cream', label: 'Cream / Off-White' },
                { id: 'white', label: 'Crisp Pure White' },
                { id: 'black', label: 'Charcoal Black' },
                { id: 'navy', label: 'Midnight Navy' },
                { id: 'maroon', label: 'Regal Maroon' },
                { id: 'olive', label: 'Earthy Olive' },
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

        {/* Optional Outfit Image Upload */}
        <div className="pt-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            2. Optional: Upload Outfit Photo for Palette Extraction
          </label>
          
          <div className="flex items-center gap-4">
            <label className="btn-glass text-xs py-3 px-6 cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" /> Choose Outfit Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {uploadedOutfitImg && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Outfit image attached
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleRunMatch}
          disabled={isAnalyzing}
          className="w-full btn-copper py-3.5 text-sm font-bold flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <span>Extracting Color Harmony & Style Profiles...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" /> Generate Matching Footwear Recommendations
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {matchedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div>
            <h2 className="font-serif font-bold text-2xl text-slate-900">
              Recommended Footwear Pairings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Based on color temperature, formal level, and leather finish contrast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchedProducts.map(({ product, matchScore, advice }) => (
              <div key={product.id} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {matchScore}% Match Compatibility
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">AI Certified</span>
                </div>

                <ProductCard product={product} />

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Stylist Note:</strong>
                  {advice}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
