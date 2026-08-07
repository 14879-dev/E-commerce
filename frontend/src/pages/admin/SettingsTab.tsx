import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Truck, CreditCard, Ruler, Save, CheckCircle, Lock } from 'lucide-react';
import { apiService } from '../../services/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import type { StoreSettings, SizeMapping } from '../../types/admin';

export const SettingsTab: React.FC<{
  currentRole: 'superadmin' | 'staff';
  onRoleChange: (role: 'superadmin' | 'staff') => void;
}> = ({ currentRole }) => {
  const { updateSettings: syncToPublicSite } = useStoreSettings();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await apiService.getStoreSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (currentRole !== 'superadmin') {
      alert('Permission Denied: Only Super Admin role can save system settings.');
      return;
    }

    // Save to localStorage via apiService
    await apiService.updateStoreSettings(settings);
    // Immediately sync currency + other settings to the public storefront via context
    syncToPublicSite(settings as any);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdateSizeRow = (index: number, field: keyof SizeMapping, val: any) => {
    if (!settings) return;
    const updatedMap = [...settings.sizeChartMap];
    updatedMap[index] = { ...updatedMap[index], [field]: val };
    setSettings({ ...settings, sizeChartMap: updatedMap });
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading settings configuration...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">System Settings & Role Permissions</h2>
          <p className="text-xs text-slate-500">Global store profile, shipping thresholds, payment gateways & size mapping matrix.</p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={currentRole !== 'superadmin'}
            className={`btn-copper text-xs py-2.5 px-6 flex items-center gap-2 ${
              currentRole !== 'superadmin' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </div>

      {/* Role Switcher & Security Banner */}
      <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Active Role Session: <span className="uppercase text-blue-600 font-serif">{currentRole}</span>
          </span>
          <p className="text-slate-600 mt-0.5">
            {currentRole === 'superadmin'
              ? 'Full unrestricted access to financials, payment gateways, admin roles, and store configurations.'
              : 'Staff Role: View & process customer orders, update product catalogs & respond to support messages.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-blue-200 shrink-0">
          <button
            onClick={() => onRoleChange('superadmin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentRole === 'superadmin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Super Admin
          </button>
          <button
            onClick={() => onRoleChange('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentRole === 'staff' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Role
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Store Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Brand & General Store Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Display Currency</label>
              <select
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value as any })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:border-blue-600 focus:outline-none cursor-pointer"
              >
                <option value="USD ($)">USD ($) — US Dollar</option>
                <option value="PKR (Rs.)">PKR (Rs.) — Pakistani Rupee</option>
                <option value="GBP (£)">GBP (£) — British Pound</option>
                <option value="EUR (€)">EUR (€) — Euro</option>
                <option value="AED (د.إ)">AED (د.إ) — UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Support Phone</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Shipping Thresholds */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Nationwide Shipping & Delivery Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Free Shipping Policy / Scope</label>
              <select
                value={settings.freeShippingMode || 'threshold'}
                onChange={e => setSettings({ ...settings, freeShippingMode: e.target.value as any })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none font-medium"
              >
                <option value="threshold">Order Threshold (Free over PKR Amount)</option>
                <option value="all">Free Nationwide Shipping (All Orders Free)</option>
                <option value="product-specific">Product Specific (Only checked products free)</option>
                <option value="none font-medium">No Free Shipping (Rates always apply)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Free Shipping Threshold (PKR Rs.)</label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={e => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                disabled={currentRole !== 'superadmin' || settings.freeShippingMode === 'all'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Standard Shipping Fee (Rs.)</label>
              <input
                type="number"
                value={settings.standardShippingFee}
                onChange={e => setSettings({ ...settings, standardShippingFee: Number(e.target.value) })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Express Courier Rate (Rs.)</label>
              <input
                type="number"
                value={settings.expressShippingFee}
                onChange={e => setSettings({ ...settings, expressShippingFee: Number(e.target.value) })}
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" /> Payment Gateway Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">Cash on Delivery (COD)</span>
              <input
                type="checkbox"
                checked={settings.codEnabled}
                onChange={e => setSettings({ ...settings, codEnabled: e.target.checked })}
                disabled={currentRole !== 'superadmin'}
                className="accent-blue-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">Easypaisa Mobile Wallet</span>
              <input
                type="checkbox"
                checked={settings.easypaisaEnabled}
                onChange={e => setSettings({ ...settings, easypaisaEnabled: e.target.checked })}
                disabled={currentRole !== 'superadmin'}
                className="accent-blue-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-semibold text-slate-900">JazzCash Mobile Wallet</span>
              <input
                type="checkbox"
                checked={settings.walletEnabled}
                onChange={e => setSettings({ ...settings, walletEnabled: e.target.checked })}
                disabled={currentRole !== 'superadmin'}
                className="accent-blue-600 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Size Chart Mapping Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-600" /> Camera Size Finder Mapping Table
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">EU Size</th>
                  <th className="py-2.5 px-4">UK Equivalent</th>
                  <th className="py-2.5 px-4">Foot Length (mm)</th>
                  <th className="py-2.5 px-4">Bridge Width Recommendation Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.sizeChartMap.map((row, idx) => (
                  <tr key={row.eu}>
                    <td className="py-2 px-4 font-bold text-slate-900">EU {row.eu}</td>
                    <td className="py-2 px-4 text-slate-700">UK {row.uk}</td>
                    <td className="py-2 px-4 font-mono font-bold text-blue-600">{row.mm} mm</td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={row.widthNote}
                        onChange={e => handleUpdateSizeRow(idx, 'widthNote', e.target.value)}
                        disabled={currentRole !== 'superadmin'}
                        className="w-full px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </form>
    </div>
  );
};
