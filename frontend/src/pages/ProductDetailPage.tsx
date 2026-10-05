import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Ruler, Star, CheckCircle } from 'lucide-react';
import { ProductReviews } from '../components/product/ProductReviews';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { Product, LeatherColor } from '../types';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

const COLOR_HEX_MAP: Record<string, string> = {
  'saddle-tan': '#7B4A28',
  'espresso': '#2A1708',
  'burnt-copper': '#8C3A18',
  'mustard-gold': '#A07010',
  'midnight-black': '#161412',
  'vintage-tan': '#9A5E35',
};

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useStoreSettings();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [selectedSize, setSelectedSize] = useState<number>(9);
  const [selectedColor, setSelectedColor] = useState<LeatherColor>('saddle-tan');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiService.getProductBySlug(slug).then(data => {
      if (data) {
        setProduct(data);
        apiService.recordProductVisit(data.id);
        const defSize = (Array.isArray(data.availableSizes) && data.availableSizes[0]) || 9;
        const defColor = (Array.isArray(data.availableColors) && data.availableColors[0]) || 'saddle-tan';
        setSelectedSize(defSize);
        setSelectedColor(defColor);
        // Reset active image on product switch
        setSelectedImageUrl(data.images?.front || '');
        // Fetch recommended products
        apiService.getProducts().then(all => {
          const others = all.filter(p => p.id !== data.id);
          const sameCategory = data.category && data.category !== 'None'
            ? others.filter(p => p.category === data.category)
            : [];
          const remaining = others.filter(p => !sameCategory.some(s => s.id === p.id));
          setRelatedProducts([...sameCategory, ...remaining].slice(0, 3));
        });
      }
      setLoading(false);
    });
  }, [slug]);

  const allImages = useMemo(() => {
    if (!product || !product.images) return [];
    const set = new Set<string>();
    const list: string[] = [];

    // Front image first
    if (product.images.front && typeof product.images.front === 'string') {
      set.add(product.images.front);
      list.push(product.images.front);
    }

    // Gallery array if present
    if (Array.isArray(product.images.gallery)) {
      product.images.gallery.forEach(url => {
        if (url && typeof url === 'string' && !set.has(url)) {
          set.add(url);
          list.push(url);
        }
      });
    }

    // Standard angle keys or any custom keys
    const standardAngles = ['back', 'left', 'right', 'top', 'sole'];
    standardAngles.forEach(k => {
      const u = (product.images as any)[k];
      if (u && typeof u === 'string' && !set.has(u)) {
        set.add(u);
        list.push(u);
      }
    });

    return list;
  }, [product]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading handcrafted product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 text-center space-y-4 bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-8">
        <h2 className="font-serif font-bold text-2xl text-slate-900">Product Not Found</h2>
        <p className="text-slate-500 text-sm">The chappal model you requested could not be located.</p>
        <Link to="/products" className="btn-copper text-xs py-2.5 px-6 inline-block">Return to Catalog</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3500);
  };

  const handleDirectBuy = () => {
    addToCart(product, selectedSize, selectedColor);
    navigate('/checkout');
  };

  const activeImageUrl = selectedImageUrl || allImages[0] || product.images?.front || '';

  return (
    <div className="space-y-8 sm:space-y-12">
      <SEOHelmet
        title={product.name}
        description={product.description}
        ogImage={product.images.front}
        product={product}
      />

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        
        {/* Left Column: Clean Image Gallery (No Extra Container, No Text Clutter) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Main Active Photo */}
          <div className="h-72 sm:h-96 lg:h-[460px] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
            <img
              src={activeImageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain p-3 sm:p-5 hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Clean Image Thumbnails (Only Images, No Text Labels) */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {allImages.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImageUrl(url)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer bg-slate-50 ${
                    activeImageUrl === url
                      ? 'ring-2 ring-blue-600 border-transparent shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Tightly Structured Product Details */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                {product.category && product.category !== 'None' ? product.category : 'Handcrafted Edition'}
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold text-slate-800">{product.averageRating}</span>
                <span className="text-xs text-slate-400">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {product.subtitle}
            </p>
          </div>

          {/* Pricing Box (Strict Boolean Check — Zero '0' Glitch) */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                {formatPrice(product.price)}
              </span>
              {Boolean(product.originalPrice && product.originalPrice > product.price) && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
              In Stock &amp; Ready
            </span>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px]">Leather Shade:</span>
              <span className="text-blue-600 capitalize font-medium">{selectedColor.replace(/-/g, ' ')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.availableColors.map(color => {
                const hex = COLOR_HEX_MAP[color];
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer flex items-center gap-2 ${
                      selectedColor === color
                        ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: hex || '#475569' }}
                    />
                    {color.replace(/-/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Select Size:
              </span>
              <Link to="/size-finder" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5" /> AI Size Finder
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
              {(Array.isArray(product.availableSizes) && product.availableSizes.length > 0
                ? product.availableSizes
                : [7, 8, 9, 10, 11, 12, 13]
              ).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    selectedSize === size
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Size {size}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Horizontal Add to Bag & Buy Now */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Add to Shopping Bag Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                title="Add product to shopping bag"
              >
                <ShoppingBag className="w-4 h-4 text-slate-700" />
                <span>Add to Bag</span>
              </button>

              {/* Direct Buy Now Button */}
              <button
                type="button"
                onClick={handleDirectBuy}
                className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                title="Buy now and proceed directly to checkout"
              >
                <span>Buy Now</span>
              </button>

            </div>

            {addedNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Added to shopping bag! (Size {selectedSize} • {selectedColor.replace(/-/g, ' ')})</span>
                </div>
                <Link to="/bag" className="text-blue-700 hover:underline font-black text-xs">
                  View Bag →
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Description & Materials Specs */}
      <section className="pt-6 sm:pt-8 border-t border-slate-200 space-y-4 sm:space-y-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
          Craft &amp; Materials Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Leather Grade</span>
            <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-base">Full-Grain Cowhide</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{product.materials}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Artisan Time</span>
            <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-base">{product.craftingTime}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Each stitch hand-punched with waxed linen thread for lifelong bond.</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Sole Architecture</span>
            <h3 className="font-serif font-bold text-slate-900 text-sm sm:text-base">Dual Tire Grip</h3>
            <p className="text-xs text-slate-500 leading-relaxed">High-density all-weather rubber tread sourced from recycled tire compounds.</p>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <ProductReviews productId={product.id} averageRating={product.averageRating} reviewCount={product.reviewCount} />

      {/* Recommended Products Collection */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-0.5">
                Handcrafted Recommendations
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                You May Also Like
              </h2>
            </div>
            <Link to="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              View All Collection →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
