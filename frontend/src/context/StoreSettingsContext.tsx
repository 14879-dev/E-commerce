import React, { createContext, useContext, useState, useEffect } from 'react';

interface StoreSettings {
  storeName: string;
  logoUrl: string;
  supportEmail: string;
  supportPhone: string;
  currency: 'USD ($)' | 'PKR (Rs.)' | 'GBP (£)' | 'EUR (€)' | 'AED (د.إ)';
  freeShippingMode: 'all' | 'threshold' | 'product-specific' | 'none';
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  codEnabled: boolean;
  easypaisaEnabled: boolean;
  walletEnabled: boolean;
  lowStockThreshold: number;
  sizeChartMap: { eu: number; uk: number; mm: number; widthNote: string }[];
}

interface StoreSettingsContextType {
  settings: StoreSettings;
  updateSettings: (s: StoreSettings) => void;
  formatPrice: (amount: number) => string;
  currencySymbol: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Peshawari Chappal Co.',
  logoUrl: '/logo.png',
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
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  });

  const updateSettings = (s: StoreSettings) => {
    setSettings(s);
    localStorage.setItem('psh_store_settings', JSON.stringify(s));
  };

  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || '$';

  const formatPrice = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[settings.currency] || '$';
    if (symbol === 'Rs.') {
      return `Rs. ${amount.toLocaleString()}`;
    }
    return `${symbol}${amount}`;
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, updateSettings, formatPrice, currencySymbol }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = (): StoreSettingsContextType => {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) throw new Error('useStoreSettings must be inside StoreSettingsProvider');
  return ctx;
};
