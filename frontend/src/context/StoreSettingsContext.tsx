import React, { createContext, useContext, useState, useEffect } from 'react';
import type { StoreSettings, SocialLinks } from '../types/admin';
import { normalizeAssetUrl } from '../utils/assetUrl';

export type { StoreSettings, SocialLinks };

interface StoreSettingsContextType {
  settings: StoreSettings;
  updateSettings: (s: StoreSettings) => void;
  toggleHideCategories: () => void;
  formatPrice: (amount?: number | null) => string;
  currencySymbol: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Peshawari Chappal Co.',
  logoUrl: '',
  faviconUrl: '/favicon.ico',
  socialLinks: {
    whatsapp: '+923001234567',
    instagram: 'https://instagram.com/peshawarichappal',
    facebook: 'https://facebook.com/peshawarichappal',
    tiktok: 'https://tiktok.com/@peshawarichappal',
    twitter: 'https://x.com/peshawarichappal',
    youtube: 'https://youtube.com/@peshawarichappal',
  },
  supportEmail: 'concierge@peshawarichappal.com',
  supportPhone: '+92 91 111 222 333',
  currency: 'PKR (Rs.)',
  freeShippingMode: 'threshold',
  freeShippingThreshold: 4500,
  standardShippingFee: 250,
  expressShippingFee: 450,
  codEnabled: true,
  easypaisaEnabled: true,
  walletEnabled: true,
  lowStockThreshold: 5,
  sizeChartMap: [
    { eu: 39, uk: 5, mm: 245, widthNote: 'Narrow bridge fit' },
    { eu: 40, uk: 6, mm: 252, widthNote: 'Regular slim fit' },
    { eu: 41, uk: 7, mm: 260, widthNote: 'Standard fit' },
    { eu: 42, uk: 8, mm: 268, widthNote: 'Standard regular bridge' },
    { eu: 43, uk: 9, mm: 275, widthNote: 'Wide bridge' },
    { eu: 44, uk: 10, mm: 283, widthNote: 'Extra wide fit' },
    { eu: 45, uk: 11, mm: 290, widthNote: 'Maximum comfort width' },
  ],
  hideCategories: true, // Currently hidden per store requirements
  heroMediaUrl: null,
  heroMediaType: null,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD ($)': '$',
  'PKR (Rs.)': 'Rs.',
  'GBP (£)': '£',
  'EUR (€)': '€',
  'AED (د.إ)': 'د.إ',
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const stored = localStorage.getItem('psh_store_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.logoUrl) parsed.logoUrl = normalizeAssetUrl(parsed.logoUrl);
        if (parsed.faviconUrl) parsed.faviconUrl = normalizeAssetUrl(parsed.faviconUrl);
        if (parsed.heroMediaUrl) parsed.heroMediaUrl = normalizeAssetUrl(parsed.heroMediaUrl);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  // Fetch central store settings from backend so mobile and new visitors always get official settings
  useEffect(() => {
    fetch('/api/store-settings')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && data.success !== false) {
          const normalized: Partial<StoreSettings> = {
            ...data,
            logoUrl: normalizeAssetUrl(data.logoUrl),
            faviconUrl: normalizeAssetUrl(data.faviconUrl) || '/favicon.ico',
            heroMediaUrl: normalizeAssetUrl(data.heroMediaUrl),
          };
          setSettings(prev => {
            const merged = { ...prev, ...normalized };
            localStorage.setItem('psh_store_settings', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Dynamic favicon sync to browser tab
  useEffect(() => {
    if (settings.faviconUrl) {
      const normalizedFav = normalizeAssetUrl(settings.faviconUrl);
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = normalizedFav;
    }
  }, [settings.faviconUrl]);

  const updateSettings = (s: StoreSettings) => {
    const clean: StoreSettings = {
      ...s,
      logoUrl: normalizeAssetUrl(s.logoUrl),
      faviconUrl: normalizeAssetUrl(s.faviconUrl),
      heroMediaUrl: normalizeAssetUrl(s.heroMediaUrl),
    };
    setSettings(clean);
    localStorage.setItem('psh_store_settings', JSON.stringify(clean));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('psh:store-settings-changed', { detail: clean }));
    }

    // Sync to backend if admin token exists
    const token = sessionStorage.getItem('psh_admin_token') || localStorage.getItem('psh_admin_token') || '';
    if (token) {
      fetch('/api/admin/store-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clean),
      }).catch(() => {});
    }
  };

  const toggleHideCategories = () => {
    const nextState = !settings.hideCategories;
    const updated = { ...settings, hideCategories: nextState };
    updateSettings(updated);
  };

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || '$';

  const formatPrice = (amount?: number | null): string => {
    if (typeof amount !== 'number' || isNaN(amount)) return '';
    const symbol = CURRENCY_SYMBOLS[settings.currency] || '$';
    if (symbol === 'Rs.') {
      return `Rs. ${amount.toLocaleString()}`;
    }
    return `${symbol}${amount}`;
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, updateSettings, toggleHideCategories, formatPrice, currencySymbol }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = (): StoreSettingsContextType => {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) throw new Error('useStoreSettings must be inside StoreSettingsProvider');
  return ctx;
};
