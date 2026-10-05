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
    return products.filter(product => {
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && !product.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'All' && (product.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedSize !== null && !product.availableSizes.includes(selectedSize)) {
        return false;
      }
      if (selectedColor !== 'All' && !product.availableColors.includes(selectedColor)) {
        return false;
      }
      if (product.price > maxPrice) {
        return false;
      }
      return true;
    }).sort((a, b) => {
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
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
            Handcrafted Heritage
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
            Master Chappal Collection
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            {settings.hideCategories
              ? 'Browse all authentic handcrafted models, filter by foot size (7–13), leather shade, or price range.'
              : 'Filter by iconic silhouette, foot size (7–13), organic leather shade, or price range.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl relative pt-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search products by model, leather shade, brass buckle..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Category Horizontal Pills Bar - Hidden if hideCategories is enabled */}
        {!settings.hideCategories && (
          <div className="pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Categories & Silhouettes
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categoryNames.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
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
        
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Category Filter - Hidden if hideCategories is active */}
            {!settings.hideCategories && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Silhouette / Category
                </label>
                <div className="space-y-1.5">
                  {categoryNames.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Foot Size (7 to 13)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Size {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Leather Shade
              </label>
              <div className="space-y-1.5">
                {colors.map(col => (
                  <button
                    key={col.value}
                    onClick={() => setSelectedColor(col.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedColor === col.value
                        ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Max Price
                </label>
                <span className="font-serif font-bold text-slate-900">{formatPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Mobile Filter Toggle & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <span className="text-xs sm:text-sm font-medium text-slate-600">
              Showing <strong className="text-slate-900">{filteredProducts.length}</strong> handcrafted models
            </span>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-blue-600" /> More Filters
              </button>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="featured">Featured & Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Mobile Collapsible Extended Filters Drawer */}
          {showMobileFilters && (
            <div className="lg:hidden p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" /> Extended Mobile Filters
                </h4>
                <button onClick={resetFilters} className="text-xs text-blue-600 font-semibold">
                  Reset All
                </button>
              </div>

              {/* Size Filter on Mobile */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Foot Size (7 to 13)
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedSize === size
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      Size {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter on Mobile */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Leather Shade
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(col => (
                    <button
                      key={col.value}
                      onClick={() => setSelectedColor(col.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedColor === col.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-700'
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Max Price
                  </label>
                  <span className="font-serif font-bold text-slate-900">{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="25000"
                  step="500"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Product Cards Grid - 2 per row on Mobile & Tablet */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-slate-100 h-72 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl text-center py-16 p-8">
              <h3 className="font-serif font-bold text-xl text-slate-900">No chappals match your criteria</h3>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your size, category, or price range filters.</p>
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
