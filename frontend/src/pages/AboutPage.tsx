import React from 'react';
import { SEOHelmet } from '../components/common/SEOHelmet';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-16 max-w-5xl mx-auto py-2">
      <SEOHelmet
        title="Heritage & Craftsmanship Story"
        description="Discover the 75-year legacy of traditional Peshawar leather craftsmanship, master tanners, and modern digital innovation."
      />

      {/* Hero Header */}
      <div className="border-b border-slate-200 pb-10 text-center space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block">
          Bazaar-e-Kissa Khwani Legacy
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-slate-900 leading-tight">
          Seventy-Five Years of <br />
          <span className="text-blue-600">Master Leathercraft</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          From the ancient cobbler alleys of Old Peshawar to international runways. We preserve authentic Pashtun leatherwork while empowering artisans through modern 3D technology.
        </p>
      </div>

      {/* Story Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Origins</span>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
            The Storytellers’ Bazaar
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In the heart of Peshawar, the historic Kissa Khwani Bazaar ("Bazaar of Storytellers") has long been the cradle of iconic footwear. Caravans along the Silk Road traded raw hides and hand-forged brass buckles. Today, our third-generation master craftsmen carry this unchanged legacy in every stitch.
          </p>
        </div>

        <div className="aspect-video rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800"
            alt="Peshawar Leather Workshop"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Artisan Spotlight Profiles */}
      <section className="space-y-8 pt-10 border-t border-slate-200">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block">
            Master Craftsmanship
          </span>
          <h2 className="font-serif text-3xl font-bold text-slate-900">
            Meet the Artisans
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto font-serif font-bold text-xl">
              U
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Ustad Janan Afridi</h3>
            <span className="text-xs text-blue-600 font-semibold block">Master Leather Cutter (42 Yrs Exp)</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Specializes in hand-stenciling iconic Kaptaan T-straps with zero leather waste.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto font-serif font-bold text-xl">
              M
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Master Gul Khan</h3>
            <span className="text-xs text-blue-600 font-semibold block">Sole & Tire Moulding Expert</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Shapes high-density recycled tire rubber treads into all-terrain ergonomic outsoles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto font-serif font-bold text-xl">
              S
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Sher Ali Khan</h3>
            <span className="text-xs text-blue-600 font-semibold block">Brass Filigree Artisan</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hand-engrave solid copper and aged brass buckles with traditional Pashtun crests.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
