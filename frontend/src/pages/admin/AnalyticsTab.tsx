import React, { useState } from 'react';
import { TrendingUp, Globe, Search, Camera, Sparkles, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const CATEGORY_SALES = [
  { name: 'Kaptaan Series', sales: 12400, color: '#2563eb' },
  { name: 'Zalmi Royal', sales: 8600, color: '#d97706' },
  { name: 'Norzi Master', sales: 4200, color: '#16a34a' },
  { name: 'Quetta Gold', sales: 2100, color: '#9333ea' },
  { name: 'Royal Heirloom', sales: 1150, color: '#dc2626' },
];

const REGIONAL_SALES = [
  { region: 'Pakistan (Domestic)', revenue: 14200 },
  { region: 'UAE & Gulf (Express)', revenue: 7800 },
  { region: 'United Kingdom', revenue: 3900 },
  { region: 'USA & Canada', revenue: 2550 },
];

const SEARCH_TERMS = [
  { term: 'Kaptaan tan chappal', searches: 1420 },
  { term: 'Zalmi double sole', searches: 980 },
  { term: 'Size 42 wide fit', searches: 850 },
  { term: 'Brass buckle heirloom', searches: 640 },
  { term: 'Shalwar kameez matching', searches: 510 },
];

export const AnalyticsTab: React.FC = () => {
  const [period, setPeriod] = useState<'30days' | '90days' | '1year'>('30days');

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Marketing & Storefront Intelligence</h2>
          <p className="text-xs text-slate-500">Sales by category, international shipping demographics, search terms & AI feature conversions.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['30days', '90days', '1year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
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

      {/* MoM Comparison Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Monthly Sales Volume</span>
          <div className="font-serif font-bold text-2xl text-slate-900">Rs. 828,450</div>
          <span className="text-[11px] text-emerald-600 font-semibold">+14.2% MoM Growth</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Size Finder Conversion</span>
          <div className="font-serif font-bold text-2xl text-blue-600">68.4%</div>
          <span className="text-[11px] text-blue-600 font-semibold">Camera scan to add-to-cart</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">AI Stylist Engagement</span>
          <div className="font-serif font-bold text-2xl text-slate-900">1,840 Scans</div>
          <span className="text-[11px] text-emerald-600 font-semibold">+35% repeat matches</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Bespoke 3D Custom Ratio</span>
          <div className="font-serif font-bold text-2xl text-purple-600">41.5%</div>
          <span className="text-[11px] text-purple-600 font-semibold">High margin customized orders</span>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales By Category Pie Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Revenue Breakdown by Silhouette</h3>
            <p className="text-xs text-slate-500">Sales volume per product collection</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_SALES}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="sales"
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {CATEGORY_SALES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => `Rs. ${val}`} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Sales Bar Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Geographic Sales Demographics</h3>
            <p className="text-xs text-slate-500">Pakistani city courier destinations</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REGIONAL_SALES}>
                <XAxis dataKey="region" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={val => `Rs. ${val}`} />
                <Tooltip formatter={(val: any) => `Rs. ${val}`} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature & Search Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Search Terms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" /> Top Catalog Search Queries
            </h3>
            <span className="text-xs text-slate-400">Real-time Intent</span>
          </div>

          <div className="space-y-2 text-xs">
            {SEARCH_TERMS.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-900">"{item.term}"</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {item.searches} searches
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Camera Finder & AI Matcher Metrics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> AI & Computer Vision Feature Metrics
            </h3>
            <span className="text-xs text-slate-400">Funnel Analytics</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Camera Foot Size Scan Completions</span>
                <span className="text-blue-600">84.2% Success</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '84.2%' }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>AI Outfit Matcher Direct Add to Bag</span>
                <span className="text-emerald-600">62.8% Conversion</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '62.8%' }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-900">
                <span>3D Configurator Custom Initials Engraved</span>
                <span className="text-purple-600">76.0% Attachment</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '76%' }} />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
