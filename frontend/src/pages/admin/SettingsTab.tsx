import React, { useState, useEffect, useRef } from 'react';
import { Settings, ShieldCheck, Truck, CreditCard, Ruler, Save, CheckCircle, ImagePlay, Trash2, Upload, Share2, Globe, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { normalizeAssetUrl } from '../../utils/assetUrl';
import type { StoreSettings, SizeMapping, SocialLinks } from '../../types/admin';

export const SettingsTab: React.FC<{
  currentRole: 'superadmin' | 'manager' | 'staff';
  onRoleChange: (role: 'superadmin' | 'manager' | 'staff') => void;
}> = ({ currentRole, onRoleChange }) => {
  const { settings: storeCtxSettings, updateSettings: syncToPublicSite } = useStoreSettings();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Hero media state
  const [heroMediaUrl, setHeroMediaUrl] = useState<string | null>(storeCtxSettings.heroMediaUrl || null);
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video' | null>(storeCtxSettings.heroMediaType || null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

  // Logo & Favicon upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const [faviconUploading, setFaviconUploading] = useState(false);
  const [faviconError, setFaviconError] = useState<string | null>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    // Also load hero media info from backend
    fetch('/api/hero-media')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d && d.url) {
          setHeroMediaUrl(normalizeAssetUrl(d.url));
          setHeroMediaType(d.type);
        }
      })
      .catch(() => {});
  }, []);

  const getAdminToken = () => {
    return sessionStorage.getItem('psh_admin_token') || localStorage.getItem('psh_admin_token') || apiService.getAdminToken() || '';
  };

  const handleBrandAssetUpload = async (file: File, assetType: 'logo' | 'favicon') => {
    if (assetType === 'logo') {
      setLogoUploading(true);
      setLogoError(null);
    } else {
      setFaviconUploading(true);
      setFaviconError(null);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    const token = getAdminToken();
    if (!token) {
      const err = 'No admin token found. Please log in.';
      if (assetType === 'logo') setLogoError(err);
      else setFaviconError(err);
      setLogoUploading(false);
      setFaviconUploading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/brand-asset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
      const cleanUrl = normalizeAssetUrl(data.url);

      if (assetType === 'logo') {
        const updated = { ...settings!, logoUrl: cleanUrl };
        setSettings(updated);
        syncToPublicSite(updated);
      } else {
        const updated = { ...settings!, faviconUrl: cleanUrl };
        setSettings(updated);
        syncToPublicSite(updated);
      }
    } catch (err: any) {
      if (assetType === 'logo') setLogoError(err.message || 'Logo upload failed');
      else setFaviconError(err.message || 'Favicon upload failed');
    } finally {
      if (assetType === 'logo') {
        setLogoUploading(false);
        if (logoFileRef.current) logoFileRef.current.value = '';
      } else {
        setFaviconUploading(false);
        if (faviconFileRef.current) faviconFileRef.current.value = '';
      }
    }
  };

  const handleLogoDelete = () => {
    if (!settings) return;
    const updated = { ...settings, logoUrl: '' };
    setSettings(updated);
    syncToPublicSite(updated);
  };

  const handleFaviconDelete = () => {
    if (!settings) return;
    const updated = { ...settings, faviconUrl: '/favicon.ico' };
    setSettings(updated);
    syncToPublicSite(updated);
  };

  const handleSocialChange = (field: keyof SocialLinks, val: string) => {
    if (!settings) return;
    const socialLinks = { ...(settings.socialLinks || {}), [field]: val };
    setSettings({ ...settings, socialLinks });
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    setHeroError(null);
    const formData = new FormData();
    formData.append('media', file);
    const token = getAdminToken();
    if (!token) {
      setHeroError('No admin token found. Please log out and log back in.');
      setHeroUploading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/hero-media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
      const cleanUrl = normalizeAssetUrl(data.url);
      setHeroMediaUrl(cleanUrl);
      setHeroMediaType(data.type);
      // Persist to storeCtxSettings so HomePage picks it up immediately
      syncToPublicSite({ ...storeCtxSettings, heroMediaUrl: cleanUrl, heroMediaType: data.type } as any);
    } catch (err: any) {
      setHeroError(err.message || 'Upload failed');
    } finally {
      setHeroUploading(false);
      if (heroFileRef.current) heroFileRef.current.value = '';
    }
  };

  const handleHeroDelete = async () => {
    const token = getAdminToken();
    try {
      await fetch('/api/admin/hero-media', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHeroMediaUrl(null);
      setHeroMediaType(null);
      syncToPublicSite({ ...storeCtxSettings, heroMediaUrl: null, heroMediaType: null } as any);
    } catch {}
  };

  const loadSettings = async () => {
    setLoading(true);
    const data = await apiService.getStoreSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (currentRole === 'staff') {
      alert('Permission Denied: Staff role cannot modify global system settings.');
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
            disabled={currentRole === 'staff'}
            className={`btn-copper text-xs py-2.5 px-6 flex items-center gap-2 ${
              currentRole === 'staff' ? 'opacity-50 cursor-not-allowed' : ''
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
            <Settings className="w-5 h-5 text-blue-600" /> Brand &amp; General Store Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                disabled={currentRole === 'staff'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Display Currency</label>
              <select
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value as any })}
                disabled={currentRole === 'staff'}
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
                disabled={currentRole === 'staff'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Support Phone</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                disabled={currentRole === 'staff'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Brand Assets (Logo & Favicon Upload) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" /> Brand Identity: Store Logo & Browser Favicon
            </h3>
            <p className="text-xs text-slate-500 mt-1">Upload your official store logo for headers & footers, and a custom favicon for the browser tab.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700">Store Logo</span>
                {settings.logoUrl && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Custom Logo Active
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="h-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-3 relative overflow-hidden shadow-xs">
                {settings.logoUrl ? (
                  <img src={normalizeAssetUrl(settings.logoUrl)} alt="Store Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-serif font-bold flex items-center justify-center text-sm">P</div>
                    <span className="text-xs font-semibold text-slate-500">Default Peshawari Monogram</span>
                  </div>
                )}
              </div>

              {logoError && <p className="text-[11px] text-red-600 font-semibold">{logoError}</p>}

              <div className="flex items-center gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentRole !== 'superadmin' ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={currentRole !== 'superadmin' || logoUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBrandAssetUpload(f, 'logo');
                    }}
                  />
                </label>

                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={currentRole !== 'superadmin'}
                    className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                    title="Remove custom logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Recommended: Transparent PNG or SVG (height 80px–120px).</p>
            </div>

            {/* Favicon Upload Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700">Browser Favicon</span>
                {settings.faviconUrl && settings.faviconUrl !== '/favicon.ico' && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Custom Favicon Active
                  </span>
                )}
              </div>

              {/* Browser Tab Preview Mockup */}
              <div className="h-24 rounded-lg bg-white border border-slate-200 flex flex-col justify-center px-4 relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-2 max-w-[220px] border border-slate-200">
                  <img
                    src={settings.faviconUrl || '/favicon.ico'}
                    alt="Favicon"
                    className="w-4 h-4 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[11px] font-medium text-slate-700 truncate">{settings.storeName || 'Peshawari Store'}</span>
                </div>
              </div>

              {faviconError && <p className="text-[11px] text-red-600 font-semibold">{faviconError}</p>}

              <div className="flex items-center gap-2">
                <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentRole !== 'superadmin' ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                }`}>
                  <Upload className="w-3.5 h-3.5" />
                  {faviconUploading ? 'Uploading...' : 'Upload Favicon'}
                  <input
                    ref={faviconFileRef}
                    type="file"
                    accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                    className="hidden"
                    disabled={currentRole !== 'superadmin' || faviconUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleBrandAssetUpload(f, 'favicon');
                    }}
                  />
                </label>

                {settings.faviconUrl && settings.faviconUrl !== '/favicon.ico' && (
                  <button
                    type="button"
                    onClick={handleFaviconDelete}
                    disabled={currentRole !== 'superadmin'}
                    className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                    title="Reset to default favicon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Supported formats: .ico, .png, or .svg (32×32 or 64×64 square).</p>
            </div>
          </div>
        </div>

        {/* Social Media & WhatsApp Concierge */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" /> Social Media Accounts & WhatsApp Concierge
            </h3>
            <p className="text-xs text-slate-500 mt-1">Configure your official brand profiles to show in the store footer and power the floating WhatsApp concierge button.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Number / Link
              </label>
              <input
                type="text"
                value={settings.socialLinks?.whatsapp || ''}
                onChange={e => handleSocialChange('whatsapp', e.target.value)}
                placeholder="+923001234567 or wa.me link"
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Powers the hovering WhatsApp button on storefront.</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Instagram URL</label>
              <input
                type="text"
                value={settings.socialLinks?.instagram || ''}
                onChange={e => handleSocialChange('instagram', e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facebook Page URL</label>
              <input
                type="text"
                value={settings.socialLinks?.facebook || ''}
                onChange={e => handleSocialChange('facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">TikTok Profile URL</label>
              <input
                type="text"
                value={settings.socialLinks?.tiktok || ''}
                onChange={e => handleSocialChange('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@yourbrand"
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">YouTube Channel URL</label>
              <input
                type="text"
                value={settings.socialLinks?.youtube || ''}
                onChange={e => handleSocialChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                disabled={currentRole !== 'superadmin'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Twitter / X URL</label>
              <input
                type="text"
                value={settings.socialLinks?.twitter || ''}
                onChange={e => handleSocialChange('twitter', e.target.value)}
                placeholder="https://x.com/yourhandle"
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

        {/* Hero Media Upload */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-lg text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ImagePlay className="w-5 h-5 text-blue-600" /> Hero Section Background Media
          </h3>
          <p className="text-xs text-slate-500">Upload a WebP image or WebP/MP4 video to replace the hero section background on the public storefront. Recommended: 1920×1080 minimum.</p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Preview */}
            <div className="w-full sm:w-72 aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              {heroMediaUrl ? (
                heroMediaType === 'video' ? (
                  <video src={heroMediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <img src={heroMediaUrl} alt="Hero background" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImagePlay className="w-10 h-10 opacity-40" />
                  <span className="text-xs">No hero media set</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {heroError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-200">{heroError}</p>
              )}

              <label
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed ${
                  currentRole !== 'superadmin' ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-blue-300 hover:border-blue-500 cursor-pointer bg-blue-50/50'
                } text-xs font-semibold text-blue-700 transition-all`}
              >
                <Upload className="w-4 h-4" />
                {heroUploading ? 'Uploading...' : 'Choose WebP image or WebM/MP4 video'}
                <input
                  ref={heroFileRef}
                  type="file"
                  accept="image/webp,image/jpeg,image/png,video/webm,video/mp4"
                  className="hidden"
                  disabled={currentRole !== 'superadmin' || heroUploading}
                  onChange={handleHeroUpload}
                />
              </label>

              {heroMediaUrl && (
                <button
                  type="button"
                  onClick={handleHeroDelete}
                  disabled={currentRole !== 'superadmin'}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" /> Remove Hero Media
                </button>
              )}

              <p className="text-[11px] text-slate-400">
                {heroMediaUrl ? `Active: ${heroMediaType === 'video' ? '🎬 Video' : '🖼️ Image'} background` : 'Default gradient will show when no media is set.'}
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
