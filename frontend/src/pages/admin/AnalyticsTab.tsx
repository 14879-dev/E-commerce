import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Sparkles, TrendingUp, Heart, Eye, Repeat, MapPin, Box,
  ShoppingBag, Flame, Users, Filter
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../../services/api';
import type { Product, Order } from '../../types';
import type { AdminCustomer } from '../../types/admin';

// Pakistani Major Courier Destination Hubs
const DEFAULT_PAKISTAN_CITIES = [
  'Peshawar',
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Quetta',
  'Faisalabad',
  'Multan',
  'Sialkot',
  'Gujranwala',
];

const PALETTE_COLORS = ['#565449', '#A0988A', '#F7F4EB', '#565449', '#A0988A', '#F7F4EB'];

export const AnalyticsTab: React.FC = () => {
  const [period, setPeriod] = useState<'30days' | '90days' | '1year'>('30days');
  const [products, setProducts] = useState<Product[]>(() => {
    try { const c = localStorage.getItem('psh_products'); return c ? JSON.parse(c) : []; } catch { return []; }
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try { const c = localStorage.getItem('psh_orders'); return c ? JSON.parse(c) : []; } catch { return []; }
  });
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [searchTerms, setSearchTerms] = useState<{ term: string; searches: number }[]>([]);
  const [visitsMap, setVisitsMap] = useState<Record<string, number>>({});
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [aiMetrics, setAiMetrics] = useState<{
    sizeScans: number;
    sizeSuccess: number;
    outfitScans: number;
    outfitAdds: number;
    expressCouriers: number;
  }>({ sizeScans: 0, sizeSuccess: 0, outfitScans: 0, outfitAdds: 0, expressCouriers: 0 });
  const [websiteVisitors, setWebsiteVisitors] = useState(0);
  const [productFilter, setProductFilter] = useState<'high-performing' | 'all'>('high-performing');
  const [loading, setLoading] = useState(() => {
    try { return !localStorage.getItem('psh_products'); } catch { return true; }
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [prods, ords, custs] = await Promise.all([
        apiService.getProducts(true),
        apiService.getOrders(),
        apiService.getAdminCustomers(),
      ]);
      setProducts(prods);
      setOrders(ords);
      setCustomers(custs);
      setSearchTerms(apiService.getSearchQueries());
      setVisitsMap(apiService.getAllProductVisits());
      setWebsiteVisitors(apiService.getWebsiteVisitors());
      setAiMetrics(apiService.getAiEventMetrics());

      try {
        const savedWishlist = localStorage.getItem('psh_wishlist');
        setWishlistIds(savedWishlist ? JSON.parse(savedWishlist) : []);
      } catch {
        setWishlistIds([]);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by selected timeframe
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const daysLimit = period === '30days' ? 30 : period === '90days' ? 90 : 365;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;

    return orders.filter(o => {
      const orderTime = new Date(o.date).getTime();
      return isNaN(orderTime) || orderTime >= cutoff;
    });
  }, [orders, period]);

  const deliveredOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'Delivered');
  }, [filteredOrders]);

  // Key KPI calculations (Realized on Delivered Orders)
  const totalSalesVolume = useMemo(() => {
    return deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [deliveredOrders]);

  const customerRetentionRate = useMemo(() => {
    if (customers.length === 0) return '0.0%';
    const repeatBuyers = customers.filter(c => (c.totalOrders || 0) > 1).length;
    return `${((repeatBuyers / customers.length) * 100).toFixed(1)}%`;
  }, [customers]);

  const sizeFinderRate = useMemo(() => {
    if (aiMetrics.sizeScans === 0) return '0.0%';
    return `${((aiMetrics.sizeSuccess / aiMetrics.sizeScans) * 100).toFixed(1)}%`;
  }, [aiMetrics]);

  // Silhouette / Category Breakdown from delivered orders
  const categorySalesData = useMemo(() => {
    const counts: Record<string, number> = {};

    deliveredOrders.forEach(o => {
      o.items?.forEach(item => {
        const cat = item.product?.category && item.product.category !== 'None'
          ? item.product.category
          : 'General';
        const itemRevenue = (Number(item.product?.price) || 0) * (Number(item.quantity) || 1);
        counts[cat] = (counts[cat] || 0) + itemRevenue;
      });
    });

    const entries = Object.entries(counts).map(([name, sales], idx) => ({
      name,
      sales,
      color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
    }));

    // If no sales yet, show listed product categories with 0 sales
    if (entries.length === 0) {
      const distinctCats = Array.from(new Set(products.map(p => p.category && p.category !== 'None' ? p.category : 'General')));
      return (distinctCats.length > 0 ? distinctCats : ['Kaptaan', 'Zalmi', 'Norzi']).map((name, idx) => ({
        name,
        sales: 0,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
      }));
    }

    return entries;
  }, [deliveredOrders, products]);

  // Pakistani Cities Geographical Demographics
  const regionalSalesData = useMemo(() => {
    const cityMap: Record<string, number> = {};
    DEFAULT_PAKISTAN_CITIES.forEach(c => {
      cityMap[c] = 0;
    });

    deliveredOrders.forEach(o => {
      const orderCity = (o.shippingAddress?.city || '').trim();
      const matchedCity = DEFAULT_PAKISTAN_CITIES.find(
        c => c.toLowerCase() === orderCity.toLowerCase()
      );
      const target = matchedCity || (orderCity || 'Peshawar');
      cityMap[target] = (cityMap[target] || 0) + (Number(o.total) || 0);
    });

    return Object.entries(cityMap)
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);
  }, [deliveredOrders]);

  // Product Intelligence (Top Trending, Most Liked, Buying Again & Again, Visits)
  const productIntelligence = useMemo(() => {
    const deliveredAll = orders.filter(o => o.status === 'Delivered');
    return products.map(product => {
      let unitsSold = 0;
      let revenue = 0;
      let repeatOrdersCount = 0;
      const buyersSet = new Set<string>();

      deliveredAll.forEach(o => {
        const item = o.items?.find(i => i.product?.id === product.id || (i.product as any)?.slug === product.slug);
        if (item) {
          const qty = Number(item.quantity) || 1;
          unitsSold += qty;
          revenue += (Number(product.price) || 0) * qty;

          const buyerId = o.shippingAddress?.email?.toLowerCase() || o.shippingAddress?.phone || o.shippingAddress?.fullName;
          if (buyerId) {
            if (buyersSet.has(buyerId)) {
              repeatOrdersCount += 1;
            } else {
              buyersSet.add(buyerId);
            }
          }
        }
      });

      const visits = visitsMap[product.id] || 0;
      const isLiked = wishlistIds.includes(product.id);
      const conversion = visits > 0 ? ((unitsSold / visits) * 100).toFixed(1) : '0.0';

      return {
        ...product,
        unitsSold,
        revenue,
        repeatOrdersCount,
        visits,
        isLiked,
        conversion,
      };
    }).sort((a, b) => b.unitsSold - a.unitsSold || b.visits - a.visits);
  }, [products, orders, visitsMap, wishlistIds]);

  // Only products that have high visitors or high buying rate / reorders
  const highPerformingProducts = useMemo(() => {
    return productIntelligence.filter(p => p.unitsSold > 0 || p.repeatOrdersCount > 0 || p.visits >= 1);
  }, [productIntelligence]);

  const displayedProducts = useMemo(() => {
    if (productFilter === 'high-performing') {
      return highPerformingProducts;
    }
    return productIntelligence;
  }, [productFilter, highPerformingProducts, productIntelligence]);

  const expressPreferencePercent = useMemo(() => {
    if (orders.length === 0) return '0.0%';
    const expressCount = orders.filter(o => o.shippingMethod === 'express' || o.shippingMethod === 'artisan-courier').length;
    return `${((expressCount / orders.length) * 100).toFixed(1)}%`;
  }, [orders]);

  const outfitMatcherAddPercent = useMemo(() => {
    if (aiMetrics.outfitScans === 0) return '0.0%';
    return `${((aiMetrics.outfitAdds / aiMetrics.outfitScans) * 100).toFixed(1)}%`;
  }, [aiMetrics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading storefront intelligence &amp; analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Marketing &amp; Storefront Intelligence</h2>
          <p className="text-xs text-slate-500">
            Real-time sales performance, Pakistani city courier demographics, search queries, and AI customer engagement.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['30days', '90days', '1year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer ${
                period === p
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Summary Cards (Real-time Storefront & Engagement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Sales Volume */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Sales Volume ({period})</span>
          <div className="font-serif font-bold text-2xl text-slate-900">
            Rs. {totalSalesVolume.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            {filteredOrders.length} order(s) placed
          </span>
        </div>

        {/* Website Visitors */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Website Visitors</span>
          <div className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-1.5">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{websiteVisitors.toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">
            Storefront visitor sessions
          </span>
        </div>

        {/* Size Finder Match Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Size Finder Match Rate</span>
          <div className="font-serif font-bold text-2xl text-blue-600">
            {sizeFinderRate}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">
            {aiMetrics.sizeScans} camera scan(s) recorded
          </span>
        </div>

        {/* AI Stylist Engagement */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">AI Stylist Engagement</span>
          <div className="font-serif font-bold text-2xl text-slate-900">
            {aiMetrics.outfitScans} Scans
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {aiMetrics.outfitAdds} direct cart match(es)
          </span>
        </div>

        {/* Customer Retention Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Customer Retention Rate</span>
          <div className="font-serif font-bold text-2xl text-purple-600">
            {customerRetentionRate}
          </div>
          <span className="text-[11px] text-purple-600 font-semibold">
            {customers.filter(c => (c.totalOrders || 0) > 1).length} repeat buyer(s)
          </span>
        </div>
      </div>

      {/* ── Visual Charts: Real Sales & Pakistani Cities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales by Silhouette / Collection */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Revenue Breakdown by Silhouette</h3>
            <p className="text-xs text-slate-500">Sales volume per active chappal collection</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {totalSalesVolume === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Box className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">No collection sales recorded yet for this period.</p>
                <p className="text-[11px] text-slate-400">Revenue distribution will automatically compute as orders are placed.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="sales"
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `Rs. ${Number(val).toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#565449', borderRadius: '12px', color: '#F7F4EB', borderColor: '#A0988A' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Geographic Sales Demographics - Pakistan Geographical Cities Wise */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A1A18] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1A1A18]" /> Geographic Courier Demographics
              </h3>
              <p className="text-xs text-[#1A1A18]/70">Pakistani city destinations (Peshawar, Lahore, Karachi, Islamabad, etc.)</p>
            </div>
            <span className="text-[11px] font-bold text-[#1A1A18] bg-[#565449]/15 px-2.5 py-0.5 rounded-full border border-[#565449]/30">
              Domestic Delivery Hubs
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalSalesData}>
                <XAxis dataKey="region" stroke="#1A1A18" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#1A1A18"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={val => `Rs. ${val}`}
                />
                <Tooltip
                  formatter={(val: any) => `Rs. ${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#565449', borderRadius: '12px', color: '#F7F4EB', borderColor: '#A0988A' }}
                />
                <Bar dataKey="revenue" fill="#565449" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Product Intelligence: Top Trending, Most Liked, Repeat Buys, Visits ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> High-Engagement &amp; Storefront Intelligence
            </h3>
            <p className="text-xs text-slate-500">
              Only chappals with customer visits, repeat orders, or high buying rate are highlighted.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setProductFilter('high-performing')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                productFilter === 'high-performing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>High Traffic &amp; Buying Rate ({highPerformingProducts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setProductFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                productFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Listed ({products.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3 px-3">Chappal &amp; Article Tag</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Units Sold
                  </span>
                </th>
                <th className="py-3 px-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Most Liked
                  </span>
                </th>
                <th className="py-3 px-3">
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3.5 h-3.5 text-purple-500" /> Buying Again
                  </span>
                </th>
                <th className="py-3 px-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-500" /> Visits
                  </span>
                </th>
                <th className="py-3 px-3">Conv. Rate</th>
                <th className="py-3 px-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <TrendingUp className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">
                      {productFilter === 'high-performing'
                        ? 'No high-visitor or high-buying-rate chappals recorded yet.'
                        : 'No products listed yet.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {productFilter === 'high-performing'
                        ? 'Chappals with customer views, reorders, or units sold will automatically appear here once visitors browse or purchase.'
                        : 'Go to the Products tab to list chappals.'}
                    </p>
                    {productFilter === 'high-performing' && products.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setProductFilter('all')}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        View all {products.length} listed chappal(s)
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedProducts.map(item => {
                  const frontImg = item.images?.front || Object.values(item.images || {}).find(Boolean);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Thumbnail, Tag & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {frontImg ? (
                              <img
                                src={frontImg}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Box className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.articleTag && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 font-mono text-[9px] font-bold tracking-wider">
                                  {item.articleTag}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{item.subtitle}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                          {item.category && item.category !== 'None' ? item.category : 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        Rs. {item.price.toLocaleString()}
                      </td>

                      {/* Units Sold */}
                      <td className="py-3 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.unitsSold}</span>
                          {item.unitsSold > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200">
                              Trending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Most Liked (Wishlist) */}
                      <td className="py-3 px-3">
                        {item.isLiked ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                            <Heart className="w-3 h-3 fill-current" /> Liked
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 likes</span>
                        )}
                      </td>

                      {/* Buying Again & Again */}
                      <td className="py-3 px-3">
                        {item.repeatOrdersCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                            <Repeat className="w-3 h-3" /> {item.repeatOrdersCount} reorders
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 reorders</span>
                        )}
                      </td>

                      {/* Total Visits */}
                      <td className="py-3 px-3 font-mono text-slate-800">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>{item.visits}</span>
                        </div>
                      </td>

                      {/* Conversion Rate */}
                      <td className="py-3 px-3 font-semibold text-blue-600">
                        {item.conversion}%
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-3 text-right font-serif font-bold text-slate-900">
                        Rs. {item.revenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Search Intent & AI Funnel Insights ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real-Time Catalog Search Queries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" /> Real Customer Search Queries
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Logged in Real Time</span>
          </div>

          <div className="space-y-2 text-xs">
            {searchTerms.length === 0 ? (
              <div className="text-center py-6 text-slate-400 space-y-1">
                <Search className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                <p className="font-medium text-slate-500">No search queries logged yet.</p>
                <p className="text-[11px]">Customer search terms will appear here automatically as visitors browse.</p>
              </div>
            ) : (
              searchTerms.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-900">"{item.term}"</span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 text-[11px]">
                    {item.searches} search(es)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI & Computer Vision Feature Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> AI &amp; Computer Vision Funnel Metrics
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Live Funnel</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Camera Scan */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Camera Foot Size Scan Completions</span>
                <span className="text-blue-600">{sizeFinderRate}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: aiMetrics.sizeScans > 0 ? sizeFinderRate : '0%' }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {aiMetrics.sizeSuccess} of {aiMetrics.sizeScans} scans completed
              </span>
            </div>

            {/* AI Outfit Matcher */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>AI Outfit Matcher Direct Add to Bag</span>
                <span className="text-emerald-600">{outfitMatcherAddPercent}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: aiMetrics.outfitScans > 0 ? outfitMatcherAddPercent : '0%' }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {aiMetrics.outfitAdds} add(s) from {aiMetrics.outfitScans} outfit matches
              </span>
            </div>

            {/* Courier Selection */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Artisan Courier Express Selection</span>
                <span className="text-blue-600">{expressPreferencePercent}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: orders.length > 0 ? expressPreferencePercent : '0%' }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                Calculated from actual order deliveries
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
