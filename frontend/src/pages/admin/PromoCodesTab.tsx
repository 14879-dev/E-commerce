import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import type { PromoCode } from '../../types/admin';

export const PromoCodesTab: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Promo Code Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    value: 15,
    minOrderValue: 100,
    usageLimit: 200,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '2026-12-31',
    scope: 'store-wide' as 'store-wide' | 'category' | 'specific',
    categoryScope: 'Kaptaan',
    active: true
  });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setLoading(true);
    const list = await apiService.getPromoCodes();
    setPromos(list);
    setLoading(false);
  };

  const handleToggleActive = async (id: string) => {
    await apiService.togglePromoStatus(id);
    loadPromos();
  };

  const handleDeletePromo = async (id: string) => {
    if (confirm('Delete this promo code permanently?')) {
      await apiService.deletePromoCode(id);
      loadPromos();
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    await apiService.createPromoCode({
      code: formData.code.toUpperCase().replace(/\s+/g, ''),
      discountType: formData.discountType,
      value: formData.value,
      minOrderValue: formData.minOrderValue,
      usageLimit: formData.usageLimit,
      startDate: formData.startDate,
      expiryDate: formData.expiryDate,
      scope: formData.scope,
      categoryScope: formData.scope === 'category' ? formData.categoryScope : undefined,
      active: formData.active
    });

    setShowModal(false);
    loadPromos();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Promo Codes & Campaign Discounts</h2>
          <p className="text-xs text-slate-500">Configure percentage/fixed discounts, usage caps & track promo ROI.</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-copper text-xs py-2.5 px-6 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Promo Code
        </button>
      </div>

      {/* Usage Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Discount Distributed</span>
          <div className="font-serif font-bold text-2xl text-slate-900">
            Rs. {promos.reduce((acc, p) => acc + (p.totalDiscountGiven || 0), 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">Across active campaigns</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Net Promo Revenue</span>
          <div className="font-serif font-bold text-2xl text-emerald-600">
            Rs. {promos.reduce((acc, p) => acc + (p.revenueGenerated || 0), 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Attributed orders</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Redemption Count</span>
          <div className="font-serif font-bold text-2xl text-slate-900">
            {promos.reduce((acc, p) => acc + (p.timesUsed || 0), 0)} Redemptions
          </div>
          <span className="text-[11px] text-slate-500">
            {promos.length > 0 ? `${(promos.reduce((acc, p) => acc + (p.timesUsed || 0), 0) / promos.length).toFixed(1)} avg per promo` : 'No redemptions yet'}
          </span>
        </div>
      </div>

      {/* Promos Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Promo Code</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Spend</th>
                <th className="py-3 px-4">Usage Stats</th>
                <th className="py-3 px-4">Valid Window</th>
                <th className="py-3 px-4">Generated Revenue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading campaign codes...</td>
                </tr>
              ) : promos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No promo codes created yet.</td>
                </tr>
              ) : (
                promos.map(promo => (
                  <tr key={promo.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-blue-600">
                      {promo.code}
                      {promo.scope === 'category' && (
                        <span className="block text-[10px] font-serif text-slate-400">Scope: {promo.categoryScope}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {promo.discountType === 'percentage' ? `${promo.value}% OFF` : `Rs. ${promo.value} FIXED OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">Rs. {promo.minOrderValue}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <strong>{promo.timesUsed}</strong> / {promo.usageLimit} limit
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {promo.startDate} → {promo.expiryDate}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-bold text-slate-900">
                      Rs. {promo.revenueGenerated.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(promo.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                          promo.active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {promo.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDeletePromo(promo.id)}
                        className="p-1.5 rounded-lg border transition-colors shadow-2xs hover:scale-105"
                        style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                        title="Delete Promo"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626', stroke: '#DC2626' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promo Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-serif font-bold text-xl text-slate-900">Create Campaign Promo Code</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Promo Code String</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. SUMMER20"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 uppercase font-mono font-bold text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Amount (Rs. OFF)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Minimum Order (PKR Rs.)</label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Usage Limit (Max Redemptions)</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-glass text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-copper text-xs py-2 px-6">
                  Save Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
