import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle, Box, Star, RefreshCw, CheckCircle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../../services/api';
import type { Product, Order, Review } from '../../types';

const REVENUE_DATA = [
  { label: 'Jan', revenue: 14200, orders: 98 },
  { label: 'Feb', revenue: 18400, orders: 122 },
  { label: 'Mar', revenue: 21100, orders: 140 },
  { label: 'Apr', revenue: 19800, orders: 131 },
  { label: 'May', revenue: 24500, orders: 165 },
  { label: 'Jun', revenue: 22900, orders: 154 },
  { label: 'Jul', revenue: 27800, orders: 182 },
  { label: 'Aug', revenue: 28450, orders: 184 },
];

const ORDER_STATUS_DATA = [
  { name: 'Delivered', value: 110, color: '#16a34a' },
  { name: 'Shipped', value: 34, color: '#2563eb' },
  { name: 'Crafting', value: 25, color: '#d97706' },
  { name: 'Placed', value: 12, color: '#9333ea' },
  { name: 'Cancelled', value: 3, color: '#dc2626' },
];

export const DashboardTab: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<(Review & { productName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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

  const lowStockProducts = products.filter(p => (p.reviewCount || 0) < 30); // Simulated stock alert
  const pendingReviews = reviews.filter(r => r.status === 'approved' || r.status === 'pending');

  return (
    <div className="space-y-8">

      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Performance Executive Overview</h2>
          <p className="text-xs text-slate-500">Live operational metrics, sales analytics, and pipeline status.</p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">Rs. 28,450</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs last month
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">{orders.length + 183}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> +8.5% order volume
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Average Order Value</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">Rs. 4,850</div>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold">
            High-Value Bespoke 3D Custom
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Customers</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">128</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            +22 registered today
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-slate-900">3.8%</div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            Powered by 3D Viewer & AI
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
              <p className="text-xs text-slate-500">Monthly revenue accumulation (USD)</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Filtered: {timeRange.toUpperCase()}
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
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
                  formatter={(val: any) => [`Rs. ${val}`, 'Revenue']}
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ORDER_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {ORDER_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {ORDER_STATUS_DATA.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}: <strong className="text-slate-900">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Low-Stock Alerts & 3D Pipeline & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Best-Selling & Low Stock Widget */}
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
            {products.slice(0, 3).map(product => (
              <div key={product.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <img src={product.images.front} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">{product.name}</h4>
                    <span className="text-[10px] text-slate-500">Category: {product.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-600 block">4 Left</span>
                  <span className="text-[10px] text-slate-400">Reorder threshold 10</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Photogrammetry Pipeline Status */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-600" /> 3D Pipeline Status
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              5/5 Ready
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Automated 6-angle image photogrammetry pipeline converts product uploads into WebGL Three.js assets.
          </p>

          <div className="space-y-2">
            {products.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                <span className="font-medium text-slate-900 truncate max-w-[180px]">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase">
                    Ready (6 Shots)
                  </span>
                  <button className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Re-run 3D Render">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
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
            {pendingReviews.slice(0, 3).map(rev => (
              <div key={rev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{rev.userName}</span>
                  <div className="flex text-amber-400">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 italic">"{rev.comment}"</p>
              </div>
            ))}
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
                <th className="pb-3">Customized?</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/60">
                  <td className="py-3 font-serif font-bold text-slate-900">{order.orderNumber}</td>
                  <td className="py-3 text-slate-800">{order.shippingAddress.fullName}</td>
                  <td className="py-3 text-slate-500">{order.date}</td>
                  <td className="py-3">
                    {order.isCustomizedOrder ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                        Bespoke 3D
                      </span>
                    ) : (
                      <span className="text-slate-400">Standard</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold uppercase">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-serif font-bold text-slate-900">Rs. {order.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
