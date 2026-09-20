import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { apiService } from '../services/api';
import type { Product } from '../types';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useEffect, useState } from 'react';

export const WishlistPage: React.FC = () => {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getProducts().then(all => {
      setProducts(all.filter(p => wishlistIds.includes(p.id)));
      setLoading(false);
    });
  }, [wishlistIds]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <SEOHelmet
        title="Saved Wishlist"
        description="View all saved handcrafted Peshawari Chappal models in your wishlist."
      />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
            Personal Saved Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Customer Wishlist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            You have saved {products.length} handcrafted chappal models.
          </p>
        </div>
        <Link to="/products" className="btn-glass text-xs py-2.5 px-5 self-start md:self-auto">
          Continue Exploring
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading your saved items...</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Your Wishlist is Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Tap the heart icon on any product card in our catalog to save your favorite Peshawari chappals here.
          </p>
          <Link to="/products" className="btn-copper text-sm py-3 px-8 inline-flex items-center gap-2">
            Browse Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 p-2 sm:p-3">
                <img
                  src={product.images.front}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-rose-50 text-rose-500 border border-slate-200 shadow-xs transition-all"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-blue-600 block mb-0.5">
                    {product.category}
                  </span>
                  <Link to={`/products/${product.slug}`} className="font-serif font-bold text-xs sm:text-base text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                    {product.name}
                  </Link>
                  <span className="font-serif font-bold text-sm sm:text-base text-slate-900 block mt-1">
                    ${product.price}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => {
                      const defSize = (Array.isArray(product.availableSizes) && product.availableSizes[0]) || 42;
                      const defColor = (Array.isArray(product.availableColors) && product.availableColors[0]) || 'saddle-tan';
                      addToCart(product, defSize, defColor as any);
                    }}
                    className="flex-1 btn-copper text-[11px] sm:text-xs py-2 px-2.5 flex items-center justify-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Bag
                  </button>

                  <Link
                    to={`/products/${product.slug}`}
                    className="btn-glass text-[11px] sm:text-xs py-2 px-2.5"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
