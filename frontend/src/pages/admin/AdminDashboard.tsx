import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Box, ShoppingBag, Users, Star, Tag, BarChart3, 
  MessageSquare, Settings, Bell, Search, ShieldCheck, ChevronDown, Check, LogOut, Menu, X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { DashboardTab } from './DashboardTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { CustomersTab } from './CustomersTab';
import { ReviewsTab } from './ReviewsTab';
import { PromoCodesTab } from './PromoCodesTab';
import { AnalyticsTab } from './AnalyticsTab';
import { MessagesTab } from './MessagesTab';
import { SettingsTab } from './SettingsTab';
import { apiService } from '../../services/api';
import type { AdminNotification } from '../../types/admin';
import { SEOHelmet } from '../../components/common/SEOHelmet';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'orders' | 'customers' | 'reviews' | 'promo-codes' | 'analytics' | 'messages' | 'settings'
  >('dashboard');

  const [currentRole, setCurrentRole] = useState<'superadmin' | 'staff'>(user?.role || 'staff');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
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

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Product Catalog', icon: Box },
    { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
    { id: 'analytics', label: 'Marketing & Analytics', icon: BarChart3 },
    { id: 'messages', label: 'Support Inbox', icon: MessageSquare },
    { id: 'settings', label: 'Settings & Roles', icon: Settings },
  ] as const;

  // Shared sidebar nav content rendered in both mobile overlay and desktop panel
  const SidebarContent = () => (
    <nav className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 block mb-2">
        Main Management
      </span>
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
        description="Protected administration portal for Peshawari Chappal products, 3D pipelines, order tracking, and reviews."
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
                  <h4 className="font-serif font-bold text-sm text-slate-900">Live Admin Notifications</h4>
                  <span className="text-[10px] text-blue-600 font-bold">{unreadNotifCount} unread</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
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
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center font-serif">A</div>
              <div className="hidden md:block text-left">
                <span className="font-bold text-slate-900 block leading-none">Admin Operations</span>
                <span className="text-[10px] text-slate-500 uppercase">{currentRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 space-y-1 text-xs z-50">
                <div className="p-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 block">Admin Account</span>
                  <span className="text-[10px] text-slate-400 uppercase">{currentRole}</span>
                </div>
                <button className="w-full text-left p-2 rounded-xl flex items-center justify-between font-semibold bg-blue-50 text-blue-600">
                  <span>{currentRole === 'superadmin' ? 'Super Admin' : 'Staff Member'}</span>
                  <Check className="w-4 h-4 text-blue-600" />
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => logout()}
                    className="w-full text-left p-2 rounded-xl flex items-center gap-2 font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
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
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'promo-codes' && <PromoCodesTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'settings' && <SettingsTab currentRole={currentRole} onRoleChange={r => setCurrentRole(r)} />}
        </main>

      </div>
    </div>
  );
};
