import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const AboutPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const supportEmail = settings.supportEmail || 'concierge@peshawarichappal.com';
  return (
    <div className="space-y-16 max-w-5xl mx-auto py-2">
      <SEOHelmet
        title="Heritage & Craftsmanship Story"
        description="Discover the 75-year legacy of traditional Peshawar leather craftsmanship, master tanners, and modern digital innovation."
      />

      {/* Hero Header */}
      <div className="border-b border-[#A0988A]/40 pb-10 text-center space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block">
          Bazaar-e-Kissa Khwani Legacy
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-[#1A1A18] leading-tight">
          Seventy-Five Years of <br />
          <span className="text-[#1A1A18]">Master Leathercraft</span>
        </h1>
        <p className="text-sm sm:text-base text-[#1A1A18]/80 max-w-2xl mx-auto leading-relaxed">
          From the ancient cobbler alleys of Old Peshawar to international runways. We preserve authentic Pashtun leatherwork while empowering artisans through digital bespoke craftsmanship.
        </p>
      </div>

      {/* Story Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A18]">Origins</span>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#1A1A18]">
            The Storytellers’ Bazaar
          </h2>
          <p className="text-xs sm:text-sm text-[#1A1A18]/80 leading-relaxed">
            In the heart of Peshawar, the historic Kissa Khwani Bazaar ("Bazaar of Storytellers") has long been the cradle of iconic footwear. Caravans along the Silk Road traded raw hides and hand-forged brass buckles. Today, our third-generation master craftsmen carry this unchanged legacy in every stitch.
          </p>
        </div>

        <div className="aspect-video rounded-3xl overflow-hidden border border-[#A0988A] shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800"
            alt="Peshawar Leather Workshop"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Artisan Spotlight Profiles (Warm Taupe Cards Section) */}
      <section className="space-y-8 pt-10 border-t border-[#A0988A]/40">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A18] block">
            Master Craftsmanship
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#1A1A18]">
            Meet the Artisans
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-[#565449] text-[#F7F4EB] border border-[#565449] flex items-center justify-center mx-auto font-serif font-bold text-xl">
              U
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Ustad Janan Afridi</h3>
            <span className="text-xs text-[#1A1A18] font-semibold block">Master Leather Cutter (42 Yrs Exp)</span>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Specializes in hand-stenciling iconic Kaptaan T-straps with zero leather waste.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-[#565449] text-[#F7F4EB] border border-[#565449] flex items-center justify-center mx-auto font-serif font-bold text-xl">
              M
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Master Gul Khan</h3>
            <span className="text-xs text-[#1A1A18] font-semibold block">Sole &amp; Tire Moulding Expert</span>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Shapes high-density recycled tire rubber treads into all-terrain ergonomic outsoles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#A0988A]/25 border border-[#A0988A] space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-[#565449] text-[#F7F4EB] border border-[#565449] flex items-center justify-center mx-auto font-serif font-bold text-xl">
              S
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Sher Ali Khan</h3>
            <span className="text-xs text-[#1A1A18] font-semibold block">Brass Filigree Artisan</span>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Hand-engrave solid copper and aged brass buckles with traditional Pashtun crests.
            </p>
          </div>
        </div>
      </section>

      {/* Concierge & Inquiries Banner (Warm Taupe Section Panel) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#A0988A]/25 border border-[#A0988A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A18] block">Bespoke Concierge</span>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#1A1A18]">
            Have inquiries regarding custom calfskin or wedding orders?
          </h3>
          <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
            Reach out directly to our master craftsmen studio at {supportEmail} for tailored fittings and international delivery.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/contact" className="btn-copper text-xs py-2.5 px-6 inline-flex items-center gap-1.5 whitespace-nowrap">
            Contact Concierge <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
