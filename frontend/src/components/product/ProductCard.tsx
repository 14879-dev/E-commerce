import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Check } from 'lucide-react';
import type { Product, LeatherColor } from '../../types';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { formatPrice } = useStoreSettings();
  const navigate = useNavigate();
  const [justAdded, setJustAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const variants = Array.isArray(product.variants) && product.variants.length > 0
    ? product.variants
    : [];

  const activeVariant = variants[selectedVariantIdx] || variants[0] || null;

  // 1st / Primary Image
  const primaryImage = (activeVariant && Array.isArray(activeVariant.images) && activeVariant.images[0])
    || product.images?.front
    || (Array.isArray(product.images?.gallery) && product.images.gallery[0])
    || '';

  // 2nd / Secondary Image for Hover Flip
  const secondaryImage = (activeVariant && Array.isArray(activeVariant.images) && activeVariant.images[1])
    || (Array.isArray(product.images?.gallery) && product.images.gallery[1])
    || (variants.length > 1 && variants[1]?.images?.[0])
    || product.images?.back
    || null;

  const getDefaults = (): { size: number; color: LeatherColor } => {
    const sizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0
      ? product.availableSizes
      : [7, 8, 9, 10, 11, 12, 13];
    const colors = Array.isArray(product.availableColors) && product.availableColors.length > 0
      ? product.availableColors
      : ['saddle-tan'];
    const size = sizes[Math.floor(sizes.length / 2)] || 9;
    const color = (activeVariant?.colorName?.toLowerCase() || colors[0] || 'saddle-tan') as LeatherColor;
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
    <div
      className="bg-[#F7F4EB] rounded-2xl border border-[#A0988A]/40 shadow-xs hover:shadow-md hover:border-[#565449] transition-all duration-200 group flex flex-col justify-between overflow-hidden h-full transform-gpu"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Link */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#A0988A]/15 p-2 sm:p-3">

        {/* Sale Badge */}
        {Boolean(product.originalPrice && product.originalPrice > product.price) && (
          <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-[#565449] text-[#F7F4EB] border border-[#F7F4EB]/40 text-[9px] sm:text-[10px] font-bold tracking-wider">
            SALE
          </div>
        )}

        {/* Product Image Link with 2nd Image Hover Flip */}
        <Link
          to={`/products/${product.slug}`}
          className="w-full h-full block cursor-pointer relative"
          title={`View ${product.name}`}
        >
          {/* Primary Front Image */}
          <img
            src={primaryImage}
            alt={`Authentic Pure Leather ${product.name} Peshawari Chappal`}
            title={`${product.name} - Handcrafted Peshawari Chappal`}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-contain rounded-xl transition-all duration-300 will-change-transform ${
              isHovered && secondaryImage ? 'opacity-0 scale-95' : 'opacity-100 group-hover:scale-105'
            }`}
          />

          {/* Secondary Alternate Image shown on Mouse Hover */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate angle`}
              title={`${product.name} - Alternate view`}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-contain rounded-xl transition-all duration-300 will-change-transform ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 pointer-events-none'
              }`}
            />
          )}
        </Link>
      </div>

      {/* Product Card Content matching Image 2 */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Top Label */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-[#8C3A18]">
              {product.category && product.category !== 'None' ? product.category : 'CLASSIC SANDALS'}
            </span>
            <div className="flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-[#1A1A18]">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
              {product.averageRating.toFixed(1)}
              <span className="text-[#A0988A] font-normal ml-0.5">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Title (No description below as requested) */}
          <Link to={`/products/${product.slug}`} className="block group-hover:text-[#45433A] transition-colors">
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#1A1A18] line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Divider & Price Row matching Image 2 */}
        <div className="pt-2 border-t border-[#A0988A]/30 mt-3 space-y-2.5">
          {/* Price Stack on Left & Variant Colors on Right (Image 2) */}
          <div className="flex items-end justify-between gap-2 min-h-[38px]">
            <div className="flex flex-col items-start justify-center">
              <span className="text-[10px] sm:text-[11px] text-[#A0988A] font-medium leading-none mb-0.5">
                Starting from
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif font-bold text-sm sm:text-base text-[#1A1A18] leading-tight">
                  {formatPrice(activeVariant?.price || product.price)}
                </span>
                {Boolean(product.originalPrice && product.originalPrice > product.price) && (
                  <span className="text-[10px] sm:text-xs text-[#A0988A] line-through leading-tight">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Variant Color Circles on the Right Side of Price Row (Image 2) */}
            {variants.length > 0 && (
              <div
                className="flex items-center gap-1.5 shrink-0"
                title={`${variants.length} variant${variants.length > 1 ? 's' : ''} available`}
              >
                {variants.map((v, idx) => {
                  const isCurrent = selectedVariantIdx === idx;
                  return (
                    <button
                      key={v.id || idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedVariantIdx(idx);
                      }}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border shadow-2xs transition-transform cursor-pointer hover:scale-125 ${
                        isCurrent
                          ? 'ring-2 ring-[#8C3A18] ring-offset-1 scale-110 border-white'
                          : 'border-black/25'
                      }`}
                      style={{ backgroundColor: v.colorHex || '#565449' }}
                      title={`${v.title || v.colorName} (${v.colorHex})`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons Row: Add to Bag & Direct Buy Now */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`py-1.5 px-1 sm:px-2 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 border active:scale-95 whitespace-nowrap flex-nowrap ${
                justAdded
                  ? 'bg-[#565449] border-[#565449] text-[#F7F4EB]'
                  : 'bg-[#A0988A]/30 text-[#1A1A18] border-[#565449] hover:bg-[#A0988A]/50'
              }`}
              title="Add to shopping bag"
            >
              {justAdded ? (
                <>
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#F7F4EB] shrink-0" />
                  <span className="whitespace-nowrap">Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1A1A18] shrink-0" />
                  <span className="whitespace-nowrap">Add to Bag</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="py-1.5 px-1 sm:px-2 rounded-lg text-[9px] xs:text-[10px] sm:text-xs font-bold bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] border border-[#565449] transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-0.5 sm:gap-1 active:scale-95 whitespace-nowrap flex-nowrap"
              title="Buy now with instant checkout"
            >
              <span className="whitespace-nowrap">Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
