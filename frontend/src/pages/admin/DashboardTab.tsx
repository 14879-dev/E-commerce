import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Sparkles, Clock, Coins, RefreshCw, Star, Box, Package } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../../services/api';
import type { Product, Order, Review } from '../../types';

export const DashboardTab: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<(Review & { productName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const handleProductsChanged = () => loadData();
    const handleOrdersChanged = () => loadData();
    window.addEventListener('psh:products-changed', handleProductsChanged);
    window.addEventListener('psh:orders-changed', handleOrdersChanged);
    return () => {
      window.removeEventListener('psh:products-changed', handleProductsChanged);
      window.removeEventListener('psh:orders-changed', handleOrdersChanged);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    const p = await apiService.getProducts();
    const o = await apiService.getOrders();
    const r = await apiService.getAllReviews();
    setProducts(p);
    setOrders(o);
    setReviews(r);
    setLoading(false);
  };

  // Low stock products: stock <= 5
  const lowStockProducts = products.filter(p => {
    const stock = typeof p.stockCount === 'number' ? p.stockCount : 0;
    return stock > 0 && stock <= 5;
  });

  const pendingReviews = reviews.filter(r => r.status === 'approved' || r.status === 'pending');

  // Business Financial & Operational Calculations
  const calculatedRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalRevenue = calculatedRevenue;

  // Total investment across all chappal in inventory (costPrice * stockCount)
  const totalInvestment = products.reduce((sum, p) => {
    const cost = Number(p.costPrice) || 0;
    const stock = typeof p.stockCount === 'number' ? p.stockCount : 0;
    return sum + (cost * stock);
  }, 0);

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
    { name: 'Delivered', value: statusMap['Delivered'] || 0, color: '#16a34a' },
    { name: 'Shipped', value: statusMap['Shipped'] || 0, color: '#2563eb' },
    { name: 'Crafting', value: statusMap['Crafting'] || 0, color: '#d97706' },
    { name: 'Placed', value: statusMap['Placed'] || 0, color: '#9333ea' },
    { name: 'Cancelled', value: statusMap['Cancelled'] || 0, color: '#dc2626' },
  ];

  const hasOrderStatusData = orders.length > 0;

  // Monthly revenue trajectory
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenueChartData = monthNames.map(m => {
    const monthOrders = orders.filter(o => o.date && o.date.includes(m));
    const rev = monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
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
          <h2 className="font-serif font-bold text-2xl text-slate-900">Performance Executive Overview</h2>
          <p className="text-xs text-slate-500">Live operational metrics, inventory investment, revenue, and order pipeline.</p>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">Rs. {totalRevenue.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            {orders.length > 0 ? 'Gross revenue from confirmed orders' : 'Awaiting first customer purchase'}
          </div>
        </div>

        {/* Card 2: Total Investment in Chappal */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Investment in Chappal</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-emerald-700">Rs. {totalInvestment.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            {products.length > 0 ? `Supplier purchase capital across ${products.length} product(s)` : 'No inventory capital committed yet'}
          </div>
        </div>

        {/* Card 3: Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">{totalOrdersCount}</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            {totalOrdersCount > 0 ? 'Total orders received to date' : 'No orders recorded yet'}
          </div>
        </div>

        {/* Card 4: Pending Orders */}
        <div className="bg-white rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50/20 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-amber-700">{pendingOrdersCount} In Queue</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            {pendingOrdersCount > 0 ? 'Awaiting crafting or courier dispatch' : 'All orders fulfilled / No pending tasks'}
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
          <h3 className="font-serif font-bold text-lg text-slate-900">Recent Customer Orders</h3>
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
                  <tr key={order.id} className="hover:bg-slate-50/60">
                    <td className="py-3 font-serif font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 text-slate-800">{order.shippingAddress?.fullName || 'Customer'}</td>
                    <td className="py-3 text-slate-500">{order.date}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold uppercase">
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
