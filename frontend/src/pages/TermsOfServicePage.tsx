import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-serif font-bold text-xl text-slate-900 border-b border-slate-200 pb-2">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <SEOHelmet
        title="Terms of Service — Peshawari Chappal Co."
        description="Read our terms and conditions governing purchases, returns, customization, and use of the Peshawari Chappal website."
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Terms of Service</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-slate-900">Terms of Service</h1>
            <p className="text-sm text-slate-500 mt-1">Peshawari Chappal Co. — Effective Date: August 1, 2026</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          By using our website or placing an order, you agree to these Terms of Service. Please read them carefully before making a purchase.
        </p>
      </div>

      <Section title="1. About Us">
        <p>
          Peshawari Chappal Co. is a handcrafted footwear brand based in Peshawar, Khyber Pakhtunkhwa, Pakistan. We sell authentic, handmade Peshawari chappals online through this website. References to "we," "us," or "our" refer to Peshawari Chappal Co.
        </p>
      </Section>

      <Section title="2. Ordering">
        <p>When you place an order on our website, you are making an offer to purchase the selected item(s). An order is confirmed only after we send a confirmation email or SMS with an order number (e.g. PSH-XXXXX).</p>
        <p>We reserve the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Decline or cancel an order if an item is out of stock or if fraudulent activity is suspected</li>
          <li>Adjust prices for errors (we will notify you before processing)</li>
          <li>Limit order quantities per customer at our discretion</li>
        </ul>
        <p className="mt-2">All prices are displayed in the currency shown on the website. Prices are exclusive of applicable customs duties for international shipments.</p>
      </Section>

      <Section title="3. Handcrafting & Lead Times">
        <p>
          Our chappals are individually handcrafted by skilled artisans. Standard processing times are:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-1.5">
            <span className="font-semibold text-slate-700">Standard Chappal</span>
            <span>3–5 business days crafting + shipping</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-1.5">
            <span className="font-semibold text-slate-700">Customized / Personalized</span>
            <span>7–14 business days crafting + shipping</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Limited / Royal Edition</span>
            <span>14–21 business days crafting + shipping</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 italic">
          Handcrafting times are estimates and may vary. We will notify you of any significant delays.
        </p>
      </Section>

      <Section title="4. Payment">
        <p>We accept the following payment methods:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cash on Delivery (COD)</strong> — available within Pakistan. Payment due at doorstep.</li>
          <li><strong>Credit / Debit Card</strong> — processed securely via our payment gateway. We do not store card details.</li>
          <li><strong>JazzCash / Easypaisa</strong> — mobile wallet payments for Pakistan customers.</li>
        </ul>
        <p className="mt-2">All transactions are in the currency displayed on the website at the time of checkout. Amounts charged are final upon order confirmation.</p>
      </Section>

      <Section title="5. Shipping Policy">
        <p>We ship across Pakistan and internationally. Shipping rates and estimated delivery times are shown at checkout.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Free shipping</strong> applies on orders above the threshold shown at checkout</li>
          <li><strong>Standard shipping</strong> — 2–5 business days within Pakistan after dispatch</li>
          <li><strong>Express artisan courier</strong> — 1–2 business days within Pakistan after dispatch</li>
          <li><strong>International orders</strong> — 10–21 business days; customs duties are the buyer's responsibility</li>
        </ul>
        <p className="mt-2">Risk of loss and title for purchased items passes to you upon our delivery to the carrier.</p>
      </Section>

      <Section title="6. Returns & Replacements">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-3">
          <p className="font-bold text-amber-800 text-sm">Important — Customized Items Are Non-Returnable</p>
          <p className="text-amber-700 text-xs mt-1">
            Items produced to your personal specifications (custom color, initials, size adjustments from the 3D customizer) cannot be returned or exchanged. This is clearly indicated on the product page before purchase.
          </p>
        </div>
        <p><strong>Standard (non-customized) items:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You may request a size exchange or replacement within <strong>7 days</strong> of delivery</li>
          <li>Items must be unused, unworn, and in original packaging</li>
          <li>Submit a replacement request through the Order Tracking page or by contacting us</li>
          <li>We arrange doorstep pickup at no additional cost within Pakistan</li>
          <li>Refunds (for defective/incorrect items) are processed within 5–7 business days after we receive the returned item</li>
        </ul>
        <p className="mt-2"><strong>We do not accept returns for:</strong> size issues on customized orders, normal leather wear and tear, or items damaged by the buyer.</p>
      </Section>

      <Section title="7. Product Descriptions & Accuracy">
        <p>
          We make every effort to display our products accurately. However, actual leather colors, textures, and tones may vary slightly from photographs due to natural material variation and screen display differences. Handcrafted items may have minor natural imperfections — these are characteristics of artisan craftsmanship, not defects.
        </p>
        <p className="mt-2">
          3D product views are rendered approximations for visualization purposes and may not perfectly match the final physical product.
        </p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>
          All content on this website — including product photographs, 3D models, design assets, brand name, logo, and written content — is the exclusive property of Peshawari Chappal Co. and protected by copyright law. You may not reproduce, distribute, or use our content without written permission.
        </p>
      </Section>

      <Section title="9. User-Generated Content (Reviews)">
        <p>
          By submitting a product review, you grant Peshawari Chappal Co. a non-exclusive, royalty-free license to display, modify, and use your review content on our website and marketing materials. You confirm that your review is honest and does not contain offensive, false, or misleading information.
        </p>
        <p className="mt-2">We reserve the right to moderate, edit, or remove any review that violates our guidelines.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the fullest extent permitted by applicable law, Peshawari Chappal Co. shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products, including but not limited to delays in delivery, product defects, or data loss.
        </p>
        <p className="mt-2">
          Our total liability for any claim related to a product purchase shall not exceed the amount you paid for that order.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms of Service are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be resolved in the courts of Peshawar, Khyber Pakhtunkhwa, Pakistan, unless otherwise required by applicable consumer protection laws in your jurisdiction.
        </p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>
          We may update these Terms of Service at any time. Changes will be effective upon posting to this page. Continued use of our website after changes constitutes acceptance of the updated terms. We recommend reviewing this page periodically.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>For questions about these terms:</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-sm">
          <p className="font-bold text-slate-900">Peshawari Chappal Co.</p>
          <p>Email: <a href="mailto:legal@peshawarichappal.com" className="text-blue-600 hover:underline">legal@peshawarichappal.com</a></p>
          <p>Phone: +92 91 111 222 333</p>
          <p>Address: Qissa Khwani Bazaar, Peshawar, Khyber Pakhtunkhwa, Pakistan</p>
        </div>
      </Section>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-500">
        <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
        <Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link>
        <Link to="/" className="hover:text-blue-600 transition-colors">← Back to Store</Link>
      </div>
    </div>
  );
};
