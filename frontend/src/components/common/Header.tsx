import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, Menu, X, Home, Grid, Ruler, Truck, Info, Tag, Mail, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { apiService } from '../../services/api';
import { normalizeAssetUrl } from '../../utils/assetUrl';
import type { PromoCode } from '../../types/admin';

// Leopards Courier official logo
export const LeopardCourierIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-auto object-contain shrink-0' }) => (
  <img
    src="/leopards-logo.png"
    alt="Leopards Courier"
    className={`object-contain shrink-0 ${className}`}
    style={{ maxHeight: '18px', maxWidth: '48px' }}
    loading="eager"
  />
);

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
            <img
              src={normalizeAssetUrl(settings.logoUrl) || '/uploads/asset_1790946826902.png'}
              alt={settings.storeName || 'Store Logo'}
              className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[220px] object-contain group-hover:scale-105 transition-all"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/logo.png')) {
                  target.src = '/logo.png';
                }
              }}
            />
          </Link>

          {/* Desktop Main Navigation — Transparent with Smoky Black Text and Leopard Courier Icon for Track Order */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((item) => {
              const isTrackOrder = item.to === '/orders';
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 py-1 text-xs xl:text-[13px] tracking-wide font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'text-[#1A1A18] border-b-2 border-[#1A1A18]'
                        : 'text-[#1A1A18]/80 hover:text-[#1A1A18] border-b-2 border-transparent hover:border-[#1A1A18]/40'
                    }`
                  }
                >
                  {isTrackOrder && (
                    <LeopardCourierIcon className="h-4 w-auto max-h-4 max-w-[40px] shrink-0" />
                  )}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-[#1A1A18] text-[#F7F4EB] px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Action Controls: Search, Bag, Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Full Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex items-center relative"
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#1A1A18]/70 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chappals, models..."
                  className="w-44 xl:w-64 pl-9 pr-8 py-2 rounded-full text-xs bg-[#A0988A]/20 hover:bg-[#A0988A]/30 focus:bg-[#A0988A]/40 border border-[#565449]/35 focus:border-[#565449] focus:ring-2 focus:ring-[#565449]/20 text-[#1A1A18] placeholder-[#1A1A18]/60 outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-[#1A1A18]/70 hover:text-[#1A1A18] p-0.5 cursor-pointer"
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
                  ? 'bg-[#565449] text-[#F7F4EB] border-[#565449] shadow-md'
                  : 'bg-[#A0988A]/20 hover:bg-[#A0988A]/40 border-[#565449]/35 text-[#1A1A18] hover:shadow-sm'
              }`}
              aria-label="Search"
              title="Search products"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Shopping Bag Simple Icon */}
            <Link
              to="/bag"
              className="relative p-2 sm:p-2.5 rounded-full backdrop-blur-md bg-[#A0988A]/20 hover:bg-[#565449] border border-[#565449]/35 text-[#1A1A18] hover:text-[#F7F4EB] transition-all shadow-xs flex items-center justify-center cursor-pointer hover:shadow-sm"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#565449] text-[#F7F4EB] text-[9px] sm:text-[10px] font-black min-w-[17px] h-[17px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-[#F7F4EB] animate-in zoom-in">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Toggle Button (3 lines) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 sm:p-2.5 rounded-full backdrop-blur-md bg-[#A0988A]/20 hover:bg-[#565449] border border-[#565449]/35 transition-all text-[#1A1A18] hover:text-[#F7F4EB] shadow-xs flex items-center justify-center cursor-pointer hover:shadow-sm"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Dropdown */}
        {mobileSearchOpen && (
          <div className="lg:hidden bg-[#F7F4EB] backdrop-blur-md border-b border-[#565449]/30 px-4 py-3 shadow-md animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#1A1A18]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chappals, sizes, models..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs bg-[#A0988A]/25 border border-[#565449]/40 focus:border-[#565449] focus:ring-2 focus:ring-[#565449]/20 text-[#1A1A18] placeholder-[#1A1A18]/60 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1A1A18]/70 hover:text-[#1A1A18] p-1"
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
            className={`fixed inset-0 bg-[#565449]/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Right-Side Drawer Panel */}
          <div
            className={`fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-[#F7F4EB] border-l border-[#565449]/30 shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header with Close Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#565449]/20 bg-[#F7F4EB]">
              <div className="flex items-center gap-2.5">
                {settings.logoUrl ? (
                  <img
                    src={normalizeAssetUrl(settings.logoUrl)}
                    alt={settings.storeName || 'Store Logo'}
                    className="h-8 w-auto max-w-[140px] object-contain"
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-[#565449] border border-[#565449] flex items-center justify-center shadow-md text-[#F7F4EB] font-serif font-bold text-sm">
                      P
                    </div>
                    <div>
                      <span className="font-serif font-bold text-[#1A1A18] text-sm uppercase tracking-wider block">
                        Navigation
                      </span>
                      <span className="text-[10px] text-[#A0988A] font-semibold tracking-widest uppercase">
                        {settings.storeName || 'Peshawari Store'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="p-4 pb-2 border-b border-[#565449]/20">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-[#1A1A18]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search products..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#A0988A]/25 border border-[#565449]/40 focus:border-[#565449] focus:ring-1 focus:ring-[#565449] text-[#1A1A18] placeholder-[#565449]/70 outline-none"
                />
              </form>
            </div>

            {/* Navigation Links in Drawer */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
              {navLinks.map((link) => {
                const isTrackOrder = link.to === '/orders';
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 px-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#1A1A18] text-[#F7F4EB] shadow-md font-bold'
                          : 'text-[#1A1A18] hover:bg-[#A0988A]/30'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{link.label}</span>
                      {isTrackOrder && (
                        <div className="h-6 px-1.5 rounded-lg bg-[#F7F4EB] border border-[#565449]/25 flex items-center justify-center shrink-0">
                          <img
                            src="/leopards-logo.png"
                            alt="Leopards Courier"
                            className="h-3.5 max-w-[28px] w-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                    {link.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#A0988A]/40 text-[#1A1A18] border border-[#1A1A18]/30">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Drawer Footer Info */}
            <div className="p-4 border-t border-[#565449]/20 bg-[#A0988A]/20 text-xs text-[#1A1A18] space-y-1">
              <p className="font-semibold text-[#1A1A18]">Peshawari Handcrafted Store</p>
              <p className="text-[11px] text-[#A0988A]">Bazaar-e-Kissa Khwani, Peshawar</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Active Promo Codes Scrolling Ticker (Right to Left Marquee Below Navbar) */}
      {activePromos.length > 0 && (
        <div className="bg-[#565449] text-[#F7F4EB] py-1.5 overflow-hidden border-b border-[#45433A] shadow-inner flex items-center relative">
          <div className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-[#565449] to-transparent w-8 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-[#565449] to-transparent w-8 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-12 font-sans text-xs font-semibold uppercase tracking-widest shrink-0">
            {/* Duplicated list for seamless continuous infinite loop */}
            {[...activePromos, ...activePromos, ...activePromos, ...activePromos].map((promo, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                <Tag className="w-3.5 h-3.5 text-[#F7F4EB] shrink-0" />
                <span className="text-[#F7F4EB] font-bold">Use Code: <span className="bg-[#45433A] text-[#F7F4EB] px-1.5 py-0.5 rounded border border-[#F7F4EB]/40">{promo.code}</span></span>
                <span className="text-[#F7F4EB]">
                  ({promo.discountType === 'percentage' ? `${promo.value}% OFF` : `Rs. ${promo.value} OFF`}
                  {promo.minOrderValue > 0 ? ` on orders over Rs. ${promo.minOrderValue}` : ''})
                </span>
                <span className="text-[#F7F4EB]/60 mx-2">•</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

