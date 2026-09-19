import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Box, ShoppingBag, Users, Star, Tag, BarChart3, 
  MessageSquare, Settings, Bell, Search, ShieldCheck, ChevronDown, LogOut, Menu, X, Layers, KeyRound, UserCog
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
import { ManagersModal } from './ManagersModal';
import { ChangeCredentialsModal } from './ChangeCredentialsModal';
import { apiService } from '../../services/api';
import type { AdminNotification } from '../../types/admin';
import { SEOHelmet } from '../../components/common/SEOHelmet';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'reviews' | 'promo-codes' | 'analytics' | 'messages' | 'settings'
  >('dashboard');

  const [currentRole, setCurrentRole] = useState<'superadmin' | 'manager' | 'staff'>(user?.role || 'staff');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showManagersModal, setShowManagersModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user?.role]);

  const isManager = currentRole === 'manager';

  // Manager is restricted to only: dashboard, products, orders, customers, reviews
  useEffect(() => {
    if (isManager && !['dashboard', 'products', 'orders', 'customers', 'reviews'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [isManager, activeTab]);

  useEffect(() => {
    loadNotifications();
    const handleNotifsChanged = () => loadNotifications();
    window.addEventListener('psh:notifications-changed', handleNotifsChanged);
    return () => window.removeEventListener('psh:notifications-changed', handleNotifsChanged);
  }, []);

  // Auto-close mobile sidebar when tab changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeTab]);

  const loadNotifications = async () => {
    const list = await apiService.getNotifications();
    setNotifications(list);
  };

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
    ? allSidebarNavItems.filter(item => ['dashboard', 'products', 'orders', 'customers', 'reviews'].includes(item.id))
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
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 sm:-my-8">
      <SEOHelmet
        title="Admin Control Center"
        description="Protected administration portal for Peshawari Chappal products, categories catalog, order tracking, and reviews."
      />

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
          <div className="relative">
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
          <div className="relative">
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
