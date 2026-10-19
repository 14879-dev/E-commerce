import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle, Flame, ChevronLeft, ChevronRight, Heart, ArrowDown } from "lucide-react";
import { ProductCard } from "../components/product/ProductCard";
import { SEOHelmet } from "../components/common/SEOHelmet";
import { useStoreSettings } from "../context/StoreSettingsContext";
import { apiService } from "../services/api";
import { normalizeAssetUrl } from "../utils/assetUrl";
import type { Product, Category } from "../types";

// Custom SVG Icons matching banner design
const TargetCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 28 28"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="14" cy="14" r="12" />
    <circle cx="14" cy="14" r="4.5" />
    <line x1="14" y1="5.5" x2="14" y2="8" />
    <line x1="14" y1="20" x2="14" y2="22.5" />
    <line x1="5.5" y1="14" x2="8" y2="14" />
    <line x1="20" y1="14" x2="22.5" y2="14" />
  </svg>
);

const CameraCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 28 28"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="14" cy="14" r="12" />
    <path d="M16.5 9.5h-5L9.5 12H7a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 7 21h14a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 21 12h-2.5l-2-2.5z" />
    <circle cx="14" cy="16.5" r="2.5" />
  </svg>
);

const FootRulerIcon: React.FC<{ className?: string }> = ({ className = "w-4.5 h-4.5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Foot footprint */}
    <path d="M6 19.5c1.7 0 2.6-.9 2.6-2.2 0-1.8-.9-3.2-.9-5.1 0-2.1.9-3.6.9-5 0-1.7-1-2.7-2.6-2.7S3.4 5.5 3.4 7.2c0 1.4.9 2.9.9 5 0 1.9-.9 3.3-.9 5.1 0 1.3.9 2.2 2.6 2.2z" />
    <circle cx="5.8" cy="5.2" r="0.6" fill="currentColor" />
    {/* Ruler */}
    <rect x="13.5" y="4" width="6" height="16" rx="1.5" />
    <line x1="16.5" y1="7.5" x2="19.5" y2="7.5" />
    <line x1="15" y1="11" x2="19.5" y2="11" />
    <line x1="16.5" y1="14.5" x2="19.5" y2="14.5" />
    <line x1="15" y1="18" x2="19.5" y2="18" />
  </svg>
);

const OutfitIcon: React.FC<{ className?: string }> = ({ className = "w-4.5 h-4.5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Shirt */}
    <path d="M4 6.5 7.5 4h9L20 6.5l-2.5 3-1.5-.8V13H8V8.7L6.5 9.5 4 6.5z" />
    <path d="M10 4a2 2 0 0 0 4 0" />
    {/* Trousers */}
    <path d="M11 13h7.5l.5 7h-2.5l-.8-4.5h-.4l-.8 4.5H12l-.5-7z" />
  </svg>
);

export const HomePage: React.FC = () => {
  const { settings, formatPrice } = useStoreSettings();
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

  const activeHeroMedia = useMemo(() => {
    if (heroMediaUrl) {
      const isVid = heroMediaType === "video" || /\.(mp4|webm|ogg)$/i.test(heroMediaUrl);
      return {
        url: heroMediaUrl,
        type: isVid ? ("video" as const) : ("image" as const)
      };
    }
    if (Array.isArray(settings.heroSlides) && settings.heroSlides.length > 0) {
      const active = settings.heroSlides.find(s => s.active !== false);
      if (active && active.url) {
        const url = normalizeAssetUrl(active.url);
        const isVid = active.type === "video" || /\.(mp4|webm|ogg)$/i.test(url);
        return {
          url,
          type: isVid ? ("video" as const) : ("image" as const)
        };
      }
    }
    return {
      url: "/uploads/hero.webp",
      type: "image" as const
    };
  }, [heroMediaUrl, heroMediaType, settings.heroSlides]);

  const dynamicCategories = useMemo(() => categories.map(cat => {
    const catProds = allProducts.filter(p => (p.category || "").toLowerCase() === cat.name.toLowerCase());
    const count = catProds.length;
    const prices = catProds.map(p => Number(p.price) || 0).filter(pr => pr > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 6999;
    return {
      id: cat.id, name: cat.name,
      desc: cat.description || cat.name,
      count: count + " " + (count === 1 ? "Model" : "Models"),
      img: cat.image || "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600",
      minPrice,
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

      {/* Hero Section: Unified Custom Banner identical across Desktop and Mobile */}
      <section className="psh-hero relative w-full overflow-hidden select-none bg-[#ECE6DA]">
        <style>{`@media(min-width:1024px){.psh-hero-banner{height:50vh!important;min-height:420px!important;max-height:500px!important}}`}</style>
        
        {/* Unified Banner for Desktop, Tablet, and Mobile */}
        <div className="psh-hero-banner relative w-full aspect-[1024/523] min-h-[250px] sm:min-h-[420px] max-h-[500px] overflow-hidden">
          {/* Dynamic Background Media Layer (Image or Video from Admin Panel) */}
          {activeHeroMedia.type === "video" ? (
            <video
              src={activeHeroMedia.url}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />
          ) : (
            <img
              src={activeHeroMedia.url}
              alt="Authentic Handcrafted Peshawari Chappal"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />
          )}

          {/* 1. TOP-LEFT: AI Foot Size Finder */}
          <div className="absolute left-[3%] sm:left-[5%] lg:left-[6%] top-[8%] sm:top-[16%] lg:top-[18%] max-w-[46%] sm:max-w-[340px] z-20 text-left">
            <div className="flex items-center gap-1 sm:gap-2.5">
              <div className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border border-white/45 flex items-center justify-center shrink-0 text-white/95">
                <TargetCircleIcon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </div>
              <h2 className="text-[#F7F4EB] font-bold text-[9px] sm:text-base lg:text-[17px] tracking-[0.04em] sm:tracking-[0.12em] uppercase drop-shadow-sm font-sans whitespace-nowrap">
                AI FOOT SIZE FINDER
              </h2>
            </div>
            <p className="text-[#ECE4D2] text-[8px] sm:text-xs lg:text-[14px] leading-tight sm:leading-relaxed mt-0.5 sm:mt-2.5 max-w-[330px] font-normal drop-shadow-xs line-clamp-2 sm:line-clamp-none">
              Take a picture of your foot with a debit card placed beside it. Our AI will scan it and give you the perfect size.
            </p>
            <Link
              to="/size-finder"
              className="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-[#EDE3CF] hover:bg-[#F9F5EC] text-[#382717] px-2 py-0.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 mt-1 sm:mt-3.5 shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-95 group cursor-pointer border border-[#DDD3BF]"
              title="Find your foot size with AI camera calibration"
            >
              <FootRulerIcon className="w-3 h-3 sm:w-4.5 sm:h-4.5 text-[#382717] shrink-0" />
              <span className="hidden xs:inline w-px h-3 sm:h-4 bg-[#382717]/25 shrink-0" />
              <span className="text-[9px] sm:text-[13px] font-medium tracking-wide">
                Find your foot size.
              </span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-[#382717] group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>

          {/* 2. TOP-RIGHT: AI Outfit Matcher */}
          <div className="absolute right-[3%] sm:right-[4.5%] lg:right-[5.5%] top-[10%] sm:top-[19%] lg:top-[21%] max-w-[46%] sm:max-w-[340px] z-20 text-left">
            <div className="flex items-center gap-1 sm:gap-2.5">
              <div className="w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border border-white/45 flex items-center justify-center shrink-0 text-white/95">
                <CameraCircleIcon className="w-3 h-3 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </div>
              <h2 className="text-[#F7F4EB] font-bold text-[9px] sm:text-base lg:text-[17px] tracking-[0.04em] sm:tracking-[0.12em] uppercase drop-shadow-sm font-sans whitespace-nowrap">
                AI OUTFIT MATCHER
              </h2>
            </div>
            <p className="text-[#ECE4D2] text-[8px] sm:text-xs lg:text-[14px] leading-tight sm:leading-relaxed mt-0.5 sm:mt-2.5 max-w-[310px] font-normal drop-shadow-xs line-clamp-2 sm:line-clamp-none">
              Upload your outfit to find matching Peshawari Chappals.
            </p>
            <Link
              to="/outfit-match"
              className="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-[#EDE3CF] hover:bg-[#F9F5EC] text-[#382717] px-2 py-0.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 mt-1 sm:mt-3.5 shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-95 group cursor-pointer border border-[#DDD3BF]"
              title="Upload your outfit to match with authentic Peshawari Chappals"
            >
              <OutfitIcon className="w-3 h-3 sm:w-4.5 sm:h-4.5 text-[#382717] shrink-0" />
              <span className="hidden xs:inline w-px h-3 sm:h-4 bg-[#382717]/25 shrink-0" />
              <span className="text-[9px] sm:text-[13px] font-medium tracking-wide">
                Find your best design.
              </span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-[#382717] group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>

          {/* 3. BOTTOM-LEFT: Shop Collection */}
          <div className="absolute left-[3%] sm:left-[5%] lg:left-[6%] bottom-[4%] sm:bottom-[7%] z-20 text-left">
            <Link
              to="/products"
              className="group inline-block cursor-pointer text-left"
              title="Browse traditional Peshawari chappals collection"
            >
              <div className="flex items-center gap-1 sm:gap-2 text-[#382717] hover:text-[#25180c] font-bold text-xs sm:text-2xl lg:text-[28px] tracking-tight transition-colors">
                <span>Shop Collection</span>
                <ArrowRight className="w-3 h-3 sm:w-6 sm:h-6 text-[#382717] group-hover:translate-x-1.5 transition-transform" />
              </div>
              <p className="text-[8px] sm:text-sm text-[#4F3C28] font-normal mt-0 sm:mt-0.5 group-hover:text-[#382717] transition-colors">
                Browse traditional Peshawari chappals
              </p>
            </Link>
          </div>

          {/* 4. BOTTOM-RIGHT: How Do Our AI Works? */}
          <div className="absolute right-[3%] sm:right-[4.5%] lg:right-[5.5%] bottom-[4%] sm:bottom-[8%] z-20">
            <Link
              to="/how-ai-models-work"
              className="inline-flex items-center gap-1 sm:gap-2 rounded-full bg-[#EDE3CF] hover:bg-[#F9F5EC] text-[#382717] px-2.5 py-1 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-95 group cursor-pointer text-[9px] sm:text-sm font-medium border border-[#DDD3BF]"
              title="Learn how our AI Foot Size Scanner and Outfit Matcher work"
            >
              <span>How Do Our AI Works?</span>
              <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-[#382717] group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* Section 1: Categories (Reference Card Layout with Gradient Overlay and Centered SEE ALL Button) */}
        {!settings.hideCategories && (
          <section className="space-y-4 pt-6 border-t border-[#A0988A]/50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#9e754b] block mb-0.5">Explore Silhouettes</span>
                <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A18]">Shop By Category</h2>
              </div>
              <Link to="/categories" className="text-xs sm:text-sm font-semibold text-[#1A1A18] hover:text-[#9e754b] flex items-center gap-1 shrink-0 whitespace-nowrap">
                View All Categories <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>

            {/* Container for Cards with Bottom Fade Overlay and SEE ALL Button */}
            <div className="relative pt-2 pb-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {dynamicCategories.map((cat) => (
                  <Link
                    key={cat.id || cat.name}
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="group bg-white rounded-2xl sm:rounded-3xl border border-[#A0988A]/35 hover:border-[#1A1A18]/60 p-2.5 sm:p-3 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    {/* Image Container with Badges & Wishlist Heart */}
                    <div className="relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-[#F7F4EB]/60 mb-2.5 sm:mb-3">
                      <img
                        src={cat.img}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Top-left Badges matching reference image */}
                      <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 flex flex-col gap-1 z-10">
                        <span className="bg-[#1A1A18] text-[#F7F4EB] text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          BEST SELLER
                        </span>
                        <span className="bg-[#9e754b] text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          FEATURED
                        </span>
                      </div>
                      {/* Top-right Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-[#1A1A18] hover:text-red-500 flex items-center justify-center shadow-xs transition-all active:scale-90"
                        aria-label="Save to wishlist"
                      >
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Card Body Info */}
                    <div className="space-y-1 px-1 pb-1">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#9e754b] block">
                        SHOES
                      </span>
                      <h3 className="font-serif font-bold text-sm sm:text-base lg:text-lg text-[#1A1A18] group-hover:text-[#9e754b] transition-colors line-clamp-1">
                        {cat.name} Series
                      </h3>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-[#1A1A18]/60 block leading-none mb-0.5">Starting from</span>
                          <span className="text-xs sm:text-sm font-bold text-[#1A1A18]">
                            {formatPrice(cat.minPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#7B4A28] border border-black/10" title="Saddle Brown" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#111111] border border-black/10" title="Midnight Black" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Bottom Gradient Overlay (fades out the bottom area of cards just like reference image) */}
              <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#F7F4EB] via-[#F7F4EB]/85 to-transparent pointer-events-none z-10" />

              {/* Floating Pill SEE ALL Button with Downward Pointing Arrow */}
              <div className="absolute inset-x-0 bottom-1 sm:bottom-2 flex justify-center z-20">
                <Link
                  to="/categories"
                  className="group inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-2.5 sm:py-3 bg-white hover:bg-white text-[#1A1A18] rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.18)] border border-[#A0988A]/40 hover:border-[#1A1A18] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm"
                >
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1A1A18]">
                    SEE ALL
                  </span>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#1A1A18]/30 group-hover:border-[#1A1A18] group-hover:bg-[#1A1A18] group-hover:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1A1A18] group-hover:text-white transition-transform duration-300 group-hover:translate-y-0.5" />
                  </span>
                </Link>
              </div>
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
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <div className="pt-6 sm:pt-8 flex justify-center">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 group cursor-pointer border border-[#565449]"
                >
                  <span>View All Products</span>
                  <ArrowRight className="w-4 h-4 text-[#EDE3CF] group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </div>
            </>
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
              <span className="font-serif text-3xl font-bold text-[#9e754b]">01</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Organic Leather Tanning</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">Raw cowhide cured with natural bark extracts for deep grain resilience and supple flexibility.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#9e754b]">02</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Precision Stenciling</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">Hand-guided shears cut iconic Kaptaan T-straps according to centuries-old Pashtun patterns.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#9e754b]">03</span>
              <h3 className="font-serif font-bold text-base text-[#1A1A18]">Ergonomic Moulding</h3>
              <p className="text-xs text-[#1A1A18]/80 leading-relaxed">High-density recycled tire rubber outsoles crafted for multi-surface grip and enduring longevity.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-2">
              <span className="font-serif text-3xl font-bold text-[#9e754b]">04</span>
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
