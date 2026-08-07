import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Sparkles, ShoppingBag, Check } from 'lucide-react';
import { Chappal3DViewer } from '../components/3d/Chappal3DViewer';
import { apiService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import type { Product, LeatherColor, SoleType, BuckleFinish } from '../types';
import { SEOHelmet } from '../components/common/SEOHelmet';

export const CustomizerPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useStoreSettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Customization Options State
  const [leatherColor, setLeatherColor] = useState<LeatherColor>('burnt-copper');
  const [soleType, setSoleType] = useState<SoleType>('double-leather');
  const [buckleFinish, setBuckleFinish] = useState<BuckleFinish>('aged-brass');
  const [initials, setInitials] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<number>(42);

  useEffect(() => {
    apiService.getProducts().then(list => {
      if (productId) {
        const found = list.find(p => p.id === productId || p.slug === productId);
        if (found) {
          setProduct(found);
          setLeatherColor(found.availableColors[0] || 'burnt-copper');
        } else if (list.length > 0) {
          setProduct(list[0]);
          setLeatherColor(list[0].availableColors[0] || 'burnt-copper');
        }
      } else if (list.length > 0) {
        setProduct(list[0]);
        setLeatherColor(list[0].availableColors[0] || 'burnt-copper');
      }
      setLoading(false);
    });
  }, [productId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500">
        Loading 3D Customizer Studio...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center text-slate-500">
        Product not found for customization.
      </div>
    );
  }

  // Price calculations based on options
  const basePrice = product.price;
  const solePrice = soleType === 'cushioned-foam' ? 10 : soleType === 'tire-recycled' ? 15 : 0;
  const initialPrice = initials.trim() ? 15 : 0;
  const customPrice = basePrice + solePrice + initialPrice;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, leatherColor, {
      productId: product.id,
      productName: product.name,
      basePrice,
      leatherColor,
      soleType,
      buckleFinish,
      stitchingColor: 'matching',
      size: selectedSize,
      initials: initials.toUpperCase(),
      customPrice
    });
    navigate('/bag');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <SEOHelmet
        title={`3D Configurator Studio - ${product.name}`}
        description="Design your bespoke handcrafted Peshawari Chappal with real-time 3D leather, sole, and engraving options."
      />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
            Bespoke Handcrafting Studio
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            3D Customization Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure upper shade, sole architecture, metallic buckle, and gold initial laser etching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Configured Price:</span>
          <span className="font-serif font-bold text-3xl text-slate-900">{formatPrice(customPrice)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Live 3D Interactive Configurator Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Box className="w-4 h-4" /> Live Rendered Configurator
            </span>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              360° Drag & Orbit Preview
            </span>
          </div>

          <Chappal3DViewer
            leatherColor={leatherColor}
            soleType={soleType}
            buckleFinish={buckleFinish}
            autoRotate={false}
            className="h-[420px] sm:h-[500px] w-full"
          />

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-600">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              Real-time PBR lighting physics simulates raw tanned leather specular reflection under studio spotlights.
            </span>
          </div>
        </div>

        {/* Right Column: Customization Controls Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-6">
            
            {/* 1. Leather Color Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                1. Leather Shade Selection
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['saddle-tan', 'espresso', 'burnt-copper', 'mustard-gold', 'midnight-black'] as LeatherColor[]).map(color => (
                  <button
                    key={color}
                    onClick={() => setLeatherColor(color)}
                    className={`p-2.5 rounded-xl text-xs font-bold capitalize transition-all border flex items-center justify-between ${
                      leatherColor === color
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{color.replace('-', ' ')}</span>
                    {leatherColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Sole Construction */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                2. Outsole Construction
              </label>
              <div className="space-y-2">
                {[
                  { id: 'double-leather', name: 'Double Leather Stitched Sole', price: 'Included' },
                  { id: 'tire-recycled', name: 'Recycled All-Terrain Tyre Tread', price: `+${formatPrice(500)}` },
                  { id: 'cushioned-foam', name: 'Soft Cushioned Foam Sole', price: `+${formatPrice(350)}` },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSoleType(s.id as SoleType)}
                    className={`w-full p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                      soleType === s.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[11px] opacity-80">{s.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Buckle Finish */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                3. Metallic Buckle Finish
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'aged-brass', label: 'Aged Brass' },
                  { id: 'burnt-copper', label: 'Burnt Copper' },
                  { id: 'matte-black', label: 'Matte Black' },
                ].map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBuckleFinish(b.id as BuckleFinish)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                      buckleFinish === b.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Laser Engraved Initials */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  4. Gold Monogram Laser Etching
                </label>
                <span className="text-[11px] text-blue-600 font-semibold">+{formatPrice(500)}</span>
              </div>
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={e => setInitials(e.target.value.toUpperCase())}
                placeholder="e.g. HA (Max 3 letters)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-blue-600 focus:outline-none uppercase font-serif font-bold tracking-widest"
              />
            </div>

            {/* 5. Size Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                5. Select EU Foot Size
              </label>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 rounded-xl font-semibold text-xs border transition-all ${
                      selectedSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              <ShoppingBag className="w-4 h-4 text-white" /> Add Bespoke Model to Bag ({formatPrice(customPrice)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
