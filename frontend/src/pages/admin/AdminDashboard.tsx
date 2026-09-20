import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Box, ShoppingBag, Users, Star, Tag, BarChart3, 
  MessageSquare, Settings, Bell, Search, ShieldCheck, ChevronDown, LogOut, Menu, X, Layers, KeyRound, UserCog, Coins
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

type AdminTab =
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

const getInitialTab = (): AdminTab => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab') as AdminTab;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) return tabFromUrl;
    const saved = localStorage.getItem('psh_admin_active_tab') as AdminTab;
    if (saved && VALID_TABS.includes(saved)) return saved;
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

  const [currentRole, setCurrentRole] = useState<'superadmin' | 'manager' | 'staff'>(user?.role || 'staff');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<AdminNotification | null>(null);
  const [liveOrderCount, setLiveOrderCount] = useState<number | null>(null);
  const [isLivePulse, setIsLivePulse] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const lastNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user?.role]);

  const isManager = currentRole === 'manager';

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
    const list = await apiService.getNotifications();
    setNotifications(list);
  };

  // Click outside to dismiss notification or profile dropdowns
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

  // Real-time live notifications listening & polling
  useEffect(() => {
    loadNotifications();

    const handleNotifsChanged = (e: any) => {
      loadNotifications();
      if (e?.detail) {
        triggerLiveToast(e.detail);
      }
    };

    const handleOrdersChanged = () => {
      loadNotifications();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'psh_notifications' || e.key === 'psh_orders') {
        loadNotifications();
      }
    };

    window.addEventListener('psh:notifications-changed', handleNotifsChanged);
    window.addEventListener('psh:orders-changed', handleOrdersChanged);
    window.addEventListener('storage', handleStorage);

    // Live background polling every 3 seconds to catch external orders/notifications in real-time
    // Every 10 seconds also broadcast psh:auto-refresh so all tabs can reload their data
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
        // Every ~10 seconds (3 ticks × 3s = 9s) broadcast auto-refresh to all tabs
        refreshTick++;
        if (refreshTick % 3 === 0) {
          window.dispatchEvent(new CustomEvent('psh:auto-refresh'));
          setIsLivePulse(true);
          setTimeout(() => setIsLivePulse(false), 800);
        }
        // Fetch live order queue count for sidebar badge
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
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Auto-close mobile sidebar when tab changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeTab]);

  const handleMarkNotifRead = async (id: string) => {
    await apiService.markNotificationRead(id);
    loadNotifications();
  };

  const handleClearAllNotifs = async () => {
    await apiService.clearAllNotifications();
    loadNotifications();
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const allSidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Product Catalog', icon: Box },
    { id: 'categories', label: 'Categories Catalog', icon: Layers },
    { id: 'investments', label: 'Packaging & Investments', icon: Coins },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'customers', label: 'Buyer Directory', icon: Users },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
    { id: 'analytics', label: 'Marketing & Analytics', icon: BarChart3 },
    { id: 'messages', label: 'Support Inbox', icon: MessageSquare },
    { id: 'settings', label: 'Settings & Roles', icon: Settings },
  ] as const;

  // Filter out restricted items if user is manager
  const sidebarNavItems = isManager
    ? allSidebarNavItems.filter(item => ['dashboard', 'products', 'categories', 'investments', 'orders', 'customers', 'reviews'].includes(item.id))
    : allSidebarNavItems;

  // Shared sidebar nav content rendered in both mobile overlay and desktop panel
  const SidebarContent = () => (
    <nav className="space-y-1">
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {isManager ? 'Manager Portal' : 'Main Management'}
        </span>
        {isManager && (
          <span className="text-[9px] bg-amber-500/10 text-amber-600 font-bold px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">
            Restricted
          </span>
        )}
      </div>
      {sidebarNavItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const showQueueBadge = item.id === 'orders' && liveOrderCount !== null && liveOrderCount > 0;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <span className="flex-1">{item.label}</span>
            {showQueueBadge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                isActive ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'
              }`}>
                {liveOrderCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8 relative">
      <SEOHelmet
        title="Admin Control Center"
        description="Protected administration portal for Peshawari Chappal products, categories catalog, order tracking, and reviews."
      />

      {/* Floating Real-Time Live Notification Pop-Up Toast */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-[99999] max-w-sm w-full bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">Live Alert</span>
              <span className="text-[10px] text-slate-400">{liveToast.timestamp || 'Just now'}</span>
            </div>
            <h5 className="font-bold text-xs text-white truncate mt-0.5">{liveToast.title}</h5>
            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">{liveToast.description}</p>
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
                className="mt-2 text-[11px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                View in Portal →
              </button>
            )}
          </div>
          <button
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-xs">

        {/* Left: Hamburger (mobile) + Brand */}
        <div className="flex items-center gap-3">
          {/* ☰ Hamburger — mobile only */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="font-serif text-xl font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">P</span>
            <span>Peshawari</span>
            <span className="text-xs font-sans text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-widest font-semibold hidden sm:inline">Admin Hub</span>
            {/* LIVE indicator */}
            <span className={`hidden lg:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest transition-all duration-300 ${
              isLivePulse
                ? 'bg-emerald-100 text-emerald-700 border-emerald-400 scale-105'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${
                isLivePulse ? 'animate-ping' : 'animate-pulse'
              }`} />
              Live
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Role:</span>
            <span className="uppercase text-blue-600">{currentRole}</span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden sm:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search orders, customers, SKUs, promo codes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-3">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-sm text-slate-900">Live Admin Notifications</h4>
                    {unreadNotifCount > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                        {unreadNotifCount} unread
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifs}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-700">All caught up!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                        Real-time alerts will appear here as orders, reviews, and stock changes occur.
                      </p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotifRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          !n.read ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Manager Button (Superadmin Only) */}
          {currentRole === 'superadmin' && (
            <button
              onClick={() => setShowManagersModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 hover:bg-amber-500/20 text-xs font-bold transition-all shadow-xs"
              title="Add or remove managers"
            >
              <UserCog className="w-4 h-4 text-amber-600" />
              <span>Team & Managers</span>
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center font-serif">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <span className="font-bold text-slate-900 block leading-none">
                  {user?.username || 'Admin'}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  {currentRole === 'superadmin' ? 'Super Admin' : currentRole === 'manager' ? 'Store Manager' : currentRole}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 space-y-1 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block text-sm">{user?.username || 'Admin User'}</span>
                  <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">
                    {currentRole === 'superadmin' ? 'Super Admin (Full Access)' : currentRole === 'manager' ? 'Store Manager (Restricted)' : currentRole}
                  </span>
                </div>

                {/* Change Credentials */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowCredentialsModal(true);
                  }}
                  className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Change Username / Password</span>
                </button>

                {/* Manage Team (Superadmin only) */}
                {currentRole === 'superadmin' && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowManagersModal(true);
                    }}
                    className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserCog className="w-4 h-4 text-blue-600" />
                    <span>Manage Store Managers</span>
                  </button>
                )}

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => logout()}
                    className="w-full text-left p-2 rounded-xl flex items-center gap-2.5 font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row">

        {/* ── Mobile Sidebar Overlay (slides in from left) ── */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Semi-transparent backdrop — tap to close */}
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Slide-in panel */}
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-5 overflow-y-auto flex flex-col gap-4 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">P</span>
                  <span className="font-serif font-bold text-slate-900">Admin Panel</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* ── Desktop Persistent Sidebar ── */}
        <aside className="hidden md:block w-64 bg-white border-r border-slate-200 p-4 shrink-0 sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto">
          <SidebarContent />
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardTab onNavigateTab={(t: any) => setActiveTab(t)} />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'investments' && <InvestmentsTab onNavigateTab={(t: any) => setActiveTab(t)} />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'promo-codes' && <PromoCodesTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'settings' && <SettingsTab currentRole={currentRole} onRoleChange={r => setCurrentRole(r)} />}
        </main>

      </div>

      {/* Superadmin Managers Management Modal */}
      <ManagersModal
        isOpen={showManagersModal}
        onClose={() => setShowManagersModal(false)}
      />

      {/* Admin / Manager Credentials Modal */}
      <ChangeCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
      />
    </div>
  );
};
