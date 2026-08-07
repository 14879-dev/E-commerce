import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Sliders, Ruler, ArrowRight, Box } from 'lucide-react';
import { Chappal3DViewer } from '../components/3d/Chappal3DViewer';
import { ProductCard } from '../components/product/ProductCard';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { Product } from '../types';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getProducts().then(products => {
      setFeaturedProducts(products.filter(p => p.featured || p.status3D === 'ready').slice(0, 4));
      setLoading(false);
    });
  }, []);

  const categoriesList = [
    { name: 'Kaptaan', desc: 'Signature T-Strap Design', count: '12 Models', img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400' },
    { name: 'Zalmi', desc: 'Royal Double-Stitched', count: '8 Models', img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400' },
    { name: 'Norzi', desc: 'Classic High-Toe Silhouette', count: '6 Models', img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=400' },
    { name: 'Quetta', desc: 'Wide-Bridge Ergonomic', count: '5 Models', img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=400' },
    { name: 'Royal', desc: 'Heirloom Brass & Filigree', count: '4 Models', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 py-2">
      <SEOHelmet
        title="Authentic Handcrafted Leather Peshawari Chappals"
        description="Experience 3D product viewing, live customizer, and camera foot size finder for authentic handcrafted Peshawari Chappals."
      />

      {/* Hero Section - Open, Clean, Seamless Layout */}
      <section className="relative pt-2 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Hero Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Heritage Re-imagined in 3D & AI
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold leading-tight tracking-tight text-slate-900">
              Authentic <br />
              <span className="gradient-copper">
                Peshawari Chappal
              </span> <br />
              <span className="text-slate-600 text-3xl sm:text-5xl font-light italic">
                Crafted for Royalty.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Hand-tanned full-grain cowhide leather, double-stitched by master craftsmen in Khyber Pakhtunkhwa. Designed for enduring elegance, modern ergonomic arch comfort, and personalized 3D customization.
            </p>

            {/* Mobile-Only 3D Product Viewer (Renders directly after description on mobile) */}
            <div className="lg:hidden relative flex flex-col items-center justify-center my-4 py-2">
              <div className="w-full flex items-center justify-between z-10 mb-2 px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  <Box className="w-3.5 h-3.5 text-blue-600" /> Live 3D Product Model
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                  360° Drag • Touch Zoom
                </span>
              </div>

              <Chappal3DViewer
                leatherColor="saddle-tan"
                soleType="double-leather"
                buckleFinish="aged-brass"
                autoRotate={true}
                className="h-72 w-full filter drop-shadow-[0_15px_30px_rgba(15,23,42,0.15)]"
              />
            </div>

            {/* Action Buttons (Appears after 3D Product View on Mobile, side-by-side on Desktop) */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <Link to="/products" className="btn-copper text-sm sm:text-base py-3 px-6 sm:px-8 flex items-center gap-2">
                Explore Catalog
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <Link to="/customize/prod-1" className="btn-glass text-sm sm:text-base py-3 px-5 sm:px-6 flex items-center gap-2 hover:border-blue-500">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Live 3D Studio
              </Link>
            </div>

            {/* Feature Highlights Metrics */}
            <div className="pt-5 grid grid-cols-3 gap-3 border-t border-slate-200">
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-blue-600 block">100%</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Full-Grain Leather</span>
              </div>
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-blue-700 block">3D & AI</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Camera Fit Finder</span>
              </div>
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-blue-600 block">75+ Yrs</span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Artisan Legacy</span>
              </div>
            </div>
          </div>

          {/* Right Hero 3D Model Floating Canvas (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 relative flex-col items-center justify-center">
            
            {/* Header Hint Tag */}
            <div className="w-full flex items-center justify-between z-10 mb-2 px-1">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <Box className="w-3.5 h-3.5 text-blue-600" /> Live 3D Floating Model
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 bg-slate-100/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                360° Drag • Scroll Zoom
              </span>
            </div>

            {/* 3D Model Renderer Canvas */}
            <Chappal3DViewer
              leatherColor="saddle-tan"
              soleType="double-leather"
              buckleFinish="aged-brass"
              autoRotate={true}
              className="h-72 sm:h-[380px] w-full filter drop-shadow-[0_15px_30px_rgba(15,23,42,0.15)]"
            />

            {/* Foot Size Banner CTA */}
            <div className="w-full mt-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Ruler className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-xs sm:text-sm text-slate-900">Unsure of your size?</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500">Scan foot with camera for precision</p>
                </div>
              </div>
              <Link to="/size-finder" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all whitespace-nowrap shadow-xs">
                Size Finder
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Category Section - Fully Visible & Scrollable on Mobile & Desktop */}
      <section className="space-y-6 pt-2 mt-0 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
              Explore Silhouettes
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
              Shop By Category
            </h2>
          </div>
          <Link to="/products" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Touch-Scrollable Category Cards Grid for Mobile & Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {categoriesList.map(cat => (
            <Link
              key={cat.name}
              to={`/products?category=${cat.name}`}
              className="group bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 mb-3">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
                  {cat.count}
                </span>
                <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name} Series
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {cat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Collection */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
              Curated Selection
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
              Featured Iconic Models
            </h2>
          </div>
          <Link to="/products" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-100 h-72 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Craftsmanship Highlights Section */}
      <section className="space-y-8 pt-4 border-t border-slate-200">
        <div className="max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
            Bazaar-e-Kissa Khwani Heritage
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
            Four Steps of Master Craftsmanship
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Every single pair undergoes over 12 hours of meticulous handwork by third-generation Peshawar artisans.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="font-serif text-3xl font-bold text-blue-600/40">01</span>
            <h3 className="font-serif font-bold text-base text-slate-900">Organic Leather Tanning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Raw cowhide cured with natural bark extracts for deep grain resilience and supple flexibility.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="font-serif text-3xl font-bold text-blue-600/40">02</span>
            <h3 className="font-serif font-bold text-base text-slate-900">Precision Stenciling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hand-guided shears cut iconic Kaptaan T-straps according to centuries-old Pashtun patterns.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="font-serif text-3xl font-bold text-blue-600/40">03</span>
            <h3 className="font-serif font-bold text-base text-slate-900">Ergonomic Moulding</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-density recycled tire rubber outsoles crafted for multi-surface grip and enduring longevity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="font-serif text-3xl font-bold text-blue-600/40">04</span>
            <h3 className="font-serif font-bold text-base text-slate-900">Brass Filigree Detail</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hand-engraved solid aged brass buckles and subtle metallic eyelets attached as signature crests.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
