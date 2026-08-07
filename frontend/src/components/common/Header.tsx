import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Sparkles, Menu, X, Home, Grid, Sliders, Ruler, Package, Info, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { apiService } from '../../services/api';
import type { PromoCode } from '../../types/admin';

export const Header: React.FC = () => {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePromos, setActivePromos] = useState<PromoCode[]>([]);
  const location = useLocation();

  // Close mobile menu on route change & fetch promo codes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    apiService.getPromoCodes().then(list => {
      setActivePromos(list.filter(p => p.active));
    });
  }, []);

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Catalog', icon: Grid },
    { to: '/customize/prod-1', label: '3D Customizer', icon: Sliders },
    { to: '/size-finder', label: 'Size Finder', icon: Ruler },
    { to: '/outfit-match', label: 'AI Outfit', icon: Sparkles, badge: 'AI' },
    { to: '/orders', label: 'Order Tracking', icon: Package },
    { to: '/about', label: 'Heritage', icon: Info },
  ];

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navigation Bar — Light Blue Liquid Glass */}
      <header className="backdrop-blur-xl bg-gradient-to-r from-sky-50/90 via-blue-50/85 to-sky-100/90 border-b border-sky-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md shadow-blue-500/20 border border-white/40 group-hover:scale-105 transition-all">
              <span className="font-serif text-white font-bold text-xl">P</span>
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-slate-900 uppercase block">
                Peshawari <span className="text-blue-600 text-xs tracking-widest font-sans font-bold uppercase">Store</span>
              </span>
            </div>
          </Link>

          {/* Desktop Main Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-700">
            <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1' : 'hover:text-blue-600 transition-colors'}>Home</NavLink>
            <NavLink to="/products" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1' : 'hover:text-blue-600 transition-colors'}>Catalog</NavLink>
            <NavLink to="/customize/prod-1" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1' : 'hover:text-blue-600 transition-colors'}>3D Customizer</NavLink>
            <NavLink to="/size-finder" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1' : 'hover:text-blue-600 transition-colors'}>Size Finder</NavLink>
            <NavLink to="/outfit-match" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1 flex items-center gap-1' : 'hover:text-blue-600 transition-colors flex items-center gap-1'}>
              <Sparkles className="w-4 h-4 text-blue-500" /> AI Outfit
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1' : 'hover:text-blue-600 transition-colors'}>Orders</NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? 'text-blue-600 font-bold border-b-2 border-blue-600 py-1' : 'hover:text-blue-600 transition-colors'}>Heritage</NavLink>
          </nav>

          {/* Action Controls & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* These icons are hidden on mobile — they live inside the hamburger menu */}
            <Link to="/wishlist" className="relative p-2.5 rounded-full bg-white/80 hover:bg-white border border-sky-200 transition-all text-slate-700 shadow-xs hidden lg:flex" title="Wishlist">
              <Heart className="w-5 h-5 text-slate-700" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/bag" className="relative p-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 items-center gap-2 px-3.5 sm:px-4 hidden lg:flex">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {itemCount > 0 && (
                <span className="bg-white/25 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-full bg-white/80 hover:bg-white border border-sky-200 transition-all text-slate-700"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Overlay Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-sky-50/95 backdrop-blur-2xl border-b border-sky-200 shadow-xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 mb-4 pt-1">
              <Link
                to="/wishlist"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-sky-200 font-medium text-xs text-slate-800 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-blue-600" />
                  <span>Wishlist</span>
                </div>
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlistCount}</span>
              </Link>

              <Link
                to="/bag"
                className="flex items-center justify-between p-3 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shopping Bag</span>
                </div>
                <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{itemCount}</span>
              </Link>
            </div>

            <div className="space-y-1 divide-y divide-sky-100">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:text-blue-600 hover:bg-white/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
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
          </div>
        )}
      </header>

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

