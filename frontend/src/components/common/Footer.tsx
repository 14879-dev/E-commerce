import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { normalizeAssetUrl } from '../../utils/assetUrl';

export const Footer: React.FC = () => {
  const { settings } = useStoreSettings();

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
            {settings.logoUrl ? (
              <img
                src={normalizeAssetUrl(settings.logoUrl)}
                alt={settings.storeName || 'Peshawari'}
                className="h-10 w-auto max-w-[170px] object-contain mb-4"
              />
            ) : (
              <span className="font-serif text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300 uppercase block mb-4">
                {settings.storeName || 'Peshawari'}
              </span>
            )}
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Preserving the timeless heritage of traditional Khyber leathercraft while introducing authentic artisan catalog collections and precision computer vision foot sizing.
            </p>
            <p className="text-xs text-blue-400 font-semibold mb-5">Bazaar-e-Kissa Khwani, Peshawar, KPK</p>

            {/* Social Media Accounts */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Follow & Connect</span>
              <div className="flex items-center flex-wrap gap-2.5">
                {/* WhatsApp */}
                {settings.socialLinks?.whatsapp && (
                  <a
                    href={
                      settings.socialLinks.whatsapp.startsWith('http')
                        ? settings.socialLinks.whatsapp
                        : `https://wa.me/${settings.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                    title="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20.52 3.449A11.96 11.96 0 0 0 11.832 0C5.312 0 0 5.313 0 11.832c0 2.091.547 4.131 1.589 5.926L0 24l6.452-1.693a11.93 11.93 0 0 0 5.717 1.457h.005c6.517 0 11.829-5.315 11.832-11.832A11.896 11.896 0 0 0 20.52 3.45zm-8.688 18.349h-.004a9.92 9.92 0 0 1-5.056-1.385l-.362-.215-3.753.984 1.002-3.659-.236-.375A9.875 9.875 0 0 1 1.932 11.83C1.932 6.37 6.37 1.932 11.832 1.932a9.855 9.855 0 0 1 7.01 2.91 9.855 9.855 0 0 1 2.91 7.01c-.004 5.46-4.442 9.897-9.904 9.897zm5.438-7.411c-.305-.153-1.804-.891-2.083-1.042-.279-.153-.483-.228-.686.228-.204.457-.788.972-.966 1.176-.178.204-.356.228-.661.076-.305-.153-1.288-.475-2.453-1.515-.907-.808-1.518-1.805-1.696-2.11-.178-.304-.019-.469.133-.62.138-.138.305-.357.458-.535.152-.178.203-.305.305-.508.102-.204.051-.382-.025-.535-.077-.153-.686-1.651-.94-2.261-.247-.591-.505-.512-.693-.521-.178-.009-.382-.009-.585-.009-.204 0-.535.076-.816.382-.28.305-1.067 1.042-1.067 2.542s1.092 2.946 1.244 3.149c.153.204 2.148 3.284 5.204 4.607.726.313 1.293.499 1.737.64.731.232 1.396.199 1.921.121.585-.088 1.804-.737 2.057-1.448.254-.712.254-1.322.178-1.448-.077-.127-.28-.203-.585-.356z" />
                    </svg>
                  </a>
                )}

                {/* Instagram */}
                {settings.socialLinks?.instagram && (
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 border border-slate-700 hover:border-pink-400 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}

                {/* Facebook */}
                {settings.socialLinks?.facebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z" />
                    </svg>
                  </a>
                )}

                {/* TikTok */}
                {settings.socialLinks?.tiktok && (
                  <a
                    href={settings.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-black border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs"
                    title="TikTok"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                    </svg>
                  </a>
                )}

                {/* Email (Gmail) */}
                <a
                  href={`mailto:${settings.supportEmail || 'concierge@peshawarichappal.com'}`}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-[#EA4335] border border-slate-700 hover:border-[#EA4335] text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer"
                  title={`Email Us (Gmail): ${settings.supportEmail || 'concierge@peshawarichappal.com'}`}
                  aria-label="Send email to support via Gmail"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {settings.hideCategories ? (
            <div>
              <h4 className="font-serif font-semibold text-white text-base mb-4 uppercase tracking-wider text-xs">About &amp; Policies</h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/faqs" className="hover:text-blue-400 transition-colors">Frequently Asked Questions (FAQs)</Link></li>
                <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          ) : (
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
          )}

          <div>
            <h4 className="font-serif font-semibold text-white text-base mb-4 uppercase tracking-wider text-xs">Customer Care &amp; Studio</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/size-finder" className="hover:text-blue-400 transition-colors">Camera Foot Size Finder</Link></li>
              <li><Link to="/outfit-match" className="hover:text-blue-400 transition-colors">AI Outfit Matcher</Link></li>
              <li><Link to="/orders" className="hover:text-blue-400 transition-colors">Track Order</Link></li>

              {!settings.hideCategories && (
                <>
                  <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                </>
              )}
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

        {/* Bottom Extreme Footer Bar */}
        <div className="pt-8 border-t border-slate-800/80 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-4">
          <p>© {new Date().getFullYear()} Peshawari Chappal Co.</p>
        </div>
      </div>

      {/* Floating Hovering WhatsApp Concierge Button */}
      {(() => {
        const rawPhone = settings.socialLinks?.whatsapp || settings.supportPhone || '+923001234567';
        const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        const whatsappHref = rawPhone.startsWith('http')
          ? rawPhone
          : `https://wa.me/${cleanPhone}?text=Hi!%20I%20am%20interested%20in%20your%20handcrafted%20Peshawari%20chappals.`;

        return (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-500 text-white shadow-[0_8px_30px_rgba(16,185,129,0.45)] border border-emerald-300/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            {/* Ambient Pulse Ripple */}
            <span className="absolute -inset-1 rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />

            {/* WhatsApp Icon */}
            <svg className="w-6 h-6 fill-current relative z-10 shrink-0" viewBox="0 0 24 24">
              <path d="M20.52 3.449A11.96 11.96 0 0 0 11.832 0C5.312 0 0 5.313 0 11.832c0 2.091.547 4.131 1.589 5.926L0 24l6.452-1.693a11.93 11.93 0 0 0 5.717 1.457h.005c6.517 0 11.829-5.315 11.832-11.832A11.896 11.896 0 0 0 20.52 3.45zm-8.688 18.349h-.004a9.92 9.92 0 0 1-5.056-1.385l-.362-.215-3.753.984 1.002-3.659-.236-.375A9.875 9.875 0 0 1 1.932 11.83C1.932 6.37 6.37 1.932 11.832 1.932a9.855 9.855 0 0 1 7.01 2.91 9.855 9.855 0 0 1 2.91 7.01c-.004 5.46-4.442 9.897-9.904 9.897zm5.438-7.411c-.305-.153-1.804-.891-2.083-1.042-.279-.153-.483-.228-.686.228-.204.457-.788.972-.966 1.176-.178.204-.356.228-.661.076-.305-.153-1.288-.475-2.453-1.515-.907-.808-1.518-1.805-1.696-2.11-.178-.304-.019-.469.133-.62.138-.138.305-.357.458-.535.152-.178.203-.305.305-.508.102-.204.051-.382-.025-.535-.077-.153-.686-1.651-.94-2.261-.247-.591-.505-.512-.693-.521-.178-.009-.382-.009-.585-.009-.204 0-.535.076-.816.382-.28.305-1.067 1.042-1.067 2.542s1.092 2.946 1.244 3.149c.153.204 2.148 3.284 5.204 4.607.726.313 1.293.499 1.737.64.731.232 1.396.199 1.921.121.585-.088 1.804-.737 2.057-1.448.254-.712.254-1.322.178-1.448-.077-.127-.28-.203-.585-.356z" />
            </svg>

            {/* Hover Unfolding Tooltip */}
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[160px] transition-all duration-300 ease-out text-xs font-bold tracking-wide hidden sm:inline-block relative z-10">
              Chat on WhatsApp
            </span>
          </a>
        );
      })()}
    </footer>
  );
};
