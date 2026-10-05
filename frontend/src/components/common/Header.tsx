import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, Menu, X, Home, Grid, Ruler, Truck, Info, Tag, Mail, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { apiService } from '../../services/api';
import { normalizeAssetUrl } from '../../utils/assetUrl';
import type { PromoCode } from '../../types/admin';

export const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePromos, setActivePromos] = useState<PromoCode[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu and search on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    apiService.getPromoCodes().then(list => {
      setActivePromos(list.filter(p => p.active));
    });
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const productsLabel = settings.hideCategories ? 'Products' : 'Catalog';

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: productsLabel, icon: Grid },
    { to: '/size-finder', label: 'Size Finder', icon: Ruler },
    { to: '/outfit-match', label: 'AI Outfit', icon: Sparkles, badge: 'AI' },
    { to: '/about', label: 'Heritage', icon: Info },
    { to: '/contact', label: 'Contact', icon: Mail },
    { to: '/orders', label: 'Track Order', icon: Truck },
  ];

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navigation Bar — Ultra-Refined Frosted Glass Header */}
      <header className="glass-header transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center group shrink-0" aria-label="Home">
            {settings.logoUrl ? (
              <img
                src={normalizeAssetUrl(settings.logoUrl)}
                alt={settings.storeName || 'Store Logo'}
                className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[220px] object-contain group-hover:scale-105 transition-all"
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md shadow-blue-500/20 border border-white/40 group-hover:scale-105 transition-all">
                  <span className="font-serif text-white font-bold text-xl">P</span>
                </div>
                <div>
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-slate-900 uppercase block">
                    Peshawari <span className="text-blue-600 text-xs tracking-widest font-sans font-bold uppercase">Store</span>
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop Main Navigation — Sculpted Frosted Glass Capsule (Clear Contrast from Outer Header) */}
          <div className="relative hidden lg:flex items-center">
            <nav className="glass-nav-capsule relative flex items-center gap-1 xl:gap-1.5 p-1.5">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                {productsLabel}
              </NavLink>
              <NavLink
                to="/size-finder"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                Size Finder
              </NavLink>
              <NavLink
                to="/outfit-match"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Outfit
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                Heritage
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                Contact
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-xs xl:text-[13px] tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
                    isActive ? 'glass-pill-active' : 'glass-pill-idle'
                  }`
                }
              >
                <Truck className="w-3.5 h-3.5" /> Track Order
              </NavLink>
            </nav>
          </div>

          {/* Action Controls: Full Search Bar (Desktop), Search Icon (Mobile), Bag, Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Full Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex items-center relative"
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chappals, models..."
                  className="w-44 xl:w-64 pl-9 pr-8 py-2 rounded-full text-xs bg-slate-100/90 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Mobile Search Icon Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className={`lg:hidden p-2 sm:p-2.5 rounded-full backdrop-blur-md transition-all border shadow-xs flex items-center justify-center cursor-pointer ${
                mobileSearchOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
                  : 'bg-white/75 hover:bg-white border-slate-200/90 text-slate-700 hover:shadow-sm'
              }`}
              aria-label="Search"
              title="Search products"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Shopping Bag Simple Icon (No text, transparent/glass background) */}
            <Link
              to="/bag"
              className="relative p-2 sm:p-2.5 rounded-full backdrop-blur-md bg-white/75 hover:bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 transition-all shadow-xs flex items-center justify-center cursor-pointer hover:shadow-sm"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] sm:text-[10px] font-black min-w-[17px] h-[17px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Toggle Button (3 lines) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 sm:p-2.5 rounded-full backdrop-blur-md bg-white/75 hover:bg-white border border-slate-200/90 transition-all text-slate-700 shadow-xs flex items-center justify-center cursor-pointer hover:shadow-sm"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Dropdown */}
        {mobileSearchOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-md animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chappals, sizes, models..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs bg-slate-100 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="btn-copper text-xs py-2.5 px-4 shrink-0 rounded-xl"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Right-Side Slide-Over Drawer Navigation (Mounted on document.body to prevent backdrop-filter clipping) */}
      {typeof document !== 'undefined' && mobileMenuOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] lg:hidden transition-all duration-300 opacity-100 pointer-events-auto visible"
        >
          {/* Smooth Backdrop Overlay */}
          <div
            className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Right-Side Drawer Panel */}
          <div
            className={`fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white border-l border-sky-200 shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header with Close Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
              <div className="flex items-center gap-2.5">
                {settings.logoUrl ? (
                  <img
                    src={normalizeAssetUrl(settings.logoUrl)}
                    alt={settings.storeName || 'Store Logo'}
                    className="h-8 w-auto max-w-[140px] object-contain"
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md text-white font-serif font-bold text-sm">
                      P
                    </div>
                    <div>
                      <span className="font-serif font-bold text-slate-900 text-sm uppercase tracking-wider block">
                        Navigation
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold tracking-widest uppercase">
                        {settings.storeName || 'Peshawari Store'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-4 pb-2 border-b border-sky-50">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search products..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 outline-none"
                />
              </form>
            </div>

            {/* Navigation Links in Drawer (Home, Products, Size Finder, AI Outfit, Orders, Heritage) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-sky-50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-sky-100 text-blue-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Drawer Footer Info */}
            <div className="p-4 border-t border-sky-100 bg-sky-50/60 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Peshawari Handcrafted Store</p>
              <p className="text-[11px] text-slate-400">Bazaar-e-Kissa Khwani, Peshawar</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Active Promo Codes Scrolling Ticker (Right to Left Marquee Below Navbar) */}
      {activePromos.length > 0 && (
        <div className="bg-blue-900 text-white py-1.5 overflow-hidden border-b border-blue-800 shadow-inner flex items-center relative">
          <div className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-blue-950 to-transparent w-8 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-blue-950 to-transparent w-8 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-12 font-sans text-xs font-semibold uppercase tracking-widest shrink-0">
            {/* Duplicated list for seamless continuous infinite loop */}
            {[...activePromos, ...activePromos, ...activePromos, ...activePromos].map((promo, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-bold">Use Code: <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">{promo.code}</span></span>
                <span className="text-blue-200">
                  ({promo.discountType === 'percentage' ? `${promo.value}% OFF` : `Rs. ${promo.value} OFF`}
                  {promo.minOrderValue > 0 ? ` on orders over Rs. ${promo.minOrderValue}` : ''})
                </span>
                <span className="text-blue-400 mx-2">•</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

