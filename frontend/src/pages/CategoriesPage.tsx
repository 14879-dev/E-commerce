import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Sparkles, Ruler } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { PageHero } from '../components/common/PageHero';
import { ProductCard } from '../components/product/ProductCard';
import { apiService } from '../services/api';
import { useStoreSettings } from '../context/StoreSettingsContext';
import type { Category, Product } from '../types';

export const CategoriesPage: React.FC = () => {
  const { formatPrice } = useStoreSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const loadData = () => {
    Promise.all([
      apiService.getCategories(),
      apiService.getProducts(true),
    ]).then(([cats, prods]) => {
      setCategories(cats);
      setAllProducts(prods);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    const handleCategoriesChanged = () => loadData();
    const handleProductsChanged = () => loadData();

    window.addEventListener('psh:categories-changed', handleCategoriesChanged);
    window.addEventListener('psh:products-changed', handleProductsChanged);
    return () => {
      window.removeEventListener('psh:categories-changed', handleCategoriesChanged);
      window.removeEventListener('psh:products-changed', handleProductsChanged);
    };
  }, []);

  const dynamicCategories = useMemo(() => {
    return categories.map(cat => {
      const catProds = products.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase());
      const count = catProds.length;
      const prices = catProds.map(p => Number(p.price) || 0).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 6999;
      return {
        ...cat,
        count,
        countText: `${count} ${count === 1 ? 'Model' : 'Models'}`,
        minPrice,
        prods: catProds,
        img: cat.image || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600',
      };
    });
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    if (selectedFilter === 'All') return dynamicCategories;
    return dynamicCategories.filter(c => c.name.toLowerCase() === selectedFilter.toLowerCase());
  }, [dynamicCategories, selectedFilter]);

  return (
    <div className="w-full bg-[#F7F4EB] min-h-screen">
      <SEOHelmet
        title="Explore All Peshawari Chappal Categories | Khybersole"
        description="Browse all handcrafted Peshawari Chappal categories including Kaptaan, Zalmi, Norzi, Quetta, and Royal series. Handcrafted leather with authentic Pashtun heritage."
      />

      <PageHero
        badge="Artisan Silhouettes"
        title="All Categories"
        subtitle="Mastercrafted Peshawari Chappal Collections"
        description="Every silhouette is rooted in centuries of Pashtun heritage. Discover classic and contemporary cuts handcrafted with organic leather, tire outsoles, and master artisan precision."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Navigation & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A0988A]/40">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#9e754b] block mb-0.5">
              Curated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A18]">
              Browse By Silhouette
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button
              onClick={() => setSelectedFilter('All')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedFilter === 'All'
                  ? 'bg-[#1A1A18] text-[#F7F4EB] shadow-xs'
                  : 'bg-[#A0988A]/20 text-[#1A1A18] hover:bg-[#A0988A]/40'
              }`}
            >
              All Categories ({dynamicCategories.length})
            </button>
            {dynamicCategories.map(cat => (
              <button
                key={cat.id || cat.name}
                onClick={() => setSelectedFilter(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedFilter.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-[#1A1A18] text-[#F7F4EB] shadow-xs'
                    : 'bg-[#A0988A]/20 text-[#1A1A18] hover:bg-[#A0988A]/40'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {/* Primary Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-3xl border border-[#A0988A]/35 p-3 h-80 flex flex-col justify-between">
                <div className="aspect-[4/5] rounded-2xl bg-[#A0988A]/20" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-[#A0988A]/20 rounded w-1/3" />
                  <div className="h-5 bg-[#A0988A]/20 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredCategories.map(cat => (
              <div
                key={cat.id || cat.name}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-[#A0988A]/35 hover:border-[#1A1A18]/60 p-3 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
              <div>
                {/* Image Card Container */}
                <div className="relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F7F4EB]/60 mb-3">
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Top-left Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    <span className="bg-[#1A1A18] text-[#F7F4EB] text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      BEST SELLER
                    </span>
                    <span className="bg-[#9e754b] text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      FEATURED
                    </span>
                  </div>
                  {/* Top-right Heart Wishlist */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#1A1A18] hover:text-red-500 flex items-center justify-center shadow-xs transition-all active:scale-90"
                    aria-label="Save to wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-1 px-1">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9e754b] block">
                    CHAPPALS
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#1A1A18] group-hover:text-[#9e754b] transition-colors">
                    {cat.name} Series
                  </h3>
                  <p className="text-xs text-[#1A1A18]/70 line-clamp-2 leading-relaxed pt-0.5">
                    {cat.description || `${cat.name} handcrafted Peshawari Chappal with authentic leather and signature Pashtun stitching.`}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 px-1 border-t border-[#A0988A]/25 mt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#1A1A18]/60 block leading-none mb-0.5">Starting from</span>
                    <span className="text-xs sm:text-sm font-bold text-[#1A1A18]">
                      {formatPrice(cat.minPrice)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7B4A28] border border-black/10" title="Saddle Brown" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#111111] border border-black/10" title="Midnight Black" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C19A6B] border border-black/10" title="Camel" />
                  </div>
                </div>

                <Link
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1A1A18] hover:bg-[#33312B] text-[#F7F4EB] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  Explore {cat.name} ({cat.count})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Category Products In-Depth Showcase */}
        <div className="space-y-12 pt-6">
          {filteredCategories.map(cat => {
            if (cat.prods.length === 0) return null;
            return (
              <section key={cat.id || cat.name} className="space-y-5 pt-6 border-t border-[#A0988A]/35">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#9e754b] block">
                      Authentic Collection
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A18]">
                      {cat.name} Collection ({cat.count})
                    </h3>
                  </div>
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="text-xs sm:text-sm font-semibold text-[#1A1A18] hover:text-[#9e754b] flex items-center gap-1 shrink-0"
                  >
                    View All {cat.name} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {cat.prods.slice(0, 4).map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* AI Size & AI Matcher Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-[#A0988A]/40">
          <Link
            to="/size-finder"
            className="p-6 rounded-2xl sm:rounded-3xl bg-[#A0988A]/20 border border-[#A0988A]/40 hover:border-[#1A1A18] hover:shadow-md transition-all flex items-center justify-between gap-4 group"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#9e754b]">
                <Ruler className="w-3.5 h-3.5" /> AI Size Finder
              </span>
              <h4 className="font-serif font-bold text-lg text-[#1A1A18] group-hover:text-[#9e754b] transition-colors">
                Find Your Exact Foot Size
              </h4>
              <p className="text-xs text-[#1A1A18]/70">
                Place your foot against a wall or snap a photo for laser-precise EU/UK sizing.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#1A1A18] group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            to="/outfit-match"
            className="p-6 rounded-2xl sm:rounded-3xl bg-[#A0988A]/20 border border-[#A0988A]/40 hover:border-[#1A1A18] hover:shadow-md transition-all flex items-center justify-between gap-4 group"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#9e754b]">
                <Sparkles className="w-3.5 h-3.5" /> AI Outfit Matcher
              </span>
              <h4 className="font-serif font-bold text-lg text-[#1A1A18] group-hover:text-[#9e754b] transition-colors">
                Style With Shalwar Kameez
              </h4>
              <p className="text-xs text-[#1A1A18]/70">
                Upload your suit or event palette and our AI stylist recommends the ideal chappal pairing.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#1A1A18] group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
