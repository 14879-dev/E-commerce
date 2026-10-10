import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Sparkles, Clock, Coins, Star, Box, Package, TrendingUp, ArrowRight, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../../services/api';
import type { Product, Order, Review } from '../../types';
import type { InvestmentItem } from '../../types/admin';

export const DashboardTab: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('psh_products');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('psh_orders');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [reviews, setReviews] = useState<(Review & { productName?: string })[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>(() => {
    try {
      const cached = localStorage.getItem('psh_investments');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [supplierBudget, setSupplierBudget] = useState<number>(1500);
  const [loading, setLoading] = useState(() => {
    try {
      const p = localStorage.getItem('psh_products');
      const o = localStorage.getItem('psh_orders');
      return !(p && o && JSON.parse(p).length > 0);
    } catch { return true; }
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const handleProductsChanged = () => loadData();
    const handleOrdersChanged = () => loadData();
    const handleInvestmentsChanged = () => loadData();
    const handleBudgetChanged = (e: any) => {
      if (e.detail?.budget !== undefined) {
        setSupplierBudget(e.detail.budget);
      } else {
        loadData();
      }
    };
    // Silent auto-refresh from AdminDashboard's 9s polling broadcast
    const handleAutoRefresh = () => silentRefresh();
    window.addEventListener('psh:products-changed', handleProductsChanged);
    window.addEventListener('psh:orders-changed', handleOrdersChanged);
    window.addEventListener('psh:investments-changed', handleInvestmentsChanged);
    window.addEventListener('psh:supplier-budget-changed', handleBudgetChanged);
    window.addEventListener('psh:auto-refresh', handleAutoRefresh);
    return () => {
      window.removeEventListener('psh:products-changed', handleProductsChanged);
      window.removeEventListener('psh:orders-changed', handleOrdersChanged);
      window.removeEventListener('psh:investments-changed', handleInvestmentsChanged);
      window.removeEventListener('psh:supplier-budget-changed', handleBudgetChanged);
      window.removeEventListener('psh:auto-refresh', handleAutoRefresh);
    };
  }, []);

  const loadData = async () => {
    if (products.length === 0 && orders.length === 0) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const [p, o, r, inv, budgetData] = await Promise.all([
        apiService.getProducts(true),
        apiService.getOrders(),
        apiService.getAllReviews(),
        apiService.getInvestments(),
        apiService.getSupplierBudget()
      ]);
      setProducts(p);
      setOrders(o);
      setReviews(r);
      setInvestments(inv);
      if (typeof budgetData?.budget === 'number') {
        setSupplierBudget(budgetData.budget);
      }
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Silent refresh — no loading spinner, just update data in-place
  const silentRefresh = async () => {
    try {
      setIsRefreshing(true);
      const [p, o, r, inv, budgetData] = await Promise.all([
        apiService.getProducts(true),
        apiService.getOrders(),
        apiService.getAllReviews(),
        apiService.getInvestments(),
        apiService.getSupplierBudget()
      ]);
      setProducts(p);
      setOrders(o);
      setReviews(r);
      setInvestments(inv);
      if (typeof budgetData.budget === 'number') {
        setSupplierBudget(budgetData.budget);
      }
      setLastRefresh(new Date());
    } catch {}
    finally { setIsRefreshing(false); }
  };

  // Low stock products: stock <= 5
  const lowStockProducts = products.filter(p => {
    const stock = typeof p.stockCount === 'number' ? p.stockCount : 0;
    return stock > 0 && stock <= 5;
  });

  const pendingReviews = reviews.filter(r => r.status === 'approved' || r.status === 'pending');

  // Business Financial & Operational Calculations
  // 1. Supplier Buy Cost Map for each product
  const productCostMap = new Map<string, number>();
  products.forEach(p => {
    const cost = Number(p.costPrice) || 0;
    if (p.id) productCostMap.set(p.id, cost);
    if (p.slug) productCostMap.set(p.slug, cost);
    if (p.name) productCostMap.set(p.name.toLowerCase().trim(), cost);
    if (p.articleTag) productCostMap.set(p.articleTag.toLowerCase().trim(), cost);
  });

  // 2. Total Pure Product Revenue (Gross sales strictly without COD / delivery / shipping fees)
  const totalPureRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => {
      if (Array.isArray(o.items) && o.items.length > 0) {
        const itemsRevenue = o.items.reduce((iSum, it) => {
          const price = Number(it.product?.price) || 0;
          const qty = Number(it.quantity) || 1;
          return iSum + (price * qty);
        }, 0);
        return sum + itemsRevenue;
      }
      const shippingFee = Number(o.shippingFee) || 0;
      const orderTotal = Number(o.total) || 0;
      return sum + Math.max(0, orderTotal - shippingFee);
    }, 0);

  // 3. Cost of Sold Items (Supplier buying cost for sold units)
  const totalCostOfSoldItems = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => {
      const orderCost = (o.items || []).reduce((itemSum, it) => {
        const prodId = it.product?.id || (it as any).productId;
        const prodSlug = it.product?.slug;
        const prodName = it.product?.name ? it.product.name.toLowerCase().trim() : '';
        const prodTag = (it.product as any)?.articleTag ? (it.product as any).articleTag.toLowerCase().trim() : '';
        const unitCost = productCostMap.get(prodId)
          ?? (prodSlug ? productCostMap.get(prodSlug) : undefined)
          ?? (prodName ? productCostMap.get(prodName) : undefined)
          ?? (prodTag ? productCostMap.get(prodTag) : undefined)
          ?? Number(it.product?.costPrice)
          ?? 0;
        const qty = Number(it.quantity) || 1;
        return itemSum + (unitCost * qty);
      }, 0);
      return sum + orderCost;
    }, 0);

  // 4. Exact Net Profit (Selling price − Supplier buying cost per item, strictly excluding COD delivery fees)
  // E.g. Buy for 1500, Sell for 2100 => Net profit = 600
  const totalProfit = totalPureRevenue - totalCostOfSoldItems;
  const profitMargin = totalPureRevenue > 0 ? Math.round((totalProfit / totalPureRevenue) * 100) : 0;

  // 5. Total Investment Calculations:
  // a) Supplier Product Capital: FIXED capital paid to supplier (costPrice * inventory) — strictly untouched by customer orders!
  const inventoryTotalOutlay = products.reduce(
    (sum, p) => sum + (Number(p.costPrice) || 0) * (Number(p.stockCount) || 1),
    0
  );
  const totalPairsInStock = products.reduce(
    (sum, p) => sum + (Number(p.stockCount) || 1),
    0
  );
  const totalSupplierInvestment = inventoryTotalOutlay > 0
    ? inventoryTotalOutlay
    : (supplierBudget || 0);

  // b) Custom Operational Investments (Packaging, Monetization Ads, Logistics Supplies, Gear)
  const packagingInvestment = investments
    .filter(i => i.category === 'packaging')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const monetizationInvestment = investments
    .filter(i => i.category === 'monetization')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalOperationalInvestments = investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // c) Grand Combined Total Investment = Supplier Chappal Capital + Packaging & Monetization & Operational Investments
  const grandTotalInvestment = totalSupplierInvestment + totalOperationalInvestments;

  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(
    o => o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;

  // Order status distribution
  const statusMap = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Order status distribution with distinct high-contrast semantic colors
  const orderStatusData = [
    { name: 'Placed', value: statusMap['Placed'] || 0, color: '#D97706' },      // Warm Amber Gold
    { name: 'Shipped', value: statusMap['Shipped'] || 0, color: '#2563EB' },    // Electric Blue / In Transit
    { name: 'Delivered', value: statusMap['Delivered'] || 0, color: '#059669' },// Emerald Green / Completed
    { name: 'Cancelled', value: statusMap['Cancelled'] || 0, color: '#DC2626' },// Vibrant Crimson / Cancelled
  ];

  const hasOrderStatusData = orders.length > 0;

  // Monthly revenue trajectory (All 12 Calendar Months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueChartData = monthNames.map((m, mIdx) => {
    const monthOrders = orders.filter(o => {
      if (!o.date || o.status === 'Cancelled') return false;
      const str = String(o.date);
      if (str.includes(m)) return true;
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime()) && d.getMonth() === mIdx) return true;
      } catch {}
      return false;
    });
    const rev = monthOrders.reduce((sum, o) => {
      const shipping = Number(o.shippingFee) || 0;
      return sum + Math.max(0, (Number(o.total) || 0) - shipping);
    }, 0);
    return {
      label: m,
      revenue: rev,
      orders: monthOrders.length,
    };
  });

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading executive dashboard...</div>;
  }

  return (
    <div className="space-y-8">

      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#565449]/20 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#1A1A18] flex items-center gap-2.5">
            Performance Executive Overview
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest transition-all duration-300 ${
              isRefreshing
                ? 'bg-[#565449] text-[#F7F4EB] border-[#565449]'
                : 'bg-[#565449]/15 text-[#1A1A18] border-[#565449]/30'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#565449] animate-pulse" />
              Live
            </span>
          </h2>
          <p className="text-xs text-[#1A1A18]/70">
            Live operational metrics, net profit, supplier investment, and order pipeline.
            {lastRefresh && (
              <span className="ml-2 text-[#1A1A18]/50">Updated {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#565449]/10 p-1 rounded-xl border border-[#565449]/30">
          {(['day', 'week', 'month', 'year'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${timeRange === t
                  ? 'bg-[#565449] text-[#F7F4EB] shadow-xs'
                  : 'text-[#1A1A18] hover:bg-[#565449]/10'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid - 5 Executive Financial & Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Pure Product Revenue */}
        <div className="bg-[#F7F4EB] rounded-2xl border-2 border-emerald-600/35 p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Product Sales Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-900">Rs. {totalPureRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            Excludes COD delivery charges
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-[#F7F4EB] rounded-2xl border-2 border-emerald-600/35 p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Net Profit
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-900">Rs. {totalProfit.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
            <span className="font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">{profitMargin}% margin</span> • Selling price − Supplier cost
          </div>
        </div>

        {/* Card 3: Total Investment (Supplier Products + Packaging & Monetization Operations) */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('investments')}
          className="bg-[#F7F4EB] rounded-2xl border-2 border-[#565449]/40 p-5 shadow-sm space-y-2 cursor-pointer hover:border-[#565449] hover:shadow-md transition-all group"
          title="Click to manage Packaging, Monetization, and Supplier Procurement Budget"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/70 flex items-center gap-1.5">
              Total Investment
            </span>
            <div className="p-2 rounded-xl bg-[#565449]/15 text-[#1A1A18] border border-[#565449]/30 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-[#1A1A18]">
            Rs. {grandTotalInvestment.toLocaleString()}
          </div>
          <div className="flex flex-col gap-0.5 text-[11px] text-[#1A1A18]/70 font-medium">
            <span className="truncate" title={`Rs. ${totalSupplierInvestment.toLocaleString()} fixed supplier procurement (${totalPairsInStock} pairs) + Rs. ${totalOperationalInvestments.toLocaleString()} packaging, monetization & ops`}>
              Rs. {totalSupplierInvestment.toLocaleString()} supplier ({totalPairsInStock} pairs) + Rs. {totalOperationalInvestments.toLocaleString()} ops
            </span>
            {onNavigateTab && (
              <span className="text-[#1A1A18] font-bold flex items-center gap-1 group-hover:underline text-[10px] pt-0.5">
                Adjust Supplier & Packaging Funds <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Total Orders */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-5 shadow-sm space-y-2 cursor-pointer hover:border-[#565449] hover:shadow-md transition-all group"
          title="Click to view all customer orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]/70">Total Orders</span>
            <div className="p-2 rounded-xl bg-[#565449]/15 text-[#1A1A18] border border-[#565449]/30 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-[#1A1A18]">{totalOrdersCount}</div>
          <div className="flex flex-col gap-0.5 text-[11px] text-[#1A1A18]/70 font-medium">
            <span>
              {totalOrdersCount > 0 ? 'Total orders received to date' : 'No orders recorded yet'}
            </span>
            {onNavigateTab && (
              <span className="text-[#1A1A18] font-bold flex items-center gap-1 group-hover:underline text-[10px] pt-0.5">
                View All Orders <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {/* Card 5: Pending Orders (Orders in Queue) */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="bg-[#F7F4EB] rounded-2xl border-2 border-orange-500/40 p-5 shadow-sm space-y-2 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all group relative overflow-hidden"
          title="Click to view active orders in queue"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block animate-pulse" />
              Orders In Queue
            </span>
            <div className="p-2 rounded-xl bg-orange-100 text-orange-800 border border-orange-300 shadow-xs group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-orange-950">{pendingOrdersCount} In Queue</div>
          <div className="flex flex-col gap-0.5 text-[11px] text-orange-800 font-medium">
            <span>
              {pendingOrdersCount > 0 ? 'Awaiting courier dispatch or delivery' : 'All orders fulfilled / No pending tasks'}
            </span>
            {onNavigateTab && (
              <span className="text-orange-950 font-bold flex items-center gap-1 group-hover:underline text-[10px] pt-0.5">
                Manage Order Queue <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Executive Capital Allocation & Investment Ledger Summary */}
      <div className="bg-[#F7F4EB] rounded-2xl border-2 border-[#565449]/40 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-slate-900">Capital Allocation & Total Investment Breakdown</h3>
              <p className="text-xs text-slate-500">Combined balance of supplier product procurement, luxury packaging, monetization ads, and operational funds.</p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('investments')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold text-xs shadow-xs transition-all self-start sm:self-auto"
            >
              <span>Manage Investments & Packaging</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Supplier Footwear */}
          <div className="p-4 rounded-xl bg-slate-50/80 border-2 border-slate-300 hover:border-slate-400 transition-all space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">1. Supplier Footwear</div>
            <div className="text-lg font-bold font-serif text-slate-900">Rs. {totalSupplierInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500">
              {totalPairsInStock} pairs stock • Fixed capital (untouched by orders)
            </div>
          </div>

          {/* Packaging & Unboxing */}
          <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-300 hover:border-amber-400 transition-all space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">2. Packaging & Unboxing</div>
            <div className="text-lg font-bold font-serif text-amber-900">Rs. {packagingInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-amber-700">
              Boxes, velvet pouches, embossed tags
            </div>
          </div>

          {/* Monetization & Ads */}
          <div className="p-4 rounded-xl bg-purple-50/70 border-2 border-purple-300 hover:border-purple-400 transition-all space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">3. Monetization & Ads</div>
            <div className="text-lg font-bold font-serif text-purple-900">Rs. {monetizationInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-purple-700">
              Meta, TikTok, Influencer campaigns
            </div>
          </div>

          {/* Grand Combined Capital */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border-2 border-emerald-400 hover:border-emerald-500 transition-all space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">4. Total Capital In Play</div>
            <div className="text-lg font-bold font-serif text-emerald-900">Rs. {grandTotalInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700">
              100% combined business investment
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-8 bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Revenue & Sales Trajectory</h3>
              <p className="text-xs text-[#1A1A18]/70">Monthly revenue accumulation (PKR)</p>
            </div>
            <span className="text-xs font-bold text-[#1A1A18] bg-[#565449]/15 px-3 py-1 rounded-full border border-[#565449]/30">
              Filtered: {timeRange.toUpperCase()}
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#565449" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A0988A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#1A1A18" fontSize={12} tickLine={false} />
                <YAxis stroke="#1A1A18" fontSize={12} tickLine={false} tickFormatter={val => `Rs. ${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#565449', borderColor: '#A0988A', borderRadius: '12px', color: '#F7F4EB' }}
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#565449" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown Chart */}
        <div className="lg:col-span-4 bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Order Status Distribution</h3>
            <p className="text-xs text-[#1A1A18]/70">Active fulfillment pipeline overview</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            {hasOrderStatusData && orderStatusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.filter(d => d.value > 0).map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#565449', borderRadius: '12px', color: '#F7F4EB', borderColor: '#A0988A' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-4">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No order data yet</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {orderStatusData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}: <strong className="text-slate-900">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Low-Stock Alerts & Studio Processing & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Low Stock Widget */}
        <div className="lg:col-span-4 bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#565449]/20">
            <h3 className="font-serif font-bold text-base text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Low Stock & Restock Alert
            </h3>
            <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
              {lowStockProducts.length} Below Limit
            </span>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Box className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <span>All inventory stock levels are healthy.</span>
              </div>
            ) : (
              lowStockProducts.slice(0, 3).map(product => {
                const stock = typeof product.stockCount === 'number' ? product.stockCount : 0;
                return (
                  <div key={product.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <img src={product.images?.front || ''} alt={product.name} className="w-10 h-10 object-cover rounded-lg bg-slate-100" />
                      <div>
                        <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">{product.name}</h4>
                        <span className="text-[10px] text-slate-500">Category: {product.category || 'General'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-red-600 block">{stock} Left</span>
                      <span className="text-[10px] text-slate-400">Reorder threshold 5</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI & Vision Model Usage */}
        <div className="lg:col-span-4 bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#565449]/20">
            <h3 className="font-serif font-bold text-base text-[#1A1A18] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1A1A18]" /> AI &amp; Vision Studio Models
            </h3>
            <span className="text-[11px] font-bold text-[#1A1A18] bg-[#565449]/15 px-2.5 py-0.5 rounded-full border border-[#565449]/30">
              Model Usage
            </span>
          </div>

          <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
            Live AI model pipelines: Computer Vision Foot Sizing (OpenCV Camera) and AI Outfit Matching engines active.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#565449]/10 border border-[#565449]/20 text-xs">
              <div>
                <span className="font-bold text-[#1A1A18] block">OpenCV Foot Landmark Sizer</span>
                <span className="text-[10px] text-[#1A1A18]/70">Camera dimension scan pipeline</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#565449] text-[#F7F4EB] text-[10px] font-bold uppercase">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#565449]/10 border border-[#565449]/20 text-xs">
              <div>
                <span className="font-bold text-[#1A1A18] block">AI Outfit Matcher Neural Core</span>
                <span className="text-[10px] text-[#1A1A18]/70">Color-harmony style vectorizer</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#565449] text-[#F7F4EB] text-[10px] font-bold uppercase">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#565449]/10 border border-[#565449]/20 text-xs">
              <div>
                <span className="font-bold text-[#1A1A18] block">Catalog Studio Processing</span>
                <span className="text-[10px] text-[#1A1A18]/70">Product image asset pipelines</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#565449] text-[#F7F4EB] text-[10px] font-bold uppercase">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Recent Moderation Feed */}
        <div className="lg:col-span-4 bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#565449]/20">
            <h3 className="font-serif font-bold text-base text-[#1A1A18] flex items-center gap-2">
              <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" /> Moderation Feed
            </h3>
            {onNavigateTab && (
              <button onClick={() => onNavigateTab('reviews')} className="text-xs text-[#1A1A18] font-bold hover:underline">
                View All
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <span>No customer reviews recorded yet.</span>
              </div>
            ) : (
              pendingReviews.slice(0, 3).map(rev => (
                <div key={rev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{rev.userName}</span>
                    <div className="flex text-[#D4AF37]">
                      {'★'.repeat(rev.rating)}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Orders Summary Quick Table */}
      <div className="bg-[#F7F4EB] rounded-2xl border border-[#565449]/35 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-[#1A1A18] flex items-center gap-2">
            Recent Customer Orders
            {isRefreshing && (
              <span className="w-2 h-2 rounded-full bg-[#565449] animate-ping" />
            )}
          </h3>
          {onNavigateTab && (
            <button onClick={() => onNavigateTab('orders')} className="btn-copper text-xs py-1.5 px-4">
              Manage All Orders
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3">Order Number</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No customer orders placed yet. Live orders will populate here as customers complete checkout.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map(order => (
                  <tr
                    key={order.id}
                    onClick={() => onNavigateTab && onNavigateTab('orders')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    title="Click to view order details"
                  >
                    <td className="py-3 font-serif font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 text-slate-800">{order.shippingAddress?.fullName || 'Customer'}</td>
                    <td className="py-3 text-slate-500">{order.date}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : order.status === 'Shipped' ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-serif font-bold text-slate-900">Rs. {order.total?.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
