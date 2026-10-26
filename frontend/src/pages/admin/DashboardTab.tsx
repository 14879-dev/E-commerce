import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Star, 
  Box, 
  TrendingUp, 
  Plus, 
  Filter, 
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { apiService } from '../../services/api';
import type { Product, Order, Review } from '../../types';
import type { InvestmentItem } from '../../types/admin';

export const DashboardTab: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
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

  // Helper to get reliable timestamp from an order
  const getOrderTimestamp = (o: Order): number => {
    if (o.date) {
      const parsed = new Date(o.date).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const match = String(o.id || o.orderNumber || '').match(/(\d{10,13})/);
    return match ? Number(match[1]) : 0;
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  // Active Timeframe Filtered Orders
  const filteredOrders = orders.filter(o => {
    const t = getOrderTimestamp(o);
    if (t === 0) return true;

    if (timeRange === 'day') {
      return t >= startOfToday;
    }
    if (timeRange === 'week') {
      return t >= startOfWeek;
    }
    if (timeRange === 'month') {
      return t >= startOfMonth;
    }
    if (timeRange === 'year') {
      return t >= startOfYear;
    }
    if (timeRange === 'custom') {
      const start = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : 0;
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`).getTime() : Infinity;
      return t >= start && t <= end;
    }
    return true;
  });

  // 2. Total Pure Product Revenue (Delivered Orders Only in active timeframe)
  const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');

  const totalPureRevenue = deliveredOrders
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

  // 3. Cost of Sold Items (Supplier buying cost for delivered units in active timeframe)
  const totalCostOfSoldItems = deliveredOrders
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

  // 4. Exact Net Profit (Selling price − Supplier buying cost per item)
  const totalProfit = totalPureRevenue - totalCostOfSoldItems;
  const profitMargin = totalPureRevenue > 0 ? Math.round((totalProfit / totalPureRevenue) * 100) : 0;

  // 5. Total Investment Calculations:
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

  const packagingInvestment = investments
    .filter(i => i.category === 'packaging')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const monetizationInvestment = investments
    .filter(i => i.category === 'monetization')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalOperationalInvestments = investments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const grandTotalInvestment = totalSupplierInvestment + totalOperationalInvestments;

  const totalOrdersCount = filteredOrders.length;
  const pendingOrdersCount = filteredOrders.filter(
    o => o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;

  // Order status distribution
  const statusMap = filteredOrders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = [
    { name: 'Placed', value: statusMap['Placed'] || 0, color: '#F59E0B' },
    { name: 'Shipped', value: statusMap['Shipped'] || 0, color: '#3B82F6' },
    { name: 'Delivered', value: statusMap['Delivered'] || 0, color: '#10B981' },
    { name: 'Cancelled', value: statusMap['Cancelled'] || 0, color: '#EF4444' },
  ];

  // Dynamic Trajectory Chart Data tailored to selected timeframe
  const revenueChartData = (() => {
    const getOrderRev = (ord: Order) => {
      const shipping = Number(ord.shippingFee) || 0;
      return Math.max(0, (Number(ord.total) || 0) - shipping);
    };

    if (timeRange === 'day') {
      const slots = [
        { label: '00:00', startH: 0, endH: 4 },
        { label: '04:00', startH: 4, endH: 8 },
        { label: '08:00', startH: 8, endH: 12 },
        { label: '12:00', startH: 12, endH: 16 },
        { label: '16:00', startH: 16, endH: 20 },
        { label: '20:00', startH: 20, endH: 24 },
      ];
      return slots.map(slot => {
        const slotOrders = deliveredOrders.filter(o => {
          const t = getOrderTimestamp(o);
          if (t < startOfToday) return false;
          const h = new Date(t).getHours();
          return h >= slot.startH && h < slot.endH;
        });
        const rev = slotOrders.reduce((sum, o) => sum + getOrderRev(o), 0);
        return { label: slot.label, revenue: rev, orders: slotOrders.length };
      });
    }

    if (timeRange === 'week') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        const dayOrders = deliveredOrders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= dayStart && t <= dayEnd;
        });
        const rev = dayOrders.reduce((sum, o) => sum + getOrderRev(o), 0);
        days.push({ label: dayStr, revenue: rev, orders: dayOrders.length });
      }
      return days;
    }

    if (timeRange === 'month') {
      const buckets = [
        { label: '1-5', startOffset: 30, endOffset: 25 },
        { label: '6-10', startOffset: 25, endOffset: 20 },
        { label: '11-15', startOffset: 20, endOffset: 15 },
        { label: '16-20', startOffset: 15, endOffset: 10 },
        { label: '21-25', startOffset: 10, endOffset: 5 },
        { label: '26-30', startOffset: 5, endOffset: 0 },
      ];
      return buckets.map(b => {
        const bStart = now.getTime() - b.startOffset * 24 * 60 * 60 * 1000;
        const bEnd = now.getTime() - b.endOffset * 24 * 60 * 60 * 1000;
        const bOrders = deliveredOrders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= bStart && t <= bEnd;
        });
        const rev = bOrders.reduce((sum, o) => sum + getOrderRev(o), 0);
        return { label: b.label, revenue: rev, orders: bOrders.length };
      });
    }

    if (timeRange === 'custom') {
      const s = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : (now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const e = customEndDate ? new Date(`${customEndDate}T23:59:59.999`).getTime() : now.getTime();
      const diffDays = Math.max(1, Math.round((e - s) / (24 * 60 * 60 * 1000)));

      const stepDays = diffDays <= 10 ? 1 : Math.ceil(diffDays / 6);
      const points = [];
      for (let cur = s; cur <= e; cur += stepDays * 24 * 60 * 60 * 1000) {
        const pointEnd = Math.min(e, cur + stepDays * 24 * 60 * 60 * 1000 - 1);
        const curDate = new Date(cur);
        const label = curDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        const ptOrders = deliveredOrders.filter(o => {
          const t = getOrderTimestamp(o);
          return t >= cur && t <= pointEnd;
        });
        const rev = ptOrders.reduce((sum, o) => sum + getOrderRev(o), 0);
        points.push({ label, revenue: rev, orders: ptOrders.length });
      }
      return points;
    }

    // Default: 'year' - 12 calendar months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((m, mIdx) => {
      const monthOrders = deliveredOrders.filter(o => {
        const t = getOrderTimestamp(o);
        if (t > 0) {
          const d = new Date(t);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === mIdx;
        }
        if (!o.date) return false;
        return String(o.date).includes(m);
      });
      const rev = monthOrders.reduce((sum, o) => sum + getOrderRev(o), 0);
      return {
        label: m,
        revenue: rev,
        orders: monthOrders.length,
      };
    });
  })();

  // Spending Limit Percentage Calculation
  const spendingLimitPercent = supplierBudget > 0
    ? Math.min(100, Math.round((totalSupplierInvestment / supplierBudget) * 100))
    : 0;

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5C39] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-zinc-500">Loading live executive dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Top Greeting & Timeframe Bar (Reference Frame 01) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            Good morning, Admin
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-all ${
              isRefreshing
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time store performance, net margins, supplier capital, and fulfillment pipeline.
            {lastRefresh && (
              <span className="ml-2 text-zinc-400 dark:text-zinc-500">Updated {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>

        {/* Timeframe Pill Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs">
            {(['day', 'week', 'month', 'year', 'custom'] as const).map(t => {
              const isSelected = timeRange === t;
              return (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer z-10 ${
                    isSelected
                      ? 'text-white dark:text-zinc-900 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="dashboardTimePill"
                      className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-full shadow-xs -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  {t === 'day' ? 'Day' : t === 'week' ? 'Week' : t === 'month' ? 'Month' : t === 'year' ? 'Year' : 'Custom'}
                </button>
              );
            })}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400">From</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none"
              />
              <span className="text-[10px] uppercase font-bold text-zinc-400">To</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Top 3-Column Section (Reference Frame 01 V14 Dashboard) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Block 1: Left Balance / Liquidity Card (lg:col-span-4) ── */}
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="lg:col-span-4 admin-card p-6 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Total Balance
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
                  Rs. {totalPureRevenue.toLocaleString()}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-3.5 h-3.5" />
                +{profitMargin}% Margin
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Delivered product sales turnover strictly excluding cash-on-delivery courier charges.
            </p>

            {/* Quick Action Buttons Matching Reference Video */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => onNavigateTab && onNavigateTab('products')}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-black text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('orders')}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all cursor-pointer border border-zinc-200/70 dark:border-zinc-700"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Orders</span>
              </button>
            </div>
          </div>

          {/* Sub Summary Widgets */}
          <div className="grid grid-cols-2 gap-2.5 pt-5 mt-5 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Supplier Capital
              </span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block mt-0.5">
                Rs. {totalSupplierInvestment.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {totalPairsInStock} pairs inventory
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Order Pipeline
              </span>
              <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block mt-0.5">
                {pendingOrdersCount} In Queue
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {totalOrdersCount} total orders
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Block 2: Middle 2x2 Cards Grid (lg:col-span-4) ── */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
          
          {/* Card 1: Reference Signature Coral Card (Realized Net Profit) */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="admin-card-coral p-5 rounded-2xl flex flex-col justify-between text-white shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                Net Profit
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold tracking-tight">
                Rs. {totalProfit.toLocaleString()}
              </div>
              <div className="text-xs text-white/80 font-medium mt-0.5">
                {profitMargin}% margin on sales
              </div>
            </div>
            <div className="text-[10px] text-white/75 bg-black/15 px-2 py-0.5 rounded-full inline-block self-start font-medium">
              Realized on delivered pairs
            </div>
          </motion.div>

          {/* Card 2: Cost of Sold Items */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="admin-card p-5 rounded-2xl flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Cost of Sold
              </span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <Box className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Rs. {totalCostOfSoldItems.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Supplier buying cost
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full inline-block self-start font-medium">
              Delivered stock units
            </div>
          </motion.div>

          {/* Card 3: Orders in Fulfillment Queue */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onNavigateTab && onNavigateTab('orders')}
            className="admin-card p-5 rounded-2xl flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                In Queue
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {pendingOrdersCount}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Awaiting fulfillment
              </div>
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1 self-start font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Manage Queue →
            </div>
          </motion.div>

          {/* Card 4: Delivered Orders Count */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onNavigateTab && onNavigateTab('orders')}
            className="admin-card p-5 rounded-2xl flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Delivered
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {deliveredOrders.length}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Successfully delivered
              </div>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full inline-block self-start font-medium">
              100% completed
            </div>
          </motion.div>

        </div>

        {/* ── Block 3: Total Income & Trajectory Chart (lg:col-span-4) ── */}
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="lg:col-span-4 admin-card p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Total Income
                </span>
                <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
                  Rs. {totalPureRevenue.toLocaleString()}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {timeRange.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Sales trajectory over active window</p>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="coralAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5C39" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF5C39" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="label" 
                  stroke="#A1A1AA" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#A1A1AA" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={v => `${Math.round(v / 1000)}k`} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#18181B', 
                    border: '1px solid #27272A', 
                    borderRadius: '12px', 
                    color: '#FAFAFA',
                    fontSize: '11px' 
                  }}
                  formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, 'Income']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF5C39" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#coralAreaGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <span>Delivered Volume: <strong>{deliveredOrders.length} orders</strong></span>
            <span className="font-semibold text-[#FF5C39]">Active Window</span>
          </div>
        </motion.div>

      </div>

      {/* ── Lower Row: Spending Limit & Recent Activities Table (Reference Frame 01) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Left: Monthly Spending Limit / Supplier Procurement Gauge (lg:col-span-4) ── */}
        <div className="lg:col-span-4 admin-card p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Monthly Spending Limit
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Supplier footwear procurement vs budget
                </p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('investments')}
                  className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Adjust
                </button>
              )}
            </div>

            {/* Circular Gauge / Multi-bar Visual */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="9"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FF5C39"
                    strokeWidth="9"
                    strokeDasharray={`${(spendingLimitPercent / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {spendingLimitPercent}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Allocated
                  </span>
                </div>
              </div>
              <div className="text-xs text-center font-medium text-zinc-500 dark:text-zinc-400 mt-2">
                Rs. {totalSupplierInvestment.toLocaleString()} of Rs. {supplierBudget.toLocaleString()} limit
              </div>
            </div>
          </div>

          {/* Allocation Categories Breakdown */}
          <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF5C39]" />
                Footwear Stock
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Rs. {totalSupplierInvestment.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Packaging &amp; Unboxing
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Rs. {packagingInvestment.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Monetization &amp; Ads
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Rs. {monetizationInvestment.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 font-bold">
              <span className="text-zinc-700 dark:text-zinc-300">Total Combined Capital</span>
              <span className="text-emerald-600 dark:text-emerald-400">Rs. {grandTotalInvestment.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Right: Recent Activities (Live Orders Table) (lg:col-span-8) ── */}
        <div className="lg:col-span-8 admin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Recent Activities
                {isRefreshing && (
                  <span className="w-2 h-2 rounded-full bg-[#FF5C39] animate-ping" />
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Customer orders placed and fulfillment updates
              </p>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('orders')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                View All Orders
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/70 dark:divide-zinc-800/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400 italic">
                      No customer orders placed yet. Live orders will populate here as customers complete checkout.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map(order => (
                    <tr
                      key={order.id}
                      onClick={() => onNavigateTab && onNavigateTab('orders')}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-bold text-zinc-900 dark:text-zinc-100">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 text-zinc-700 dark:text-zinc-300">
                        {order.shippingAddress?.fullName || 'Store Customer'}
                      </td>
                      <td className="py-3 text-zinc-400">
                        {order.date}
                      </td>
                      <td className="py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1 ${
                          order.status === 'Delivered' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : order.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : order.status === 'Shipped'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'Delivered' ? 'bg-emerald-500' :
                            order.status === 'Cancelled' ? 'bg-rose-500' :
                            order.status === 'Shipped' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        Rs. {order.total?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
            {orderStatusData.map(st => (
              <span key={st.name} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                <span>{st.name}:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{st.value}</strong>
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── Supplementary Widgets: Inventory Alert, AI Studio Status, Reviews ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Inventory Restock Alert */}
        <div className="admin-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Alert
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {lowStockProducts.length} items
            </span>
          </div>

          <div className="space-y-2">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-4 text-zinc-400 text-xs">
                All inventory levels healthy.
              </div>
            ) : (
              lowStockProducts.slice(0, 3).map(product => {
                const stock = typeof product.stockCount === 'number' ? product.stockCount : 0;
                return (
                  <div key={product.id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <img src={product.images?.front || ''} alt={product.name} className="w-8 h-8 object-cover rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                      <div className="line-clamp-1">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block truncate max-w-[130px]">{product.name}</span>
                        <span className="text-[10px] text-zinc-400">{product.category || 'Footwear'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{stock} Left</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI & Vision Studio Pipelines */}
        <div className="admin-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C39]" />
              AI Studio Models
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Foot Sizer Vision</span>
                <span className="text-[10px] text-zinc-400">OpenCV dimension scan</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Outfit Matcher Core</span>
                <span className="text-[10px] text-zinc-400">Style vectorizer engine</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Customer Moderation Feed */}
        <div className="admin-card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Customer Feed
            </h4>
            {onNavigateTab && (
              <button onClick={() => onNavigateTab('reviews')} className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                View All →
              </button>
            )}
          </div>

          <div className="space-y-2">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-4 text-zinc-400 text-xs">
                No customer reviews yet.
              </div>
            ) : (
              pendingReviews.slice(0, 2).map(rev => (
                <div key={rev.id} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{rev.userName}</span>
                    <span className="text-amber-500 text-[10px]">{'★'.repeat(rev.rating)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 italic">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
