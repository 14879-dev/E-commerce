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

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'orders' | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'DASHBOARD & ANALYTICS',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics & Revenue', icon: BarChart3 },
    ],
  },
  {
    title: 'STORE CATALOG & SALES',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: 'orders' },
      { id: 'products', label: 'Products & Stock', icon: Box },
      { id: 'categories', label: 'Categories', icon: Layers },
      { id: 'customers', label: 'Customers', icon: Users },
    ],
  },
  {
    title: 'OPERATIONS & MARKETING',
    items: [
      { id: 'investments', label: 'Supplier Investments', icon: Coins },
      { id: 'reviews', label: 'Reviews & Feedback', icon: Star },
      { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
      { id: 'messages', label: 'Messages & Support', icon: MessageSquare },
    ],
  },
  {
    title: 'SYSTEM CONFIG',
    items: [
      { id: 'settings', label: 'Store Settings', icon: Settings },
    ],
  },
];

const TAB_TITLES: Record<AdminTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Overview', subtitle: 'Live business performance & fulfillment pipeline' },
  analytics: { title: 'Analytics & Reports', subtitle: 'Sales trajectory, financial breakdowns & customer metrics' },
  orders: { title: 'Customer Orders', subtitle: 'Live order queue, status updates and dispatch processing' },
  products: { title: 'Products & Inventory', subtitle: 'Footwear catalog, leather variants and stock levels' },
  categories: { title: 'Store Categories', subtitle: 'Collection organization and category management' },
  customers: { title: 'Customer Directory', subtitle: 'Customer purchase history and registered accounts' },
  investments: { title: 'Supplier Investments', subtitle: 'Procurement capital, luxury packaging and ad budgets' },
  reviews: { title: 'Customer Reviews', subtitle: 'Review moderation, 5-star ratings and testimonials' },
  'promo-codes': { title: 'Promo Codes & Discounts', subtitle: 'Vouchers, coupons, and seasonal sales codes' },
  messages: { title: 'Inquiries & Support', subtitle: 'Customer inquiries, WhatsApp leads and support threads' },
  settings: { title: 'Store Settings', subtitle: 'Store configuration, operational policies and access controls' },
};

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
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

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
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const [liveOrderCount, setLiveOrderCount] = useState<number | null>(null);
  const [isLivePulse, setIsLivePulse] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
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
      setLiveToast((curr: AdminNotification | null) => (curr?.id === notif.id ? null : curr));
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Poll for live store notifications & order count
  useEffect(() => {
    loadNotifications();

    const fetchOrders = async () => {
      try {
        const orders = await apiService.getOrders();
        if (Array.isArray(orders)) {
          setLiveOrderCount(orders.length);
        }
      } catch {}
    };
    fetchOrders();

    const pollInterval = setInterval(() => {
      loadNotifications();
      fetchOrders();
      setIsLivePulse(prev => !prev);
      window.dispatchEvent(new CustomEvent('psh:auto-refresh'));
    }, 9000);

    const handleExternalOrder = () => {
      loadNotifications();
      fetchOrders();
    };
    window.addEventListener('psh:order-placed', handleExternalOrder);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('psh:order-placed', handleExternalOrder);
    };
  }, []);

  // Trigger toast on new unread notification
  useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      const latest = unread[0];
      if (latest && latest.id !== lastNotifIdRef.current) {
        triggerLiveToast(latest);
      }
    }
  }, [notifications]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleClearAllNotifs = async () => {
    try {
      await apiService.clearAllNotifications();
      setNotifications([]);
    } catch {}
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Render navigation links list (supports both collapsed icon-rail and expanded hover mode)
  const renderNavList = (isExpanded: boolean) => (
    <div className="space-y-4">
      {NAV_SECTIONS.map((section) => {
        // Filter out restricted items for managers
        const visibleItems = section.items.filter(item => {
          if (isManager && !['dashboard', 'products', 'categories', 'investments', 'orders', 'customers', 'reviews'].includes(item.id)) {
            return false;
          }
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={section.title} className="space-y-1">
            {/* Section title visible only when expanded; clean divider when collapsed */}
            {isExpanded ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3 block transition-opacity duration-200 whitespace-nowrap">
                {section.title}
              </span>
            ) : (
              <div className="w-6 h-px bg-zinc-200/80 dark:border-zinc-800 mx-auto my-1.5" />
            )}

            <div className="space-y-1 pt-0.5">
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showBadge = item.badge === 'orders' && liveOrderCount !== null && liveOrderCount > 0;

                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05, x: isExpanded ? 3 : 0 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    title={!isExpanded ? item.label : undefined}
                    className={`relative rounded-xl text-xs font-semibold flex items-center transition-colors cursor-pointer z-10 ${
                      isExpanded 
                        ? 'w-full px-3 py-2 justify-between text-left' 
                        : 'w-10 h-10 mx-auto justify-center'
                    } ${
                      isActive
                        ? 'text-white dark:text-zinc-900 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    {/* Active sliding pill */}
                    {isActive && (
                      <motion.div
                        layoutId="fixedSidebarActivePill"
                        className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
                      {isExpanded && (
                        <span className="truncate whitespace-nowrap transition-opacity duration-200">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {showBadge && (
                      isExpanded ? (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          isActive 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                        }`}>
                          {liveOrderCount}
                        </span>
                      ) : (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                          {liveOrderCount}
                        </span>
                      )
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="admin-shell min-h-screen bg-[#F8F9FA] dark:bg-[#0E0E10] text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-200">
      <SEOHelmet 
        title={`Admin - ${TAB_TITLES[activeTab].title} | KhyberSole`} 
        description="KhyberSole Executive Store Administration Portal" 
      />

      {/* ── Live Toast Notification ── */}
      <AnimatePresence>
        {liveToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                {liveToast.title}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                {liveToast.description}
              </p>
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

      {/* ── Hover Sidebar with Icons (Desktop) ── */}
      <aside 
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`hidden lg:flex fixed left-0 top-0 bottom-0 z-50 bg-white dark:bg-zinc-900 border-r border-zinc-200/80 dark:border-zinc-800 flex-col justify-between py-4 transition-all duration-300 ease-in-out ${
          isSidebarHovered ? 'w-64 px-4 shadow-2xl' : 'w-16 px-2.5 shadow-sm'
        }`}
      >
        {/* Top: Brand & Theme Toggle */}
        <div className="space-y-4">
          {/* Brand Header */}
          <div className={`flex items-center ${isSidebarHovered ? 'justify-between px-2' : 'justify-center'} transition-all`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF5C39] to-[#E03A14] flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20 shrink-0">
                V
              </div>
              {isSidebarHovered && (
                <div className="min-w-0">
                  <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 block leading-tight truncate">
                    KhyberSole
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block leading-tight font-medium truncate">
                    {currentRole === 'superadmin' ? 'Super Admin' : 'Manager'}
                  </span>
                </div>
              )}
            </div>

            {isSidebarHovered && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <Radio className={`w-2.5 h-2.5 text-emerald-500 ${isLivePulse ? 'scale-125' : ''} transition-transform`} />
                Live
              </span>
            )}
          </div>

          {/* Theme Switcher (Mini button when collapsed, full segment switcher when hovered) */}
          {isSidebarHovered ? (
            <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-1 border border-zinc-200/80 dark:border-zinc-700/80 animate-in fade-in duration-150">
              <button
                onClick={() => setIsDarkMode(false)}
                className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10 ${
                  !isDarkMode ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {!isDarkMode && (
                  <motion.div
                    layoutId="sidebarThemePill"
                    className="absolute inset-0 bg-white rounded-lg shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                onClick={() => setIsDarkMode(true)}
                className={`relative flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10 ${
                  isDarkMode ? 'text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isDarkMode && (
                  <motion.div
                    layoutId="sidebarThemePill"
                    className="absolute inset-0 bg-zinc-900 rounded-lg shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-10 h-10 mx-auto rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-700/80"
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          )}

          {/* All Page Navigation Links */}
          <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-0.5">
            {renderNavList(isSidebarHovered)}
          </div>
        </div>

        {/* Bottom User Profile & Sign Out */}
        <div className="pt-3 border-t border-zinc-200/70 dark:border-zinc-800">
          {isSidebarHovered ? (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center shrink-0">
                    {(user?.username || 'A')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                      {user?.username || 'Admin'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {currentRole}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCredentialsModal(true)}
                  title="Change Password"
                  className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
              </div>

              {currentRole === 'superadmin' && (
                <button
                  onClick={() => setShowManagersModal(true)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-2 transition-colors cursor-pointer text-left"
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Manage Store Managers</span>
                </button>
              )}

              <button
                onClick={() => logout()}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setShowCredentialsModal(true)}
                title={`User: ${user?.username || 'Admin'} (${currentRole}) - Click to Change Password`}
                className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform"
              >
                {(user?.username || 'A')[0].toUpperCase()}
              </button>

              <button
                onClick={() => logout()}
                title="Sign Out"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer (Mobile Screens) ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 z-50 lg:hidden flex flex-col justify-between p-5 overflow-y-auto shadow-2xl"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5C39] to-[#E03A14] flex items-center justify-center text-white font-black text-xs">
                      V
                    </div>
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      KhyberSole Admin
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {renderNavList(true)}
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => logout()}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Layout: Offset with lg:pl-16 for Slim Hover Icon Sidebar ── */}
      <div className="lg:pl-16 flex flex-col min-h-screen min-w-0 transition-all">

        {/* ── Top Header Bar (No page nav tabs - clean executive bar) ── */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 transition-colors">
          
          {/* Left: Mobile Toggle + Active Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  {TAB_TITLES[activeTab].title}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 hidden sm:block">
                {TAB_TITLES[activeTab].subtitle}
              </p>
            </div>
          </div>

          {/* Right Utilities: Search, Notifications, User Chip */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input Box */}
            <div className="hidden sm:flex items-center relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                placeholder="Search portal..."
                className="w-36 md:w-52 pl-8 pr-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all"
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

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-6 text-center">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.link?.includes('orders')) setActiveTab('orders');
                            else if (n.link?.includes('products')) setActiveTab('products');
                            else if (n.link?.includes('reviews')) setActiveTab('reviews');
                            else if (n.link?.includes('messages')) setActiveTab('messages');
                            handleMarkNotifRead(n.id);
                            setShowNotificationsDropdown(false);
                          }}
                          className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                            !n.read
                              ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/70 dark:border-orange-800/50'
                              : 'bg-zinc-50 dark:bg-zinc-800/40 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-300 text-[11px] mt-0.5 line-clamp-2">
                            {n.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <button
                        onClick={handleClearAllNotifs}
                        className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu Trigger */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-700/80"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
                  {(user?.username || 'A')[0].toUpperCase()}
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

        </header>

        {/* ── Main Canvas (All 11 pages render smoothly with Framer Motion) ── */}
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
