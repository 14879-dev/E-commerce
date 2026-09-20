import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Sparkles, Clock, Coins, RefreshCw, Star, Box, Package, TrendingUp, ArrowRight, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../../services/api';
import type { Product, Order, Review } from '../../types';
import type { InvestmentItem } from '../../types/admin';

export const DashboardTab: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<(Review & { productName?: string })[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [supplierBudget, setSupplierBudget] = useState<number>(1500);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
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
    setLoading(false);
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

  const orderStatusData = [
    { name: 'Placed', value: statusMap['Placed'] || 0, color: '#2563eb' },
    { name: 'Shipped', value: statusMap['Shipped'] || 0, color: '#d97706' },
    { name: 'Delivered', value: statusMap['Delivered'] || 0, color: '#16a34a' },
    { name: 'Cancelled', value: statusMap['Cancelled'] || 0, color: '#dc2626' },
  ];

  const hasOrderStatusData = orders.length > 0;

  // Monthly revenue trajectory (pure product sales without shipping fees)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenueChartData = monthNames.map(m => {
    const monthOrders = orders.filter(o => o.date && o.date.includes(m) && o.status !== 'Cancelled');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900 flex items-center gap-2.5">
            Performance Executive Overview
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest transition-all duration-300 ${
              isRefreshing
                ? 'bg-emerald-100 text-emerald-700 border-emerald-400'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Live operational metrics, net profit, supplier investment, and order pipeline.
            {lastRefresh && (
              <span className="ml-2 text-slate-400">Updated {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['day', 'week', 'month', 'year'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${timeRange === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product Sales Revenue</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">Rs. {totalPureRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            Excludes COD delivery charges
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Net Profit</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-700">Rs. {totalProfit.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
            <span className="font-bold">{profitMargin}% margin</span> • Selling price − Supplier cost
          </div>
        </div>

        {/* Card 3: Total Investment (Supplier Products + Packaging & Monetization Operations) */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('investments')}
          className="bg-white rounded-2xl border border-amber-200/90 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm space-y-2 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to manage Packaging, Monetization, and Supplier Procurement Budget"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              Total Investment
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">
            Rs. {grandTotalInvestment.toLocaleString()}
          </div>
          <div className="flex flex-col gap-0.5 text-[11px] text-slate-600 font-medium">
            <span className="truncate" title={`Rs. ${totalSupplierInvestment.toLocaleString()} fixed supplier procurement (${totalPairsInStock} pairs) + Rs. ${totalOperationalInvestments.toLocaleString()} packaging, monetization & ops`}>
              Rs. {totalSupplierInvestment.toLocaleString()} supplier ({totalPairsInStock} pairs) + Rs. {totalOperationalInvestments.toLocaleString()} ops
            </span>
            {onNavigateTab && (
              <span className="text-amber-700 font-semibold flex items-center gap-1 group-hover:underline text-[10px] pt-0.5">
                Adjust Supplier & Packaging Funds <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Total Orders */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
          title="Click to view all customer orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">{totalOrdersCount}</div>
          <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 font-medium">
            <span>
              {totalOrdersCount > 0 ? 'Total orders received to date' : 'No orders recorded yet'}
            </span>
            {onNavigateTab && (
              <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:underline text-[10px] pt-0.5">
                View All Orders <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>

        {/* Card 5: Pending Orders (Orders in Queue) */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="bg-white rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 p-5 shadow-sm space-y-2 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to view active orders in queue"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Orders In Queue</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-amber-700">{pendingOrdersCount} In Queue</div>
          <div className="flex flex-col gap-0.5 text-[11px] text-slate-500 font-medium">
            <span>
              {pendingOrdersCount > 0 ? 'Awaiting courier dispatch or delivery' : 'All orders fulfilled / No pending tasks'}
            </span>
            {onNavigateTab && (
              <span className="text-amber-700 font-semibold flex items-center gap-1 group-hover:underline text-[10px] pt-0.5">
                Manage Order Queue <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Executive Capital Allocation & Investment Ledger Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all self-start sm:self-auto"
            >
              <span>Manage Investments & Packaging</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Supplier Footwear */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Supplier Footwear</div>
            <div className="text-lg font-bold font-serif text-slate-900">Rs. {totalSupplierInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500">
              {totalPairsInStock} pairs stock • Fixed capital (untouched by orders)
            </div>
          </div>

          {/* Packaging & Unboxing */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">2. Packaging & Unboxing</div>
            <div className="text-lg font-bold font-serif text-amber-900">Rs. {packagingInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-amber-700">
              Boxes, velvet pouches, embossed tags
            </div>
          </div>

          {/* Monetization & Ads */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">3. Monetization & Ads</div>
            <div className="text-lg font-bold font-serif text-purple-900">Rs. {monetizationInvestment.toLocaleString()}</div>
            <div className="text-[11px] text-purple-700">
              Meta, TikTok, Influencer campaigns
            </div>
          </div>

          {/* Grand Combined Capital */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
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
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">Revenue & Sales Trajectory</h3>
              <p className="text-xs text-slate-500">Monthly revenue accumulation (PKR)</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Filtered: {timeRange.toUpperCase()}
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={val => `Rs. ${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Order Status Distribution</h3>
            <p className="text-xs text-slate-500">Active fulfillment pipeline overview</p>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            {hasOrderStatusData ? (
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
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }}
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
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock & Restock Alert
            </h3>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {lowStockProducts.length} Items
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
                      <span className="text-xs font-bold text-amber-600 block">{stock} Left</span>
                      <span className="text-[10px] text-slate-400">Reorder threshold 5</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product Studio & Image Processing Status */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Studio Asset Processing
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Remove.bg Ready
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Automated background isolation and unlimited photo gallery optimize product showcases.
          </p>

          <div className="space-y-2">
            {products.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <span>No products listed yet. Click below to add your first product.</span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('products')}
                    className="mt-3 block mx-auto px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 transition-all"
                  >
                    + Add First Product
                  </button>
                )}
              </div>
            ) : (
              products.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                  <span className="font-medium text-slate-900 truncate max-w-[180px]">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase">
                      Active
                    </span>
                    <button className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Studio Refresh">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Moderation Feed */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Moderation Feed
            </h3>
            {onNavigateTab && (
              <button onClick={() => onNavigateTab('reviews')} className="text-xs text-blue-600 font-semibold hover:underline">
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
                    <div className="flex text-amber-400">
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
            Recent Customer Orders
            {isRefreshing && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
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
