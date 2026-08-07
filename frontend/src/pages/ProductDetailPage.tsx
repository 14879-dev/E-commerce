import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Sliders, Ruler, Star, CheckCircle, Box, Zap } from 'lucide-react';
import { Chappal3DViewer } from '../components/3d/Chappal3DViewer';
import { ProductReviews } from '../components/product/ProductReviews';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { Product, LeatherColor } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { formatPrice, settings } = useStoreSettings();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [selectedSize, setSelectedSize] = useState<number>(42);
  const [selectedColor, setSelectedColor] = useState<LeatherColor>('saddle-tan');
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'back' | 'left' | 'right' | 'top' | 'sole'>('front');
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiService.getProductBySlug(slug).then(data => {
      if (data) {
        setProduct(data);
        setSelectedSize(data.availableSizes[0] || 42);
        setSelectedColor(data.availableColors[0] || 'saddle-tan');
        // Fetch related products
        apiService.getProducts().then(all => {
          setRelatedProducts(all.filter(p => p.id !== data.id && p.category === data.category).slice(0, 3));
        });
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center text-text-muted space-y-4">
        <div className="w-12 h-12 border-4 border-copper border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading handcrafted 3D product specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="glass-panel p-12 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-text-primary">Product Not Found</h2>
        <p className="text-text-muted text-sm">The chappal model you requested could not be located.</p>
        <Link to="/products" className="btn-copper text-xs py-2.5 px-6 inline-block">Return to Catalog</Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  return (
    <div className="space-y-16">
      <SEOHelmet
        title={product.name}
        description={product.description}
        ogImage={product.images.front}
        product={product}
      />

      {/* Main 3D & Specs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Interactive 3D Viewer & 6-Angle Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            
            <div className="flex items-center justify-between z-10 relative mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Box className="w-4 h-4" /> 3D Orbit Viewer
              </span>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Drag to Rotate • Scroll to Zoom
              </span>
            </div>

            {/* 3D Canvas */}
            <Chappal3DViewer
              leatherColor={selectedColor}
              soleType="double-leather"
              buckleFinish="aged-brass"
              autoRotate={true}
              images={product.images}
              model3dUrl={product.model3dUrl}
              className="h-96 sm:h-[450px] w-full"
            />

            {/* 6-Angle Image Thumbnail Selector */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="block text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-medium">
                Photogrammetry Inspection Angles (6-Camera Shot)
              </span>
              <div className="grid grid-cols-6 gap-2">
                {(['front', 'back', 'left', 'right', 'top', 'sole'] as const).map(angle => (
                  <button
                    key={angle}
                    onClick={() => setSelectedAngle(angle)}
                    className={`aspect-square rounded-xl overflow-hidden border transition-all ${
                      selectedAngle === angle
                        ? 'border-blue-600 ring-2 ring-blue-500/40 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={product.images[angle]}
                      alt={`${product.name} ${angle}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title, Actions & Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-6">
            
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-brass">
                  {product.category} Series • Handcrafted
                </span>
                <div className="flex items-center gap-1 text-sm font-semibold text-text-primary">
                  <Star className="w-4 h-4 fill-brass text-brass" />
                  {product.averageRating.toFixed(1)}
                  <span className="text-text-muted text-xs">({product.reviewCount} reviews)</span>
                </div>
              </div>

              <h1 className="font-serif text-3xl font-bold text-text-primary">
                {product.name}
              </h1>
              
              <div className="mt-3 space-y-1">
                <div className="flex items-baseline flex-wrap gap-3">
                  <span className="font-serif font-bold text-3xl text-copper">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-base text-text-muted line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.originalPrice && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                  {(product.freeShipping || settings.freeShippingMode === 'all' || (settings.freeShippingMode === 'threshold' && product.price >= settings.freeShippingThreshold)) && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                      Free Delivery Eligible
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed">
              {product.description}
            </p>

            {/* Leather Color Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brass mb-2">
                Select Leather Shade
              </label>
              <div className="flex flex-wrap gap-3">
                {product.availableColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      selectedColor === color
                        ? 'bg-copper text-white border-copper shadow-copper-glow'
                        : 'bg-glass-surface border-glass-border text-text-primary hover:border-copper/50'
                    }`}
                  >
                    {color.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-brass">
                  Select EU Size
                </label>
                <Link to="/size-finder" className="text-xs text-copper hover:underline flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5" /> Find My Size (Camera Wizard)
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {product.availableSizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedSize === size
                        ? 'bg-brass text-espresso-900 border-brass shadow-brass-glow'
                        : 'bg-glass-surface border-glass-border text-text-primary hover:border-brass/50'
                    }`}
                  >
                    EU {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Added to Cart Notification Toast */}
            {addedNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-700/50 text-xs font-semibold flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-4 h-4" /> Added to your shopping bag!
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-sm text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-700" /> Add to Bag
                </button>

                <button
                  onClick={() => {
                    addToCart(product, selectedSize, selectedColor);
                    navigate('/checkout');
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center transition-all shadow-md shadow-blue-600/20"
                >
                  Buy Now
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isWishlisted
                      ? 'bg-copper text-white border-copper shadow-copper-glow'
                      : 'bg-glass-surface hover:bg-glass-surfaceHover border-glass-border text-text-primary'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Entry Points to Customizer & Size Finder */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to={`/customize/${product.id}`}
                  className="btn-glass text-xs py-3 px-3 text-center flex items-center justify-center gap-1.5 border-brass/40 text-brass hover:bg-brass/10"
                >
                  <Sliders className="w-4 h-4" /> Customize 3D Studio
                </Link>

                <Link
                  to="/size-finder"
                  className="btn-glass text-xs py-3 px-3 text-center flex items-center justify-center gap-1.5"
                >
                  <Ruler className="w-4 h-4 text-copper" /> Camera Size Finder
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Description & Materials Specs */}
      <section className="pt-8 border-t border-slate-200 space-y-6">
        <h2 className="font-serif text-2xl font-bold text-slate-900">
          Craft & Material Specifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="font-serif font-semibold text-brass text-base">Key Features</h3>
            <ul className="space-y-2 text-xs text-text-muted list-disc list-inside">
              {product.features.map((feat, i) => (
                <li key={i}>{feat}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-semibold text-brass text-base">Materials Used</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {product.materials}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif font-semibold text-brass text-base">Artisan Guarantee</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Crafted over {product.craftingTime}. Includes standard order replacement protection.
            </p>
          </div>
        </div>
      </section>

      {/* Customer Reviews Component */}
      <ProductReviews
        productId={product.id}
        averageRating={product.averageRating}
        reviewCount={product.reviewCount}
      />

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-text-primary">
            More from {product.category} Collection
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
