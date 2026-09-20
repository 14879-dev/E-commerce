import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Ruler, ArrowRight, HelpCircle, Flame } from "lucide-react";
import { ProductCard } from "../components/product/ProductCard";
import { SEOHelmet } from "../components/common/SEOHelmet";
import { useStoreSettings } from "../context/StoreSettingsContext";
import { apiService } from "../services/api";
import { normalizeAssetUrl } from "../utils/assetUrl";
import type { Product, Category } from "../types";

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

  const loadHomeData = () => {
    apiService.getProducts().then(products => {
      setAllProducts(products);
      setFeaturedProducts(products.filter(p => p.featured).slice(0, 4));
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
      .slice(0, 4)
      .map(item => item.product);
  }, [allProducts, visitsMap]);

  return (
    <div className="w-full">
      <SEOHelmet
        title="Peshawari Chappal | 100% Pure Leather Handcrafted Chappals Online"
        description="Shop authentic Peshawari Chappals in Pakistan & worldwide. 100% full-grain cowhide leather Kaptaan, Zalmi, Norzi, Charsadda, & Quetta chappals with camera foot size finder and fast COD delivery."
        keywords="peshawari chappal, chappal, pure leather chappal, kaptaan chappal, zalmi chappal, norzi chappal, charsadda chappal, quetta chappal, mens chappal, buy chappal online, tyre sole chappal, wedding chappal"
      />

      {/* Hero Section: 50vh on both mobile and desktop (2/4 screen height) */}
      <section
        className="psh-hero relative w-full overflow-hidden min-h-[380px]"
        style={{ height: "50vh" }}
      >
        <style>{`@media(min-width:1024px){.psh-hero{height:50vh!important;min-height:420px!important}}`}</style>

        {heroMediaUrl ? (
          heroMediaType === "video" ? (
            <video src={normalizeAssetUrl(heroMediaUrl)} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover object-[78%_center] sm:object-center" />
          ) : (
            <img src={normalizeAssetUrl(heroMediaUrl)} alt="Hero background" className="absolute inset-0 w-full h-full object-cover object-[78%_center] sm:object-center" />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
        )}

        {/* Contrast overlay: Left-to-right on both mobile and desktop so chappal on the right stays fully visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 w-full">
          {/* Top Block: Badge + Line-by-Line Heading with <br /> + Little Description */}
          <div className="max-w-xl space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-900/60 border border-blue-400/40 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-blue-200 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
              Heritage Re-imagined With AI Fit
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-md">
              Authentic <br className="sm:hidden" />{' '}
              <span className="text-blue-400 drop-shadow-sm">Peshawari</span> <br className="sm:hidden" />{' '}
              <span className="text-blue-400 drop-shadow-sm">Chappal</span> <br className="sm:hidden" />{' '}
              <span className="text-blue-200 text-base sm:text-2xl lg:text-3xl font-light italic">
                Crafted for Royalty.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-lg drop-shadow-sm">
              Hand-tanned full-grain cowhide leather,<br className="sm:hidden" />{' '}
              double-stitched by master craftsmen<br className="sm:hidden" />{' '}
              in Khyber Pakhtunkhwa.
            </p>
          </div>

          {/* Bottom Block: Fully aligned side-by-side buttons & metrics */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 w-full max-w-xs sm:max-w-none">
              <Link to="/products" className="btn-copper text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-7 flex-1 sm:flex-initial flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 whitespace-nowrap">
                Shop Now
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>

              <Link to="/size-finder" className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-white bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md transition-all gap-2 text-xs sm:text-sm flex-1 sm:flex-initial whitespace-nowrap">
                <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                AI Size Finder
              </Link>
            </div>

            {/* Feature Highlights Metrics (Desktop & Tablet) */}
            <div className="pt-3 hidden sm:grid grid-cols-3 gap-4 border-t border-white/20 max-w-md">
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-blue-400 block">100%</span>
                <span className="text-[11px] sm:text-xs text-white/80 font-medium">Full-Grain Leather</span>
              </div>
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-blue-300 block">AI Fit</span>
                <span className="text-[11px] sm:text-xs text-white/80 font-medium">Camera Fit Finder</span>
              </div>
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-blue-400 block">75+ Yrs</span>
                <span className="text-[11px] sm:text-xs text-white/80 font-medium">Artisan Legacy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">

        {/* AI Innovation Features (Simple, Open & Clean) */}
        <section className="pt-2 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
                Smart AI Studio
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                Precision Sizing & Outfit Harmony
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Try our AI camera tools to ensure 100% accurate fit and effortless styling before you order.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Feature 1: AI Camera Foot Size Finder */}
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                <img
                  src="/images/ai-foot-scanner-demo.jpg"
                  alt="AI Foot Size Finder with A4 Paper Reference"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Camera Size Calibration
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                  AI Foot Size Finder
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Place your foot on a standard sheet of A4 paper. Our camera measurement algorithm calculates your exact foot length in millimeters and recommends your perfect true-to-size Peshawari Chappal fit (Sizes 7–13) with zero guesswork.
                </p>
                <div className="pt-2">
                  <Link
                    to="/size-finder"
                    className="inline-flex items-center gap-2 font-semibold text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors group"
                  >
                    <span>Scan Your Foot on A4 Paper</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 2: AI Traditional Outfit Matcher */}
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                <img
                  src="/images/ai-outfit-matcher-demo.jpg"
                  alt="AI Outfit Matcher Demonstration"
                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Color Harmony & Tone AI
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                  AI Traditional Outfit Matcher
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Upload a photo of your Shalwar Kameez, Kurta, or Waistcoat. Our AI detects color tones and pairs you with the ideal chappal leather shade and silhouette for Eid, weddings, or formal gatherings.
                </p>
                <div className="pt-2">
                  <Link
                    to="/outfit-match"
                    className="inline-flex items-center gap-2 font-semibold text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors group"
                  >
                    <span>Match Your Outfit Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!settings.hideCategories && (
          <section className="space-y-0 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-0.5">Explore Silhouettes</span>
                <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Shop By Category</h2>
              </div>
              <Link to="/products" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 whitespace-nowrap">
                View All Categories <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 md:grid-cols-5 sm:overflow-x-visible sm:pb-0 sm:gap-4 pt-3">
              {dynamicCategories.map(cat => (
                <Link key={cat.id || cat.name} to={`/products?category=${encodeURIComponent(cat.name)}`} className="group bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between flex-shrink-0 w-[68vw] sm:w-auto snap-start">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-50 mb-3">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">{cat.count}</span>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">{cat.name} Series</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{cat.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Trending Section: Only Trending Products (Unified Signature Blue) ── */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1.5">
                <Flame className="w-3.5 h-3.5 fill-blue-600 text-blue-600 animate-pulse" />
                <span>Trending Right Now</span>
              </div>
              <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                Most In-Demand Chappals
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Silhouettes with highest visitor interest, customer engagement, and fast-moving sales.
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              Explore All <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-slate-100 h-72 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : trendingProducts.length === 0 ? (
            <div className="py-10 px-6 rounded-2xl bg-blue-50/40 border border-blue-200/60 text-center space-y-2">
              <Flame className="w-7 h-7 text-blue-600 mx-auto" />
              <h4 className="font-serif font-bold text-slate-800 text-base">New Trending Chappals Arriving</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                As shoppers browse our artisan collections, top-visited and highest-rated designs will be featured here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {trendingProducts.map(p => (
                <div key={p.id} className="relative group">
                  <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] sm:text-[10px] font-bold shadow-xs">
                      <Flame className="w-2.5 h-2.5 fill-white text-white" />
                      Trending
                    </span>
                  </div>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-0.5">Curated Selection</span>
              <h2 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Featured Iconic Models</h2>
            </div>
            <Link to="/products" className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 whitespace-nowrap">
              View All Products <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-100 h-72 rounded-2xl animate-pulse" />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">Workshop In Production</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">Fresh Artisan Collection Arriving Soon</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
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

        <section className="space-y-8 pt-4 border-t border-slate-200">
          <div className="max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">Bazaar-e-Kissa Khwani Heritage</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">Four Steps of Master Craftsmanship</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Every single pair undergoes over 12 hours of meticulous handwork by third-generation Peshawar artisans.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="font-serif text-3xl font-bold text-blue-600/40">01</span>
              <h3 className="font-serif font-bold text-base text-slate-900">Organic Leather Tanning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Raw cowhide cured with natural bark extracts for deep grain resilience and supple flexibility.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="font-serif text-3xl font-bold text-blue-600/40">02</span>
              <h3 className="font-serif font-bold text-base text-slate-900">Precision Stenciling</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Hand-guided shears cut iconic Kaptaan T-straps according to centuries-old Pashtun patterns.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="font-serif text-3xl font-bold text-blue-600/40">03</span>
              <h3 className="font-serif font-bold text-base text-slate-900">Ergonomic Moulding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">High-density recycled tire rubber outsoles crafted for multi-surface grip and enduring longevity.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="font-serif text-3xl font-bold text-blue-600/40">04</span>
              <h3 className="font-serif font-bold text-base text-slate-900">Brass Filigree Detail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Hand-engraved solid aged brass buckles and subtle metallic eyelets attached as signature crests.</p>
            </div>
          </div>
        </section>

        {/* Customer Care & Knowledge Base Teaser (Internal Link to /faqs) */}
        <section className="pt-8 pb-4 border-t border-slate-200">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-white border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Support & Size Guide</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                Have questions about authentic leather, sizing, or doorstep delivery?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Learn about traditional Khyber leathercraft, tire rubber soles, easy size exchanges, and nationwide Cash on Delivery.
              </p>
            </div>
            <Link
              to="/faqs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-blue-600/20 transition-all shrink-0 hover:scale-105"
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
