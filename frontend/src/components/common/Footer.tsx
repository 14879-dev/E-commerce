import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Award, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 pb-12 pt-16 bg-slate-900 text-slate-200 border-t border-slate-800 relative overflow-hidden">
      {/* Subtle Blue Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-80 bg-blue-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-slate-800">
          <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-sm">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-white">100% Handcrafted</h4>
              <p className="text-xs text-slate-400">Master Peshawar leather artisans</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-sm">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-white">All Over Pakistan Delivery</h4>
              <p className="text-xs text-slate-400">Tracked doorstep delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-sm">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-white">Easy Replacement</h4>
              <p className="text-xs text-slate-400">Standard items eligible</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-sm">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-white">Authentic Guarantee</h4>
              <p className="text-xs text-slate-400">Certified full-grain leather</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <span className="font-serif text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300 uppercase block mb-4">
              Peshawari
            </span>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Preserving the timeless heritage of traditional Khyber leathercraft while introducing 3D digital customizers and precision computer vision foot sizing.
            </p>
            <p className="text-xs text-blue-400 font-semibold">Bazaar-e-Kissa Khwani, Peshawar, KPK</p>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white text-base mb-4 uppercase tracking-wider text-xs">Collections</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/products?category=Kaptaan" className="hover:text-blue-400 transition-colors">Kaptaan Signature Series</Link></li>
              <li><Link to="/products?category=Zalmi" className="hover:text-blue-400 transition-colors">Zalmi Royal Edition</Link></li>
              <li><Link to="/products?category=Norzi" className="hover:text-blue-400 transition-colors">Norzi Classic High-Toe</Link></li>
              <li><Link to="/products?category=Quetta" className="hover:text-blue-400 transition-colors">Quetta Wide-Bridge Traditional</Link></li>
              <li><Link to="/products?category=Royal" className="hover:text-blue-400 transition-colors">Royal Heirloom Brass</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white text-base mb-4 uppercase tracking-wider text-xs">Innovation Studio</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/customize/prod-1" className="hover:text-blue-400 transition-colors">Interactive 3D Configurator</Link></li>
              <li><Link to="/size-finder" className="hover:text-blue-400 transition-colors">Camera Foot Size Finder</Link></li>
              <li><Link to="/outfit-match" className="hover:text-blue-400 transition-colors">AI Outfit Matcher</Link></li>
              <li><Link to="/orders" className="hover:text-blue-400 transition-colors">Live Order Tracking</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">Heritage Story</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white text-base mb-4 uppercase tracking-wider text-xs">Newsletter</h4>
            <p className="text-sm text-slate-400 mb-4">Subscribe for exclusive limited heirloom release drops.</p>
            <form onSubmit={e => e.preventDefault()} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
              />
              <button type="submit" className="w-full btn-copper text-sm py-2.5">
                Join Heritage Club
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Peshawari Chappal Co. Handcrafted in Pakistan with <Heart className="w-3.5 h-3.5 inline text-blue-400 mx-1 fill-blue-400" /> for the world.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
            <Link to="/admin/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
