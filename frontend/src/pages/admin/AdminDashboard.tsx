import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Box, ShoppingBag, Users, Star, Tag, BarChart3, 
  MessageSquare, Settings, Bell, Search, ChevronDown, LogOut, Menu, X, 
  Layers, KeyRound, UserCog, Coins, Radio, Sun, Moon
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { DashboardTab } from './DashboardTab';
import { ProductsTab } from './ProductsTab';
import { CategoriesTab } from './CategoriesTab';
import { OrdersTab } from './OrdersTab';
import { CustomersTab } from './CustomersTab';
import { ReviewsTab } from './ReviewsTab';
import { PromoCodesTab } from './PromoCodesTab';
import { AnalyticsTab } from './AnalyticsTab';
import { MessagesTab } from './MessagesTab';
import { SettingsTab } from './SettingsTab';
import { InvestmentsTab } from './InvestmentsTab';
import { ManagersModal } from './ManagersModal';
import { ChangeCredentialsModal } from './ChangeCredentialsModal';
import { apiService } from '../../services/api';
import type { AdminNotification } from '../../types/admin';
import { SEOHelmet } from '../../components/common/SEOHelmet';

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'investments'
  | 'orders'
  | 'customers'
  | 'reviews'
  | 'promo-codes'
  | 'analytics'
  | 'messages'
  | 'settings';

const VALID_TABS: AdminTab[] = [
  'dashboard',
  'products',
  'categories',
  'investments',
  'orders',
  'customers',
  'reviews',
  'promo-codes',
  'analytics',
  'messages',
  'settings',
];

const HEADER_PRIMARY_TABS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Box },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'investments', label: 'Program', icon: Coins },
  { id: 'customers', label: 'Account', icon: Users },
  { id: 'analytics', label: 'Reports', icon: BarChart3 },
] as const;

const SIDEBAR_RAIL_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Box },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'investments', label: 'Program', icon: Coins },
  { id: 'customers', label: 'Account', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

const MORE_NAV_ITEMS = [
  { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
  { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
  { id: 'messages', label: 'Customer Inbox', icon: MessageSquare },
  { id: 'settings', label: 'Store Settings', icon: Settings },
] as const;

const getInitialTab = (): AdminTab => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab') as AdminTab;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) return tabFromUrl;
    const cached = localStorage.getItem('psh_admin_active_tab') as AdminTab;
    if (cached && VALID_TABS.includes(cached)) return cached;
  } catch {}
  return 'dashboard';
};

const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {}
};

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAdminAuth();
  const [activeTab, setActiveTabState] = useState<AdminTab>(getInitialTab);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('psh_admin_active_tab', tab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  // Dark Mode state with root class toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('psh_admin_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      try { localStorage.setItem('psh_admin_theme', 'dark'); } catch {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('psh_admin_theme', 'light'); } catch {}
    }
  }, [isDarkMode]);

  const currentRole = user?.role || 'staff';
  const isManager = currentRole === 'manager';

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const [liveOrderCount, setLiveOrderCount] = useState<number | null>(null);
  const [isLivePulse, setIsLivePulse] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const lastNotifIdRef = useRef<string | null>(null);

  // Manager is restricted to core operational tabs
  useEffect(() => {
    if (isManager && !['dashboard', 'products', 'categories', 'investments', 'orders', 'customers', 'reviews'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [isManager, activeTab]);

  const triggerLiveToast = (notif: AdminNotification) => {
    if (!notif || notif.id === lastNotifIdRef.current) return;
    lastNotifIdRef.current = notif.id;
    setLiveToast(notif);
    playNotificationChime();
    setTimeout(() => {
      setLiveToast(curr => (curr?.id === notif.id ? null : curr));
    }, 7000);
  };

  const loadNotifications = async () => {
    try {
      const list = await apiService.getNotifications();
      setNotifications(list || []);
    } catch {}
  };

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationsDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Real-time live notifications listening & polling
  useEffect(() => {
    loadNotifications();

    const handleNotifsChanged = (e: any) => {
      loadNotifications();
      if (e?.detail) triggerLiveToast(e.detail);
    };

    const handleOrdersChanged = () => loadNotifications();

    window.addEventListener('psh:notifications-changed', handleNotifsChanged);
    window.addEventListener('psh:orders-changed', handleOrdersChanged);

    let refreshTick = 0;
    const interval = setInterval(async () => {
      try {
        const list = await apiService.getNotifications();
        setNotifications(prev => {
          if (list.length > 0 && prev.length > 0) {
            const newest = list[0];
            const prevNewest = prev[0];
            if (newest && newest.id !== prevNewest?.id && !newest.read) {
              triggerLiveToast(newest);
            }
          }
          return list;
        });

        refreshTick++;
        if (refreshTick % 3 === 0) {
          window.dispatchEvent(new CustomEvent('psh:auto-refresh'));
          setIsLivePulse(true);
          setTimeout(() => setIsLivePulse(false), 800);
        }

        const orders = await apiService.getOrders();
        const queueCount = orders.filter(
          (o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled'
        ).length;
        setLiveOrderCount(queueCount);
      } catch {}
    }, 3000);

    return () => {
      window.removeEventListener('psh:notifications-changed', handleNotifsChanged);
      window.removeEventListener('psh:orders-changed', handleOrdersChanged);
      clearInterval(interval);
    };
  }, []);

  const handleMarkNotifRead = async (id: string) => {
    await apiService.markNotificationRead(id);
    loadNotifications();
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const isMoreActive = MORE_NAV_ITEMS.some(item => item.id === activeTab);

  return (
    <div className={`admin-shell min-h-screen ${isDarkMode ? 'dark' : ''} flex flex-col font-sans transition-colors duration-200 antialiased -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8`}>
      <SEOHelmet
        title="Admin Dashboard - KhyberSole"
        description="Official administrative control center for products, catalog, orders, and customer management."
      />

      {/* Floating Live Notification Toast */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-[99999] max-w-sm w-full admin-card p-4 rounded-2xl shadow-xl flex items-start gap-3 backdrop-blur-md"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5C39] to-[#E03A14] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-1 text-left">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF5C39]">Live Alert</span>
                <span className="text-[10px] text-zinc-400">{liveToast.timestamp || 'Just now'}</span>
              </div>
              <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate mt-0.5">{liveToast.title}</h5>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-snug">{liveToast.description}</p>
              {liveToast.link && (
                <button
                  onClick={() => {
                    if (liveToast.link?.includes('orders')) setActiveTab('orders');
                    else if (liveToast.link?.includes('products')) setActiveTab('products');
                    else if (liveToast.link?.includes('reviews')) setActiveTab('reviews');
                    else if (liveToast.link?.includes('messages')) setActiveTab('messages');
                    handleMarkNotifRead(liveToast.id);
                    setLiveToast(null);
                  }}
                  className="mt-2 text-[11px] font-bold text-[#FF5C39] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View in Portal →
                </button>
              )}
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header Navigation Bar (Reference V14 Style) ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-6 py-2.5 transition-colors shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">

          {/* Left: Brand Icon + Title */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Orange Gradient Brand Icon */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF5C39] to-[#E03A14] flex items-center justify-center text-white font-black text-sm shadow-sm shadow-orange-500/20">
              V
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                KhyberSole
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Radio className={`w-3 h-3 text-emerald-500 ${isLivePulse ? 'scale-125' : ''} transition-transform`} />
                <span>Live</span>
              </span>
            </div>
          </div>

          {/* Center: Floating Pill Navigation Tabs (Reference Video V14 Slider) */}
          <nav className="hidden lg:flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-full p-1 border border-zinc-200/60 dark:border-zinc-700/60 relative shadow-2xs">
            {HEADER_PRIMARY_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const showBadge = tab.id === 'orders' && liveOrderCount !== null && liveOrderCount > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 z-10 ${
                    isActive
                      ? 'text-white dark:text-zinc-900 font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {/* Framer Motion Sliding Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="headerActiveTabPill"
                      className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-full shadow-xs -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span>{tab.label}</span>
                  {showBadge && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {liveOrderCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* "More" Menu Pill Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setShowMoreMenu(prev => !prev)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 z-10 ${
                  isMoreActive
                    ? 'text-white dark:text-zinc-900 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {isMoreActive && (
                  <motion.div
                    layoutId="headerActiveTabPill"
                    className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-full shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span>More</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Store Modules
                  </span>
                  {MORE_NAV_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isItemActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as AdminTab);
                          setShowMoreMenu(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer text-left ${
                          isItemActive
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Utilities: Search, Notifications, User Chip */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Input Box */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search store..."
                className="w-36 lg:w-48 pl-8 pr-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
              />
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5C39] ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                      Live Store Notifications
                    </h4>
                    {unreadNotifCount > 0 && (
                      <span className="text-[10px] bg-[#FF5C39] text-white font-bold px-2 py-0.5 rounded-full">
                        {unreadNotifCount} unread
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {notifications.slice(0, 8).map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkNotifRead(notif.id)}
                        className={`py-2.5 px-2 rounded-xl transition-colors cursor-pointer ${
                          !notif.read ? 'bg-orange-50/50 dark:bg-orange-950/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#FF5C39] uppercase">
                            {notif.type || 'Notice'}
                          </span>
                          <span className="text-[10px] text-zinc-400">{notif.timestamp || 'Recent'}</span>
                        </div>
                        <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mt-0.5">{notif.title}</h5>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-snug">{notif.description}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        No notifications at this time.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Chip (Reference V14 Style) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs cursor-pointer border border-zinc-200/60 dark:border-zinc-700/60"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 text-white font-bold flex items-center justify-center text-xs">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs leading-none">
                    {user?.username || 'Admin'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                    {currentRole}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 space-y-1 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                  <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-sm">
                      {user?.username || 'Admin User'}
                    </span>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wide">
                      {currentRole === 'superadmin' ? 'Super Admin (Full)' : 'Manager'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowCredentialsModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-zinc-500" />
                    <span>Change Password</span>
                  </button>

                  {currentRole === 'superadmin' && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowManagersModal(true);
                      }}
                      className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <UserCog className="w-4 h-4 text-zinc-500" />
                      <span>Manage Managers</span>
                    </button>
                  )}

                  <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                    <button
                      onClick={() => logout()}
                      className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Horizontal Navigation Pills */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-1 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto">
            {HEADER_PRIMARY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {MORE_NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as AdminTab);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Main Layout: Slim Vertical Rail (Sidebar) + Content Canvas ── */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">

        {/* ── Left Slim Vertical Rail (Reference V14 Style) ── */}
        <aside className="hidden lg:flex w-16 shrink-0 flex-col items-center justify-between py-5 border-r border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
          
          {/* Top: Sun / Moon Mode Toggle Pill (Reference Frame 01 & 05) */}
          <div className="flex flex-col items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 border border-zinc-200/80 dark:border-zinc-700/80 relative shadow-2xs">
            {/* Sun Button */}
            <button
              onClick={() => setIsDarkMode(false)}
              title="Light Mode"
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer z-10 ${
                !isDarkMode ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {!isDarkMode && (
                <motion.div
                  layoutId="railThemePill"
                  className="absolute inset-0 bg-white rounded-full shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Sun className="w-4 h-4 text-amber-500" />
            </button>

            {/* Moon Button */}
            <button
              onClick={() => setIsDarkMode(true)}
              title="Dark Mode"
              className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer z-10 ${
                isDarkMode ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {isDarkMode && (
                <motion.div
                  layoutId="railThemePill"
                  className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-full shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <Moon className={`w-4 h-4 ${isDarkMode ? 'text-zinc-900' : 'text-zinc-400'}`} />
            </button>
          </div>

          {/* Middle: Floating Icon Dock */}
          <div className="flex flex-col items-center bg-zinc-100/80 dark:bg-zinc-800/80 rounded-2xl p-1.5 border border-zinc-200/80 dark:border-zinc-700/80 gap-1.5 shadow-2xs">
            {SIDEBAR_RAIL_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'orders' && liveOrderCount !== null && liveOrderCount > 0;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  title={item.label}
                  className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer z-10 ${
                    isActive
                      ? 'text-white dark:text-zinc-900'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="railActivePill"
                      className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl shadow-xs -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                      {liveOrderCount}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Bottom: Managers & Logout */}
          <div className="flex flex-col items-center gap-1.5">
            {currentRole === 'superadmin' && (
              <button
                onClick={() => setShowManagersModal(true)}
                title="Manage Store Managers"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <UserCog className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ── Main Canvas (Render Actual Store Data with Smooth Framer Motion Reveals) ── */}
        <main className="flex-1 p-4 sm:p-7 overflow-x-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full"
            >
              {activeTab === 'dashboard' && <DashboardTab onNavigateTab={t => setActiveTab(t as AdminTab)} />}
              {activeTab === 'products' && <ProductsTab />}
              {activeTab === 'categories' && <CategoriesTab />}
              {activeTab === 'investments' && <InvestmentsTab onNavigateTab={t => setActiveTab(t as AdminTab)} />}
              {activeTab === 'orders' && <OrdersTab />}
              {activeTab === 'customers' && <CustomersTab />}
              {activeTab === 'reviews' && <ReviewsTab />}
              {activeTab === 'promo-codes' && <PromoCodesTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'messages' && <MessagesTab />}
              {activeTab === 'settings' && <SettingsTab currentRole={currentRole} onRoleChange={() => {}} />}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Modals */}
      <ManagersModal
        isOpen={showManagersModal}
        onClose={() => setShowManagersModal(false)}
      />

      <ChangeCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
      />
    </div>
  );
};
