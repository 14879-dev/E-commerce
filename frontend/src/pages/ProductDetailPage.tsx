import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Ruler, Star, CheckCircle, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductReviews } from '../components/product/ProductReviews';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { Product, LeatherColor, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

const COLOR_HEX_MAP: Record<string, string> = {
  'saddle-tan': '#7B4A28',
  'espresso': '#2A1708',
  'burnt-copper': '#8C3A18',
  'mustard-gold': '#A07010',
  'midnight-black': '#161412',
  'vintage-tan': '#9A5E35',
  'camel': '#C19A6B',
  'black': '#1A1A1A',
  'grey': '#808080',
  'brown': '#7B4A28',
  'white': '#F5F5F0',
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setQuantity(1);
    setSelectedVariant(null);
    setCurrentImageIndex(0);
    apiService.getProductBySlug(slug).then(data => {
      if (data) {
        setProduct(data);
        apiService.recordProductVisit(data.id);
        const defSize = (Array.isArray(data.availableSizes) && data.availableSizes[0]) || 9;
        const defColor = (Array.isArray(data.availableColors) && data.availableColors[0]) || 'saddle-tan';
        setSelectedSize(defSize);
        setSelectedColor(defColor);
        // Auto-select first variant if exists
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
          if (data.variants[0].colorName) {
            setSelectedColor(data.variants[0].colorName.toLowerCase() as LeatherColor);
          }
        }
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

  // Images for the currently selected variant (or the product's own gallery)
  const activeVariantImages = useMemo(() => {
    if (selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
      return selectedVariant.images.filter(Boolean);
    }
    // Fallback: use product images
    if (!product || !product.images) return [];
    const set = new Set<string>();
    const list: string[] = [];
    if (product.images.front) { set.add(product.images.front); list.push(product.images.front); }
    if (Array.isArray(product.images.gallery)) {
      product.images.gallery.forEach(url => { if (url && !set.has(url)) { set.add(url); list.push(url); } });
    }
    const standardAngles = ['back', 'left', 'right', 'top', 'sole'];
    standardAngles.forEach(k => {
      const u = (product.images as any)[k];
      if (u && typeof u === 'string' && !set.has(u)) { set.add(u); list.push(u); }
    });
    return list;
  }, [selectedVariant, product]);

  const handlePrevImage = () => {
    if (activeVariantImages.length <= 1) return;
    setCurrentImageIndex(prev => (prev === 0 ? activeVariantImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (activeVariantImages.length <= 1) return;
    setCurrentImageIndex(prev => (prev === activeVariantImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 40) {
      handlePrevImage();
    } else if (diff < -40) {
      handleNextImage();
    }
    setTouchStartX(null);
  };

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setCurrentImageIndex(0);
    if (variant.colorName) {
      setSelectedColor(variant.colorName.toLowerCase() as LeatherColor);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#1A1A18] space-y-4">
        <div className="w-12 h-12 border-4 border-[#565449] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading handcrafted product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10 text-center space-y-4 bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] max-w-lg mx-auto my-8">
        <h2 className="font-serif font-bold text-2xl text-[#1A1A18]">Product Not Found</h2>
        <p className="text-[#1A1A18]/80 text-sm">The chappal model you requested could not be located.</p>
        <Link to="/products" className="btn-copper text-xs py-2.5 px-6 inline-block">Return to Catalog</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3500);
  };

  const handleDirectBuy = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
  };

  const activeImageUrl = activeVariantImages[currentImageIndex] || activeVariantImages[0] || product.images?.front || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
      <SEOHelmet
        title={product.name}
        description={product.description}
        ogImage={product.images.front}
        product={product}
      />

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        
        {/* Left Column: Image Gallery with Variants on the Side */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            
            {/* Variants Shown on the Side of Main Image */}
            {Array.isArray(product.variants) && product.variants.length > 0 && (
              <div className="order-2 sm:order-1 flex sm:flex-col gap-2 shrink-0 overflow-x-auto sm:overflow-y-auto sm:max-h-[460px] pb-1 sm:pb-0 scrollbar-none sm:w-32">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A18]/60 hidden sm:block px-1">
                  Variants ({product.variants.length})
                </span>
                {product.variants.map((v, idx) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id || idx}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#565449] text-[#F7F4EB] border-[#565449] shadow-xs ring-2 ring-[#565449]/30'
                          : 'bg-[#F7F4EB] text-[#1A1A18] border-[#A0988A]/60 hover:bg-[#A0988A]/20'
                      }`}
                      title={v.title}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{ backgroundColor: v.colorHex || '#565449' }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block truncate">{v.title}</span>
                        <span className={`text-[10px] block truncate ${isSelected ? 'text-[#F7F4EB]/70' : 'text-[#A0988A]'}`}>
                          {v.colorName || 'Variant'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Swipable Image Container */}
            <div
              className="order-1 sm:order-2 relative flex-1 h-72 sm:h-96 lg:h-[460px] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#A0988A]/20 border border-[#A0988A] flex items-center justify-center shadow-xs select-none touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={activeImageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-3 sm:p-5 transition-transform duration-300 pointer-events-none"
              />

              {/* Prev Button */}
              {activeVariantImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#F7F4EB]/90 hover:bg-[#F7F4EB] text-[#1A1A18] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-110 active:scale-95"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Button */}
              {activeVariantImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#F7F4EB]/90 hover:bg-[#F7F4EB] text-[#1A1A18] shadow-md flex items-center justify-center transition-all cursor-pointer z-10 hover:scale-110 active:scale-95"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Swipable Indicator Badge */}
              {activeVariantImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 z-10">
                  <span>{currentImageIndex + 1} / {activeVariantImages.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Variant Image Thumbnails */}
          {activeVariantImages.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {activeVariantImages.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer bg-[#A0988A]/20 ${
                    currentImageIndex === idx
                      ? 'ring-2 ring-[#565449] border-transparent shadow-xs'
                      : 'border-[#A0988A] opacity-70 hover:opacity-100'
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

        {/* Right Column: Product Details */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#A0988A]/30 border border-[#565449]/30 text-[#1A1A18] text-[11px] font-bold uppercase tracking-wider">
                {product.category && product.category !== 'None' ? product.category : 'Handcrafted Edition'}
              </span>
              <div className="flex items-center gap-1 text-[#1A1A18]">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="text-xs font-bold text-[#1A1A18]">{product.averageRating}</span>
                <span className="text-xs text-[#1A1A18]/70">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A18] tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#1A1A18]/80 leading-relaxed">
              {product.subtitle}
            </p>
          </div>

          {/* Pricing Stack */}
          <div className="flex items-baseline gap-3 pb-3 border-b border-[#A0988A]/40">
            <span className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1A18]">
              {formatPrice(selectedVariant?.price ?? product.price)}
            </span>
            {Boolean(product.originalPrice && product.originalPrice > product.price) && (
              <span className="text-sm sm:text-base text-[#A0988A] line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Variant Selection in Right Details Column */}
          {Array.isArray(product.variants) && product.variants.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18] block">
                Select Variant / Color: {selectedVariant?.title && <span className="font-normal text-[#1A1A18]/80">({selectedVariant.title})</span>}
              </span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVariant(v)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border cursor-pointer ${
                        isSelected
                          ? 'border-[#565449] bg-[#565449] text-[#F7F4EB] shadow-xs'
                          : 'border-[#A0988A] bg-[#F7F4EB] text-[#1A1A18] hover:bg-[#A0988A]/20'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: v.colorHex || '#565449' }}
                      />
                      <span>{v.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Fallback Color Selection */
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18] block">
                Leather Shade:
              </span>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(product.availableColors) && product.availableColors.length > 0
                  ? product.availableColors
                  : ['saddle-tan']
                ).map(color => {
                  const hex = COLOR_HEX_MAP[color] || '#565449';
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color as LeatherColor)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border cursor-pointer ${
                        isSelected
                          ? 'border-[#565449] bg-[#565449] text-[#F7F4EB] shadow-xs'
                          : 'border-[#A0988A] bg-[#F7F4EB] text-[#1A1A18] hover:bg-[#A0988A]/20'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      {color.replace(/-/g, ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]">
                Select Size:
              </span>
              <Link to="/size-finder" className="text-xs font-bold text-[#1A1A18] hover:underline flex items-center gap-1">
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
                      ? 'border-[#565449] bg-[#565449] text-[#F7F4EB] shadow-xs'
                      : 'border-[#A0988A] bg-[#F7F4EB] text-[#1A1A18] hover:bg-[#A0988A]/20'
                  }`}
                >
                  Size {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18]">
                Select Quantity:
              </span>
              <span className="text-xs text-[#1A1A18]/70">
                Item Total: <strong className="text-[#1A1A18] font-bold">{formatPrice(product.price * quantity)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#F7F4EB] border border-[#A0988A] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold min-w-[2rem] text-center text-[#1A1A18]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="p-1.5 rounded-lg hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-[#1A1A18]/70">
                {product.stockCount ? `${product.stockCount} pairs available` : 'Artisan Handcrafted'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Olive Drab buttons everywhere */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Add to Shopping Bag Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl bg-[#A0988A]/30 hover:bg-[#A0988A]/50 border-2 border-[#565449] text-[#1A1A18] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                title="Add product to shopping bag"
              >
                <ShoppingBag className="w-4 h-4 text-[#1A1A18]" />
                <span>Add to Bag</span>
              </button>

              {/* Direct Buy Now Button */}
              <button
                type="button"
                onClick={handleDirectBuy}
                className="flex-1 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl bg-[#565449] hover:bg-[#45433A] active:bg-[#3F3E36] text-[#F7F4EB] border border-[#565449] font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                title="Buy now and proceed directly to checkout"
              >
                <span>Buy Now</span>
              </button>
            </div>

            {addedNotice && (
              <div className="p-3 rounded-xl bg-[#A0988A]/30 border border-[#565449] text-[#1A1A18] text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#1A1A18] shrink-0" />
                  <span>Added {quantity} pair{quantity > 1 ? 's' : ''} to shopping bag! (Size {selectedSize} • {selectedColor.replace(/-/g, ' ')})</span>
                </div>
                <Link to="/bag" className="text-[#1A1A18] underline font-black text-xs">
                  View Bag →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Materials Specs (Warm Taupe Cards Section) */}
      <section className="pt-6 sm:pt-8 border-t border-[#A0988A]/40 space-y-4 sm:space-y-5">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A18]">
          Craft &amp; Materials Specifications
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]">Leather Grade</span>
            <h3 className="font-serif font-bold text-[#1A1A18] text-sm sm:text-base">Full-Grain Cowhide</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">{product.materials}</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]">Artisan Time</span>
            <h3 className="font-serif font-bold text-[#1A1A18] text-sm sm:text-base">{product.craftingTime}</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">Each stitch hand-punched with waxed linen thread for lifelong bond.</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A18]">Sole Architecture</span>
            <h3 className="font-serif font-bold text-[#1A1A18] text-sm sm:text-base">Dual Tire Grip</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">High-density all-weather rubber tread sourced from recycled tire compounds.</p>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <ProductReviews productId={product.id} averageRating={product.averageRating} reviewCount={product.reviewCount} />

      {/* Recommended Products Collection */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 border-t border-[#A0988A]/40">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-0.5">
                Handcrafted Recommendations
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A18]">
                You May Also Like
              </h2>
            </div>
            <Link to="/products" className="text-xs font-semibold text-[#1A1A18] hover:underline">
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
