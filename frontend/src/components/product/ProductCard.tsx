import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Box, ShoppingBag } from 'lucide-react';
import type { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice } = useStoreSettings();
  const navigate = useNavigate();
  const isWishlisted = isInWishlist(product.id);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Add with default size and first available color
    const defaultSize = product.availableSizes[Math.floor(product.availableSizes.length / 2)] || 41;
    const defaultColor = product.availableColors[0] || 'saddle-tan';
    addToCart(product, defaultSize, defaultColor);
    navigate('/checkout');
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-400/60 transition-all duration-300 group flex flex-col justify-between overflow-hidden h-full block"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50 p-2 sm:p-3">
        {/* Wishlist Button Top Right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2 right-2 z-20 p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-sm'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* 3D Badge */}
        {product.status3D === 'ready' && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-md border border-blue-200 text-[9px] sm:text-[10px] font-semibold text-blue-700 flex items-center gap-1 shadow-xs">
            <Box className="w-3 h-3 text-blue-600" />
            3D
          </div>
        )}

        {/* Sale Badge */}
        {product.originalPrice && (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold">
            SALE
          </div>
        )}

        {/* Product Image */}
        <img
          src={product.images.front}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-xl"
          loading="lazy"
        />
      </div>

      {/* Product Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-blue-600">
              {product.category}
            </span>
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-slate-800">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              {product.averageRating.toFixed(1)}
              <span className="text-slate-400 font-normal ml-0.5">({product.reviewCount})</span>
            </div>
          </div>

          <h3 className="font-serif font-bold text-xs sm:text-base text-slate-900 line-clamp-1 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 mb-2 leading-relaxed">
            {product.subtitle}
          </p>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-2 border-t border-slate-100 mt-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-serif font-bold text-sm sm:text-lg text-slate-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">{product.craftingTime?.split(' ')[0]}h craft</span>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/products/${product.slug}`);
              }}
              className="py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all text-center"
            >
              View Details
            </button>
            <button
              onClick={handleBuyNow}
              className="py-1.5 rounded-lg text-[10px] sm:text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all text-center"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
