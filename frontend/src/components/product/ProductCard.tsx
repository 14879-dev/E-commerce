import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingBag, Check } from 'lucide-react';
import type { Product, LeatherColor } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice } = useStoreSettings();
  const navigate = useNavigate();
  const isWishlisted = isInWishlist(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const getDefaults = (): { size: number; color: LeatherColor } => {
    const sizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0
      ? product.availableSizes
      : [7, 8, 9, 10, 11, 12, 13];
    const colors = Array.isArray(product.availableColors) && product.availableColors.length > 0
      ? product.availableColors
      : ['saddle-tan'];
    const size = sizes[Math.floor(sizes.length / 2)] || 9;
    const color = (colors[0] || 'saddle-tan') as LeatherColor;
    return { size, color };
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { size, color } = getDefaults();
    addToCart(product, size, color);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { size, color } = getDefaults();
    addToCart(product, size, color);
    navigate('/checkout');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400/60 transition-all duration-200 group flex flex-col justify-between overflow-hidden h-full transform-gpu">
      {/* Image Container with Link */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 p-2 sm:p-3">
        {/* Wishlist Button Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2 right-2 z-20 p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer ${isWishlisted
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-xs'
            }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Sale Badge */}
        {Boolean(product.originalPrice && product.originalPrice > product.price) && (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold">
            SALE
          </div>
        )}

        {/* Product Image Link */}
        <Link
          to={`/products/${product.slug}`}
          className="w-full h-full block cursor-pointer"
          title={`View ${product.name}`}
        >
          <img
            src={product.images.front}
            alt={`Authentic Pure Leather ${product.name} Peshawari Chappal`}
            title={`${product.name} - Handcrafted Peshawari Chappal`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-xl will-change-transform"
          />
        </Link>
      </div>

      {/* Product Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-blue-600">
              {product.category && product.category !== 'None' ? product.category : 'Handcrafted'}
            </span>
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-slate-800">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              {product.averageRating.toFixed(1)}
              <span className="text-slate-400 font-normal ml-0.5">({product.reviewCount})</span>
            </div>
          </div>

          <Link to={`/products/${product.slug}`} className="block group-hover:text-blue-600 transition-colors">
            <h3 className="font-serif font-bold text-xs sm:text-base text-slate-900 line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 mb-2 leading-relaxed">
            {product.subtitle}
          </p>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-2 border-t border-slate-100 mt-auto space-y-2">
          {/* Price Stack: Horizontal Sale Price and Below the Actual/Original Price */}
          <div className="flex flex-col items-start min-h-[36px] justify-center">
            <span className="font-serif font-bold text-sm sm:text-base text-slate-900 leading-tight">
              {formatPrice(product.price)}
            </span>
            {Boolean(product.originalPrice && product.originalPrice > product.price) && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through leading-tight">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Action Buttons Row: Add to Bag & Direct Buy Now */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 border active:scale-95 ${justAdded
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              title="Add to shopping bag"
            >
              {justAdded ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3 h-3 text-slate-500" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="py-1.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-1 active:scale-95"
              title="Buy now with instant checkout"
            >
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
