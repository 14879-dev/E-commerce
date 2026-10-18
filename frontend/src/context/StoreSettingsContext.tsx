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
  logoUrl: '/uploads/khybersole-header-logo.png',
  footerLogoUrl: '/uploads/khybersole-footer-logo.png',
  faviconUrl: '/uploads/asset_1790946835970.png',
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
    { size: 7, uk: 7, eu: 41, mm: 250, widthNote: 'Narrow / slim bridge fit' },
    { size: 8, uk: 8, eu: 42, mm: 260, widthNote: 'Standard regular fit' },
    { size: 9, uk: 9, eu: 43, mm: 270, widthNote: 'Standard fit (Most Popular)' },
    { size: 10, uk: 10, eu: 44, mm: 280, widthNote: 'Comfort regular bridge' },
    { size: 11, uk: 11, eu: 45, mm: 290, widthNote: 'Wide bridge' },
    { size: 12, uk: 12, eu: 46, mm: 300, widthNote: 'Extra wide comfort fit' },
    { size: 13, uk: 13, eu: 47, mm: 310, widthNote: 'Maximum comfort width' },
  ],
  hideCategories: true, // Currently hidden per store requirements
  heroMediaUrl: '/uploads/hero.webp',
  heroMediaType: 'image',
  heroSlides: [
    {
      id: 'slide-1',
      url: '/uploads/hero.webp',
      type: 'image',
      badge: 'Heritage Re-imagined With AI Fit',
      title: 'Authentic Peshawari Chappal',
      subtitle: 'Crafted for Royalty.',
      description: 'Hand-tanned full-grain cowhide leather, double-stitched by master craftsmen in Khyber Pakhtunkhwa.',
      linkText: 'Shop Collection',
      linkUrl: '/products',
      active: true
    },
    {
      id: 'slide-2',
      url: '/images/ai-foot-scanner-demo.jpg',
      type: 'image',
      badge: 'Camera Size Calibration',
      title: 'AI Foot Size Finder',
      subtitle: 'True-to-Size Peshawari Fit.',
      description: 'Place your foot on standard A4 paper. Millimeter-accurate size recommendation with zero guesswork.',
      linkText: 'Try Size Finder',
      linkUrl: '/size-finder',
      active: true
    },
    {
      id: 'slide-3',
      url: '/images/ai-outfit-matcher-demo.jpg',
      type: 'image',
      badge: 'Color Harmony & Tone AI',
      title: 'AI Traditional Outfit Matcher',
      subtitle: 'Color & Tone Pairing.',
      description: 'Upload a photo of your Shalwar Kameez or Kurta. Match with the ideal leather shade and silhouette.',
      linkText: 'Match Your Outfit',
      linkUrl: '/outfit-match',
      active: true
    }
  ],
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
        if (parsed.footerLogoUrl) parsed.footerLogoUrl = normalizeAssetUrl(parsed.footerLogoUrl);
        if (parsed.faviconUrl) parsed.faviconUrl = normalizeAssetUrl(parsed.faviconUrl);
        if (parsed.heroMediaUrl) parsed.heroMediaUrl = normalizeAssetUrl(parsed.heroMediaUrl);
        if (Array.isArray(parsed.heroSlides)) {
          parsed.heroSlides = parsed.heroSlides.map((s: any) => ({ ...s, url: normalizeAssetUrl(s.url) }));
        }
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
            footerLogoUrl: normalizeAssetUrl(data.footerLogoUrl),
            faviconUrl: normalizeAssetUrl(data.faviconUrl) || '/favicon.ico',
            heroMediaUrl: normalizeAssetUrl(data.heroMediaUrl),
            heroSlides: Array.isArray(data.heroSlides)
              ? data.heroSlides.map((s: any) => ({ ...s, url: normalizeAssetUrl(s.url) }))
              : undefined,
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
      footerLogoUrl: normalizeAssetUrl(s.footerLogoUrl),
      faviconUrl: normalizeAssetUrl(s.faviconUrl),
      heroMediaUrl: normalizeAssetUrl(s.heroMediaUrl),
      heroSlides: Array.isArray(s.heroSlides)
        ? s.heroSlides.map((sl: any) => ({ ...sl, url: normalizeAssetUrl(sl.url) }))
        : undefined,
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
