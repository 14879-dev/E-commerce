import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { Product, LeatherColor, Category } from '../types';

import { useStoreSettings } from '../context/StoreSettingsContext';

export const CatalogPage: React.FC = () => {
  const { formatPrice, settings } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';

  // Filters State
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'All');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<LeatherColor | 'All'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (searchTerm.trim().length >= 3) {
      const timer = setTimeout(() => {
        apiService.recordSearchQuery(searchTerm.trim());
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const loadCategories = () => {
    apiService.getCategories().then(cats => {
      setCategories(cats);
    });
  };

  const loadProducts = () => {
    apiService.getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCategories();
    loadProducts();

    const handleCategoriesChanged = () => {
      loadCategories();
      loadProducts();
    };
    const handleProductsChanged = () => {
      loadProducts();
    };

    window.addEventListener('psh:categories-changed', handleCategoriesChanged);
    window.addEventListener('psh:products-changed', handleProductsChanged);
    return () => {
      window.removeEventListener('psh:categories-changed', handleCategoriesChanged);
      window.removeEventListener('psh:products-changed', handleProductsChanged);
    };
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    setSearchTerm(queryParam || '');
  }, [queryParam]);

  const categoryNames = useMemo(() => {
    return ['All', ...categories.map(c => c.name)];
  }, [categories]);

  const sizes = [7, 8, 9, 10, 11, 12, 13];
  const colors: { label: string; value: LeatherColor | 'All' }[] = [
    { label: 'All Colors', value: 'All' },
    { label: 'Saddle Tan', value: 'saddle-tan' },
    { label: 'Espresso', value: 'espresso' },
    { label: 'Burnt Copper', value: 'burnt-copper' },
    { label: 'Mustard Gold', value: 'mustard-gold' },
  ];

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const newParams = new URLSearchParams(searchParams);
    if (catName === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', catName);
    }
    setSearchParams(newParams, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          product.name.toLowerCase().includes(q) ||
          product.subtitle.toLowerCase().includes(q) ||
          (product.category && product.category.toLowerCase().includes(q)) ||
          product.description.toLowerCase().includes(q)
        );
      })
      .filter(product => {
        if (selectedCategory === 'All') return true;
        return (product.category || '').toLowerCase() === selectedCategory.toLowerCase();
      })
      .filter(product => {
        if (!selectedSize) return true;
        return Array.isArray(product.availableSizes) && product.availableSizes.includes(selectedSize);
      })
      .filter(product => {
        if (selectedColor === 'All') return true;
        return Array.isArray(product.availableColors) && product.availableColors.includes(selectedColor);
      })
      .filter(product => {
        return product.price <= maxPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.averageRating - a.averageRating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, searchTerm, selectedCategory, selectedSize, selectedColor, maxPrice, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedSize(null);
    setSelectedColor('All');
    setMaxPrice(25000);
    setSortBy('featured');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="space-y-8">
      <SEOHelmet
        title="Handcrafted Peshawari Chappal Catalog"
        description="Browse our full collection of authentic Peshawari Chappals including Kaptaan, Zalmi, Norzi, and Quetta designs with interactive bespoke viewing."
      />

      {/* Header Banner - Open Layout with Divider Line */}
      <div className="border-b border-[#A0988A]/50 pb-6 space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-1">
            Handcrafted Heritage
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1A18]">
            Master Chappal Collection
          </h1>
          <p className="text-xs sm:text-sm text-[#1A1A18]/80 mt-1 max-w-2xl">
            {settings.hideCategories
              ? 'Browse all authentic handcrafted models, filter by foot size (7–13), leather shade, or price range.'
              : 'Filter by iconic silhouette, foot size (7–13), organic leather shade, or price range.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl relative pt-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A18]/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search products by model, leather shade, brass buckle..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#565449]/35 text-[#1A1A18] placeholder:text-[#1A1A18]/60 text-sm focus:outline-none focus:border-[#565449]"
          />
        </div>

        {/* Category Horizontal Pills Bar - Hidden if hideCategories is enabled */}
        {!settings.hideCategories && (
          <div className="pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 block mb-2">
              Categories &amp; Silhouettes
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categoryNames.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#565449] text-[#F7F4EB] border-[#565449] shadow-xs'
                      : 'bg-[#A0988A]/20 text-[#1A1A18] border-[#A0988A] hover:bg-[#A0988A]/40'
                  }`}
                >
                  {cat} {cat === 'All' ? 'Collection' : 'Chappal'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Filters Sidebar (Desktop) - Warm Taupe Panel */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-[#A0988A]/20 border border-[#A0988A] rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#A0988A]/40">
              <h3 className="font-serif font-bold text-lg text-[#1A1A18] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#1A1A18]" /> Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs text-[#1A1A18]/80 hover:text-[#1A1A18] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Category Filter - Hidden if hideCategories is active */}
            {!settings.hideCategories && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-3">
                  Silhouette / Category
                </label>
                <div className="space-y-1.5">
                  {categoryNames.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-[#565449] text-[#F7F4EB] font-bold'
                          : 'text-[#1A1A18] hover:bg-[#A0988A]/30'
                      }`}
                    >
                      {cat} {cat === 'All' ? '' : 'Chappal'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-3">
                Foot Size (7 to 13)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedSize === size
                        ? 'bg-[#565449] text-[#F7F4EB] border-[#565449]'
                        : 'bg-[#F7F4EB] border-[#A0988A] text-[#1A1A18] hover:border-[#565449]'
                    }`}
                  >
                    Size {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-3">
                Leather Shade
              </label>
              <div className="space-y-1.5">
                {colors.map(col => (
                  <button
                    key={col.value}
                    onClick={() => setSelectedColor(col.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      selectedColor === col.value
                        ? 'bg-[#565449] text-[#F7F4EB] font-bold border border-[#565449]'
                        : 'text-[#1A1A18] hover:bg-[#A0988A]/30'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80">
                  Max Price
                </label>
                <span className="font-serif font-bold text-[#1A1A18]">{formatPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#565449] cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Mobile Filter Toggle & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#A0988A]/40">
            <span className="text-xs sm:text-sm font-medium text-[#1A1A18]/80">
              Showing <strong className="text-[#1A1A18]">{filteredProducts.length}</strong> handcrafted models
            </span>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden px-3.5 py-1.5 rounded-xl bg-[#A0988A]/25 border border-[#565449]/35 text-xs font-bold text-[#1A1A18] flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-[#1A1A18]" /> More Filters
              </button>

              <span className="text-xs text-[#1A1A18]/80 font-medium hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-xs text-[#1A1A18] focus:outline-none focus:border-[#565449]"
              >
                <option value="featured">Featured &amp; Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Mobile Collapsible Extended Filters Drawer */}
          {showMobileFilters && (
            <div className="lg:hidden p-5 rounded-2xl bg-[#A0988A]/20 border border-[#A0988A] space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#A0988A]/40">
                <h4 className="font-serif font-bold text-sm text-[#1A1A18] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#1A1A18]" /> Extended Mobile Filters
                </h4>
                <button onClick={resetFilters} className="text-xs text-[#1A1A18] font-semibold cursor-pointer">
                  Reset All
                </button>
              </div>

              {/* Size Filter on Mobile */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-2">
                  Foot Size (7 to 13)
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'bg-[#565449] text-[#F7F4EB] border-[#565449]'
                          : 'bg-[#F7F4EB] border-[#A0988A] text-[#1A1A18]'
                      }`}
                    >
                      Size {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter on Mobile */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80 mb-2">
                  Leather Shade
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(col => (
                    <button
                      key={col.value}
                      onClick={() => setSelectedColor(col.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedColor === col.value
                          ? 'bg-[#565449] text-[#F7F4EB] border-[#565449]'
                          : 'bg-[#F7F4EB] border-[#A0988A] text-[#1A1A18]'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Slider on Mobile */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/80">
                    Max Price
                  </label>
                  <span className="font-serif font-bold text-[#1A1A18]">{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="500"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#565449] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Product Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-[#A0988A]/20 h-72 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-[#A0988A]/20 border border-[#A0988A] rounded-2xl text-center py-16 p-8">
              <h3 className="font-serif font-bold text-xl text-[#1A1A18]">No chappals match your criteria</h3>
              <p className="text-sm text-[#1A1A18]/80 mt-2">Try adjusting your size, category, or price range filters.</p>
              <button onClick={resetFilters} className="mt-6 btn-copper text-xs py-2.5 px-6">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
