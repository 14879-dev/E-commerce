import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, HelpCircle, ShieldCheck, Ruler, Truck, Sparkles, MessageSquare } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useStoreSettings } from '../context/StoreSettingsContext';

export interface FAQCategoryItem {
  id: string;
  category: 'sizing' | 'craftsmanship' | 'shipping' | 'care';
  categoryLabel: string;
  question: string;
  answer: string;
}

export const CHAPPAL_FAQS: FAQCategoryItem[] = [
  {
    id: 'faq-1',
    category: 'craftsmanship',
    categoryLabel: 'Craftsmanship & Materials',
    question: 'What makes genuine handcrafted Peshawari Chappal unique?',
    answer: 'Authentic Peshawari chappals are handcrafted by heritage artisans in Khyber Pakhtunkhwa using 100% pure full-grain cowhide leather. Each pair features traditional double-stitched welts, durable tyre-sole or vulcanized rubber outsoles, and hand-embossed brass buckle crests that mold comfortably to your foot over time.'
  },
  {
    id: 'faq-2',
    category: 'craftsmanship',
    categoryLabel: 'Craftsmanship & Materials',
    question: 'What is the difference between Kaptaan Chappal, Zalmi Chappal, and Norzi Chappal?',
    answer: 'Kaptaan Chappal features a wide, pointed front crossover strap made popular by cricket legends and statesmen. Zalmi Chappal has a slightly narrower, aerodynamic cut with bold contrast edging. Norzi Chappal features double-padded upper leather with signature arch padding designed for formal and wedding wear.'
  },
  {
    id: 'faq-3',
    category: 'sizing',
    categoryLabel: 'Sizing & Fit',
    question: 'How do I choose the correct size for my Peshawari Chappal?',
    answer: 'Peshawari chappals use standard EU and UK shoe sizing. Because genuine leather gently softens and forms to your feet after 2–3 wears, we recommend choosing your exact true-to-size EU shoe size, or use our built-in AI Camera Size Finder to measure your foot dimensions in millimeters with zero guesswork.'
  },
  {
    id: 'faq-4',
    category: 'craftsmanship',
    categoryLabel: 'Craftsmanship & Materials',
    question: 'Are your chappals made with genuine pure leather?',
    answer: 'Yes, 100%. We never use synthetic, rexine, or faux leather. We exclusively source hand-tanned full-grain cowhide and calf leather with natural vegetable tanning extracts, ensuring breathable all-day comfort and lifetime structural durability.'
  },
  {
    id: 'faq-5',
    category: 'shipping',
    categoryLabel: 'Shipping & Delivery',
    question: 'Do you offer Cash on Delivery (COD) across Pakistan?',
    answer: 'Yes! We offer nationwide Cash on Delivery (COD), tracked doorstep courier shipping, and free delivery on orders exceeding Rs. 4,500 across Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, Multan, Faisalabad, and all surrounding areas.'
  },
  {
    id: 'faq-6',
    category: 'shipping',
    categoryLabel: 'Shipping & Delivery',
    question: 'How long does nationwide delivery take?',
    answer: 'Ready-to-ship catalog pairs typically arrive within 2 to 4 business days. For customized bespoke chappals, please allow 4 to 6 working days as our master cobblers hand-stitch and welt your pair specifically to order. You can track your parcel live anytime using our Track Order tool.'
  },
  {
    id: 'faq-7',
    category: 'care',
    categoryLabel: 'Care & Maintenance',
    question: 'How do I care for and clean handcrafted leather chappals?',
    answer: 'Wipe clean with a soft dry cloth after wearing. Condition with neutral or matching leather wax balm once a month to retain leather moisture and suppleness. Avoid prolonged water soaking; if wet, allow to air-dry naturally away from direct high heat.'
  },
  {
    id: 'faq-8',
    category: 'sizing',
    categoryLabel: 'Sizing & Fit',
    question: 'What if the size does not fit when my parcel arrives?',
    answer: 'We offer an easy 7-day hassle-free size replacement policy for all unworn, standard catalog footwear. Simply contact our WhatsApp concierge or support team with your order number, and we will arrange a replacement size exchange promptly.'
  }
];

export const FAQPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');

  // Filter FAQs based on active category and search query
  const filteredFaqs = useMemo(() => {
    return CHAPPAL_FAQS.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const rawPhone = settings.socialLinks?.whatsapp || settings.supportPhone || '+923001234567';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const whatsappHref = rawPhone.startsWith('http')
    ? rawPhone
    : `https://wa.me/${cleanPhone}?text=Hi!%20I%20have%20a%20question%20regarding%20Peshawari%20Chappals.`;

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-4">
      {/* Dynamic SEO Head with Google FAQPage Schema.org Injection */}
      <SEOHelmet
        title="Frequently Asked Questions (FAQ) | Sizing, Authentic Leather & Delivery"
        description="Find answers to common questions about authentic handcrafted Peshawari chappals, size guide, genuine full-grain leather, COD delivery across Pakistan, and care tips."
        keywords="Peshawari chappal FAQ, chappal size guide, genuine leather chappal care, COD pakistan footwear, kaptaan chappal vs zalmi chappal"
        faqItems={CHAPPAL_FAQS.map(f => ({ question: f.question, answer: f.answer }))}
      />

      {/* Hero Header */}
      <div className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base & Support</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Everything you need to know about our handcrafted Peshawari chappals, artisan leatherwork, camera sizing, delivery, and guarantees.
        </p>

        {/* Live Search Input */}
        <div className="max-w-xl mx-auto pt-4 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g., sizing, leather, COD, return)..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'craftsmanship', label: 'Craft & Leather', icon: ShieldCheck },
            { id: 'sizing', label: 'Size & Fit', icon: Ruler },
            { id: 'shipping', label: 'Shipping & COD', icon: Truck },
            { id: 'care', label: 'Care Guide', icon: Sparkles }
          ].map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
              >
                {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQs List Accordion */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-serif font-bold text-slate-800 text-lg">No matching questions found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              We couldn't find an answer matching "{searchQuery}". You can message our artisans directly on WhatsApp!
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors mt-2"
            >
              <MessageSquare className="w-4 h-4" /> Ask on WhatsApp
            </a>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = openFaq === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-gradient-to-b from-blue-50/40 via-white to-white border-blue-200 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      {faq.categoryLabel}
                    </span>
                    <span className="font-serif font-semibold text-slate-900 text-sm sm:text-base block">
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-blue-100/60 bg-white/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Helpful Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <Link
          to="/size-finder"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200/80 hover:border-blue-300 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Ruler className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-slate-900 text-sm mb-1">AI Size Finder</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Scan your foot with reference card to get your precise chappal size.
          </p>
        </Link>

        <Link
          to="/orders"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200/80 hover:border-blue-300 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-slate-900 text-sm mb-1">Track Your Order</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Check real-time dispatch and delivery status for your handcrafted parcel.
          </p>
        </Link>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-all group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-slate-900 text-sm mb-1">WhatsApp Concierge</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connect directly with our master craftsmen for bespoke or custom inquiries.
          </p>
        </a>
      </div>
    </div>
  );
};
