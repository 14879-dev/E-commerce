import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "../components/product/ProductCard";
import { SEOHelmet } from "../components/common/SEOHelmet";
import { useStoreSettings } from "../context/StoreSettingsContext";
import { apiService } from "../services/api";
import { normalizeAssetUrl } from "../utils/assetUrl";
import type { Product, Category } from "../types";
import type { HeroSlide } from "../types/admin";

export const HomePage: React.FC = () => {
  const { settings } = useStoreSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visitsMap, setVisitsMap] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMediaUrl, setHeroMediaUrl] = useState<string | null>(
    normalizeAssetUrl(settings.heroMediaUrl) || null
  );
  const [heroMediaType, setHeroMediaType] = useState<"image" | "video" | null>(
    settings.heroMediaType || null
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  // Mouse drag-to-swipe for horizontal products grid
  const [isDraggingTrending, setIsDraggingTrending] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const handleMouseDownTrending = (e: React.MouseEvent) => {
    if (!trendingScrollRef.current) return;
    setIsDraggingTrending(true);
    setDragStartX(e.pageX - trendingScrollRef.current.offsetLeft);
    setDragScrollLeft(trendingScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveTrending = () => {
    setIsDraggingTrending(false);
  };

  const handleMouseUpTrending = () => {
    setIsDraggingTrending(false);
  };

  const handleMouseMoveTrending = (e: React.MouseEvent) => {
    if (!isDraggingTrending || !trendingScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - trendingScrollRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    trendingScrollRef.current.scrollLeft = dragScrollLeft - walk;
  };

  const scrollTrending = (direction: 'left' | 'right') => {
    if (trendingScrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      trendingScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const loadHomeData = () => {
    apiService.getProducts().then(products => {
      setAllProducts(products);
      // 2 full rows (4 columns x 2 rows = 8 products)
      const featured = products.filter(p => p.featured);
      const twoRows = featured.length >= 8 ? featured.slice(0, 8) : (products.length >= 8 ? products.slice(0, 8) : products);
      setFeaturedProducts(twoRows);
      setLoading(false);
    });
    apiService.getCategories().then(cats => setCategories(cats));
    setVisitsMap(apiService.getAllProductVisits());
  };

  useEffect(() => {
    loadHomeData();
    fetch("/api/hero-media")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d && d.url) {
          setHeroMediaUrl(normalizeAssetUrl(d.url));
          setHeroMediaType(d.type);
        } else {
          setHeroMediaUrl(null);
          setHeroMediaType(null);
        }
      })
      .catch(() => {});
    const onCats = () => loadHomeData();
    const onProds = () => loadHomeData();
    const onSettings = (e: Event) => {
      const s = (e as CustomEvent).detail;
      if (s && "heroMediaUrl" in s) {
        setHeroMediaUrl(normalizeAssetUrl(s.heroMediaUrl) || null);
        setHeroMediaType(s.heroMediaType ?? null);
      }
    };
    window.addEventListener("psh:categories-changed", onCats);
    window.addEventListener("psh:products-changed", onProds);
    window.addEventListener("psh:store-settings-changed", onSettings);
    return () => {
      window.removeEventListener("psh:categories-changed", onCats);
      window.removeEventListener("psh:products-changed", onProds);
      window.removeEventListener("psh:store-settings-changed", onSettings);
    };
  }, []);

  const slides: HeroSlide[] = useMemo(() => {
    if (Array.isArray(settings.heroSlides) && settings.heroSlides.length > 0) {
      const active = settings.heroSlides.filter(s => s.active !== false);
      if (active.length > 0) return active;
    }
    if (heroMediaUrl) {
      return [{
        id: 'custom-single',
        url: heroMediaUrl,
        type: heroMediaType || 'image',
        badge: 'Heritage Re-imagined With AI Fit',
        title: 'Authentic Peshawari Chappal',
        subtitle: 'Crafted for Royalty.',
        description: 'Hand-tanned full-grain cowhide leather, double-stitched by master craftsmen in Khyber Pakhtunkhwa.',
        linkText: 'Shop Collection',
        linkUrl: '/products',
        active: true
      }];
    }
    return [
      {
        id: 'slide-1',
        url: '/uploads/hero.webp',
        type: 'image',
        badge: 'Heritage Re-imagined With AI Fit',
        title: 'Authentic Peshawari Chappal',
        subtitle: 'Crafted for Royalty.',
        description: 'Hand-tanned full-grain cowhide leather, double-stitched by master craftsmen in Khyber Pakhtunkhwa.',
        linkText: 'Shop Now',
        linkUrl: '/products',
        active: true
      },
      {
        id: 'slide-2',
        url: '/images/ai-foot-scanner-demo.jpg',
        type: 'image',
        badge: 'Camera Size Calibration',
        title: 'AI Foot Size Finder',
        subtitle: 'True-to-Size Peshawari Fit.',
        description: 'Place your foot on standard A4 paper. Millimeter-accurate size recommendation with zero guesswork.',
        linkText: 'Find Your Size',
        linkUrl: '/size-finder',
        active: true
      },
      {
        id: 'slide-3',
        url: '/images/ai-outfit-matcher-demo.jpg',
        type: 'image',
        badge: 'Color Harmony & Tone AI',
        title: 'AI Traditional Outfit Matcher',
        subtitle: 'Color & Tone Pairing.',
        description: 'Upload a photo of your Shalwar Kameez or Kurta. Match with the ideal leather shade and silhouette.',
        linkText: 'Match Your Outfit',
        linkUrl: '/outfit-match',
        active: true
      }
    ];
  }, [settings.heroSlides, heroMediaUrl, heroMediaType]);

  // Auto-play slide timer
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [slides.length, isHovered]);

  const prevSlide = () => setCurrentSlideIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () => setCurrentSlideIndex(prev => (prev + 1) % slides.length);

  const dynamicCategories = useMemo(() => categories.map(cat => {
    const count = allProducts.filter(p => (p.category || "").toLowerCase() === cat.name.toLowerCase()).length;
    return {
      id: cat.id, name: cat.name,
      desc: cat.description || cat.name,
      count: count + " " + (count === 1 ? "Model" : "Models"),
      img: cat.image || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
    };
  }), [categories, allProducts]);

  // Only trending products based on high visitors and customer demand
  const trendingProducts = useMemo(() => {
    const scored = allProducts.map(p => {
      const views = visitsMap[p.id] || 0;
      return {
        product: p,
        views,
        score: views * 2 + (p.featured ? 4 : 0) + (p.averageRating >= 4.5 ? 2 : 0),
      };
    });

    const activeTrending = scored.filter(item => item.views > 0 || item.product.featured);
    const candidates = activeTrending.length > 0 ? activeTrending : scored;

    return candidates
      .sort((a, b) => b.score - a.score || b.views - a.views)
      .slice(0, 10)
      .map(item => item.product);
  }, [allProducts, visitsMap]);

  return (
    <div className="w-full">
      <SEOHelmet
        title="Peshawari Chappal | 100% Pure Leather Handcrafted Chappals Online"
        description="Shop authentic Peshawari Chappals in Pakistan & worldwide. 100% full-grain cowhide leather Kaptaan, Zalmi, Norzi, Charsadda, & Quetta chappals with camera foot size finder and fast COD delivery."
        keywords="peshawari chappal, chappal, pure leather chappal, kaptaan chappal, zalmi chappal, norzi chappal, charsadda chappal, quetta chappal, mens chappal, buy chappal online, tyre sole chappal, wedding chappal"
      />

      {/* Hero Section: Interactive Slider with smooth cross-fade */}
      <section
        className="psh-hero relative w-full overflow-hidden min-h-[540px] sm:min-h-[560px] lg:min-h-[580px] select-none flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <style>{`@media(min-width:1024px){.psh-hero{min-height:580px!important}}`}</style>

        {/* Slides Media Layer */}
        {slides.map((slide, idx) => {
          const isCurrent = idx === currentSlideIndex;
          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isCurrent ? "opacity-100 z-0" : "opacity-0 pointer-events-none -z-10"
              }`}
            >
              {slide.type === "video" ? (
                <video
                  src={normalizeAssetUrl(slide.url)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover object-[78%_center] sm:object-center"
                />
              ) : (
                <img
                  src={normalizeAssetUrl(slide.url) || '/uploads/hero.webp'}
                  alt={slide.title || "Hero Slide"}
                  className="w-full h-full object-cover object-[78%_center] sm:object-center"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/uploads/hero.webp')) {
                      target.src = '/uploads/hero.webp';
                    }
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Contrast overlay: subtle dark atmospheric gradient on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent pointer-events-none z-[1]" />

        {/* Slide Content Layer */}
        <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 sm:py-8">
          <div className="max-w-xl flex flex-col items-start text-left space-y-4 sm:space-y-4.5">
            
            {/* Dual AI Model Showcase Containers matching Reference Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 max-w-xl w-full">
              {/* Container 1: AI SIZE FINDER */}
              <Link
                to="/size-finder"
                className="group relative rounded-2xl sm:rounded-3xl border-2 border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_22px_rgba(56,189,248,0.3)] hover:shadow-[0_0_32px_rgba(56,189,248,0.55)] bg-black/45 hover:bg-black/55 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden transform-gpu hover:-translate-y-0.5"
                title="AI Size Finder - Camera foot calibration"
              >
                <div className="space-y-1">
                  <h2 className="text-white font-extrabold text-sm sm:text-base tracking-wider uppercase drop-shadow-sm group-hover:text-cyan-200 transition-colors">
                    AI SIZE FINDER
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-200 leading-snug">
                    Take a picture of your foot to find your perfect size.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-center">
                  <img
                    src="/images/ai-foot-scanner-visual.png"
                    alt="AI Foot Size Finder camera scanning foot"
                    className="w-full h-24 sm:h-28 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              {/* Container 2: AI OUTFIT MATCHER */}
              <Link
                to="/outfit-matcher"
                className="group relative rounded-2xl sm:rounded-3xl border-2 border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_22px_rgba(56,189,248,0.3)] hover:shadow-[0_0_32px_rgba(56,189,248,0.55)] bg-black/45 hover:bg-black/55 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden transform-gpu hover:-translate-y-0.5"
                title="AI Outfit Matcher - Find matching Peshawari Chappals"
              >
                <div className="space-y-1">
                  <h2 className="text-white font-extrabold text-sm sm:text-base tracking-wider uppercase drop-shadow-sm group-hover:text-cyan-200 transition-colors">
                    AI OUTFIT MATCHER
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-200 leading-snug">
                    Upload your outfit to find matching Peshawari Chappals.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-center">
                  <img
                    src="/images/ai-outfit-matcher-visual.png"
                    alt="AI Outfit Matcher matching clothing to chappal"
                    className="w-full h-24 sm:h-28 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            </div>

            {/* Action Buttons: Shop Collection + How AI models work! */}
            <div className="pt-1 flex items-center justify-start gap-3 w-auto flex-wrap">
              <Link
                to="/products"
                className="h-10 sm:h-11 px-5 sm:px-6 rounded-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-[#F7F4EB] bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-xs shadow-md transition-all cursor-pointer active:scale-98 whitespace-nowrap"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              <Link
                to="/how-ai-models-work"
                className="h-10 sm:h-11 px-5 sm:px-6 rounded-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#1A1A18] bg-[#F5EEDB] hover:bg-[#EAE1CC] shadow-md transition-all cursor-pointer active:scale-98 whitespace-nowrap"
              >
                <span>How AI models work!</span>
              </Link>
            </div>

            {/* Feature Highlights Metrics */}
            <div className="pt-2.5 border-t border-white/20 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg w-full">
              <div>
                <span className="font-bold text-lg sm:text-2xl text-white block leading-tight">100%</span>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium block leading-tight">Pure Leather</span>
              </div>
              <div>
                <span className="font-bold text-lg sm:text-2xl text-white block leading-tight">AI Size</span>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium block leading-tight">Camera Calibration</span>
              </div>
              <div>
                <span className="font-bold text-lg sm:text-2xl text-white block leading-tight">Nationwide</span>
                <span className="text-[10px] sm:text-xs text-white/80 font-medium block leading-tight">Fast COD Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Navigation Arrows (shown if >1 slide) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#565449]/70 hover:bg-[#45433A] text-[#F7F4EB] backdrop-blur-md border border-[#F7F4EB]/30 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#565449]/70 hover:bg-[#45433A] text-[#F7F4EB] backdrop-blur-md border border-[#F7F4EB]/30 flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Indicators / Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-[#565449]/70 backdrop-blur-md border border-[#F7F4EB]/25">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlideIndex
                      ? "w-6 sm:w-8 bg-[#F7F4EB] shadow-sm"
                      : "w-1.5 sm:w-2 bg-[#F7F4EB]/40 hover:bg-[#F7F4EB]/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Main Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* Section 1: Categories (Bone Canvas with Warm Taupe Cards) */}
        {!settings.hideCategories && (
          <section className="space-y-0 pt-6 border-t border-[#A0988A]/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-0.5">Explore Silhouettes</span>
                <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A18]">Shop By Category</h2>
              </div>
              <Link to="/products" className="text-xs sm:text-sm font-semibold text-[#1A1A18] hover:text-[#45433A] flex items-center gap-1 shrink-0 whitespace-nowrap">
                View All Categories <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 md:grid-cols-5 sm:overflow-x-visible sm:pb-0 sm:gap-4 pt-3">
              {dynamicCategories.map(cat => (
                <Link key={cat.id || cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`} className="group bg-[#A0988A]/20 rounded-2xl border border-[#A0988A] p-3 sm:p-4 hover:border-[#565449] hover:shadow-md transition-all flex flex-col justify-between flex-shrink-0 w-[68vw] sm:w-auto snap-start">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F7F4EB]/40 mb-3">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#1A1A18] tracking-wider block">{cat.count}</span>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#1A1A18] group-hover:text-[#45433A] transition-colors">{cat.name} Series</h3>
                    <p className="text-[11px] text-[#1A1A18]/70 line-clamp-1 mt-0.5">{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Trending Section — Clean Open Layout with Smooth Horizontal Scroll */}
        <section className="space-y-6 pt-4 border-t border-[#A0988A]/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A0988A]/20 border border-[#565449]/20 text-[11px] font-bold text-[#1A1A18] uppercase tracking-wider mb-1.5">
                <Flame className="w-3.5 h-3.5 fill-[#565449] text-[#1A1A18] animate-pulse" />
                <span>Trending Right Now</span>
              </div>
              <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A18]">
                Best Sellers
              </h2>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 mt-0.5">
                Our most sought-after silhouettes, handcrafted with supreme leather and time-honored artistry.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Navigation arrows for desktop horizontal scrolling */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => scrollTrending('left')}
                  aria-label="Scroll trending left"
                  className="w-9 h-9 rounded-full bg-[#A0988A]/20 hover:bg-[#565449] text-[#1A1A18] hover:text-[#F7F4EB] border border-[#565449]/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTrending('right')}
                  aria-label="Scroll trending right"
                  className="w-9 h-9 rounded-full bg-[#A0988A]/20 hover:bg-[#565449] text-[#1A1A18] hover:text-[#F7F4EB] border border-[#565449]/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <Link
                to="/products"
                className="text-xs sm:text-sm font-semibold text-[#1A1A18] hover:text-[#45433A] flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                Explore All <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-4 sm:gap-6 overflow-hidden pb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-[260px] sm:w-[280px] md:w-[310px] shrink-0 bg-[#A0988A]/20 h-72 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="py-10 px-6 rounded-2xl bg-[#A0988A]/15 border border-[#A0988A]/30 text-center space-y-2">
              <Flame className="w-7 h-7 text-[#1A1A18] mx-auto" />
              <h4 className="font-serif font-bold text-[#1A1A18] text-base">New Trending Chappals Arriving</h4>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-md mx-auto">
                As shoppers browse our artisan collections, top-visited and highest-rated designs will be featured here automatically.
              </p>
            </div>
          ) : (
            <div
              ref={trendingScrollRef}
              onMouseDown={handleMouseDownTrending}
              onMouseLeave={handleMouseLeaveTrending}
              onMouseUp={handleMouseUpTrending}
              onMouseMove={handleMouseMoveTrending}
              className={`flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x sm:snap-none scrollbar-thin select-none ${
                isDraggingTrending ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {trendingProducts.map(p => (
                <div key={p.id} className="w-[260px] sm:w-[280px] md:w-[310px] shrink-0 snap-start relative group flex flex-col">
                  <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#565449] text-[#F7F4EB] border border-[#F7F4EB]/40 text-[9px] sm:text-[10px] font-bold shadow-xs">
                      <Flame className="w-2.5 h-2.5 fill-[#F7F4EB] text-[#F7F4EB]" />
                      Trending
                    </span>
                  </div>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Featured Models (Bone Canvas) */}
        <section className="space-y-6 pt-4 border-t border-[#A0988A]/50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-0.5">Curated Selection</span>
              <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A18]">Featured Iconic Models</h2>
            </div>
            <Link to="/products" className="text-xs sm:text-sm font-semibold text-[#1A1A18] hover:text-[#45433A] flex items-center gap-1 shrink-0 whitespace-nowrap">
              View All Products <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="bg-[#A0988A]/20 h-72 rounded-2xl animate-pulse" />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-12 px-6 rounded-2xl bg-[#A0988A]/20 border border-[#A0988A] text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A18] block">Workshop In Production</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A18]">Fresh Artisan Collection Arriving Soon</h3>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-md mx-auto">
                Our master artisans in Khyber Pakhtunkhwa are currently hand-stitching new leather releases. Check back shortly!
              </p>
              <div className="pt-2">
                <Link to="/products" className="btn-copper text-xs py-2.5 px-5 inline-flex items-center gap-2">
                  Browse Full Catalog
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Section 4: Heritage Craftsmanship (Warm Taupe Cards) */}
        <section className="space-y-8 pt-4 border-t border-[#A0988A]/50">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-1">Bazaar-e-Kissa Khwani Heritage</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1A1A18]">Four Steps of Master Craftsmanship</h2>
            <p className="text-xs sm:text-sm text-[#1A1A18]/80 mt-1">Every single pair undergoes over 12 hours of meticulous handwork by third-generation Peshawar artisans.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#1A1A18]/40">01</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Organic Leather Tanning</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">Raw cowhide cured with natural bark extracts for deep grain resilience and supple flexibility.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#1A1A18]/40">02</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Precision Stenciling</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">Hand-guided shears cut iconic Kaptaan T-straps according to centuries-old Pashtun patterns.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#1A1A18]/40">03</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Ergonomic Moulding</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">High-density recycled tire rubber outsoles crafted for multi-surface grip and enduring longevity.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#1A1A18]/40">04</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Brass Filigree Detail</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">Hand-engraved solid aged brass buckles and subtle metallic eyelets attached as signature crests.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Customer Care & FAQ (Warm Taupe Box Contrast) */}
        <section className="pt-8 pb-4 border-t border-[#A0988A]/50">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#A0988A]/25 border border-[#A0988A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A0988A]/40 text-[#1A1A18] text-[11px] font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Support & Size Guide</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A18]">
                Have questions about authentic leather, sizing, or doorstep delivery?
              </h3>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 leading-relaxed">
                Learn about traditional Khyber leathercraft, tire rubber soles, easy size exchanges, and nationwide Cash on Delivery.
              </p>
            </div>
            <Link
              to="/faqs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-semibold text-xs tracking-wide shadow-md transition-all shrink-0 hover:scale-105 border border-[#565449]"
            >
              <span>Explore FAQs Guide</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
