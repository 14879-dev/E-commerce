import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useStoreSettings } from '../context/StoreSettingsContext';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3 bg-[#A0988A]/15 border border-[#A0988A]/35 rounded-2xl p-5">
    <h2 className="font-serif font-bold text-xl text-[#1A1A18] border-b border-[#565449]/20 pb-2">{title}</h2>
    <div className="text-sm text-[#1A1A18]/85 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const PrivacyPolicyPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const supportEmail = settings.supportEmail || 'concierge@peshawarichappal.com';
  const supportPhone = settings.supportPhone || '+92 91 111 222 333';
  const storeName = settings.storeName || 'Peshawari Chappal Co.';

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <SEOHelmet
        title={`Privacy Policy — ${storeName}`}
        description="Our privacy policy explains how we collect, use, and protect your personal information when you shop with us."
      />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#1A1A18]/70">
          <Link to="/" className="hover:text-[#1A1A18] font-semibold transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-[#1A1A18]/50" />
          <span className="text-[#1A1A18] font-bold">Privacy Policy</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#565449] text-[#F7F4EB] flex items-center justify-center shrink-0 mt-1 shadow-xs">
            <Shield className="w-6 h-6 text-[#F7F4EB]" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl text-[#1A1A18]">Privacy Policy</h1>
            <p className="text-sm text-[#1A1A18]/70 mt-1">Peshawari Chappal Co. — Effective Date: August 1, 2026</p>
          </div>
        </div>
        <p className="text-sm text-[#1A1A18]/90 leading-relaxed bg-[#A0988A]/25 border border-[#565449]/30 rounded-xl px-4 py-3">
          Your privacy is important to us. This policy explains what personal information we collect, how we use it, and your rights regarding that data.
        </p>
      </div>

      <Section title="1. Information We Collect">
        <p>We collect information you provide directly when you:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Place an order</strong> — name, shipping address, email, phone number, payment method (we do not store card numbers)</li>
          <li><strong>Submit a product review</strong> — name, rating, and written review</li>
          <li><strong>Contact us</strong> — name, email, and message content</li>
          <li><strong>Use the foot size finder</strong> — camera images processed locally in your browser; images are not uploaded to our servers unless you explicitly submit them</li>
          <li><strong>Use the outfit matcher</strong> — uploaded images analyzed for color extraction only; not stored</li>
        </ul>
        <p className="mt-2">We also automatically collect certain technical data including browser type, IP address, page visit logs, and device type for security and performance monitoring.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Order fulfillment</strong> — processing payments, packing, shipping, and delivery tracking</li>
          <li><strong>Customer support</strong> — responding to inquiries, replacement requests, and complaints</li>
          <li><strong>Marketing communications</strong> — promotional emails (only with your consent; unsubscribe any time)</li>
          <li><strong>Personalization</strong> — remembering your size preferences and cart items between sessions</li>
          <li><strong>Security</strong> — detecting and preventing fraud, unauthorized access, and abuse</li>
          <li><strong>Legal compliance</strong> — meeting applicable Pakistani and international data protection laws</li>
        </ul>
      </Section>

      <Section title="3. Cookies and Local Storage">
        <p>Our website uses browser local storage (not traditional cookies) to save:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your shopping cart items</li>
          <li>Store preferences (language, currency)</li>
          <li>Admin session tokens (sessionStorage — cleared when browser closes)</li>
        </ul>
        <p className="mt-2">We do not use advertising tracking cookies or sell your data to third-party advertisers.</p>
      </Section>

      <Section title="4. Sharing of Information">
        <p>We do not sell, rent, or trade your personal information. We may share data with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Courier and logistics partners</strong> — solely for delivery purposes (name, address, phone)</li>
          <li><strong>Payment processors</strong> — for secure transaction processing (JazzCash, Easypaisa, card processors)</li>
          <li><strong>Cloud hosting providers</strong> — MongoDB Atlas for database storage with encryption at rest</li>
          <li><strong>Legal authorities</strong> — when required by law, court order, or to protect our legal rights</li>
        </ul>
      </Section>

      <Section title="5. Order Tracking Privacy">
        <p>
          When displaying order status on our tracking page, we partially mask sensitive details — email addresses and phone numbers are shown in a redacted format (e.g., <code className="bg-[#565449]/15 px-1 rounded text-xs text-[#1A1A18]">h***@e***.com</code>) to protect your data in case someone else accesses the tracking URL.
        </p>
        <p className="mt-2">Full details are only visible to you when logged into your account, or to our admin team through the secure admin panel.</p>
      </Section>

      <Section title="6. Data Retention">
        <p>We retain your data for as long as necessary to fulfill the purposes described above:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Order records — 7 years (for tax and accounting compliance)</li>
          <li>Customer accounts — until you request deletion</li>
          <li>Support messages — 2 years from last contact</li>
          <li>Analytics logs — 90 days, anonymized thereafter</li>
        </ul>
      </Section>

      <Section title="7. Security">
        <p>
          We implement industry-standard security measures including:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>HTTPS encryption for all data transmitted between your browser and our servers</li>
          <li>JWT-based session tokens stored in browser sessionStorage (not persistent)</li>
          <li>Admin panel protected by authentication with brute-force lockout</li>
          <li>Database encryption at rest (MongoDB Atlas)</li>
          <li>No plain-text storage of passwords</li>
        </ul>
        <p className="mt-2">Despite our best efforts, no system is 100% secure. If you suspect a security issue, contact us immediately at <a href={`mailto:${supportEmail}`} className="text-[#1A1A18] font-bold underline">{supportEmail}</a>.</p>
      </Section>

      <Section title="8. Your Rights">
        <p>Under applicable law, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
          <li><strong>Correction</strong> — request correction of inaccurate or incomplete data</li>
          <li><strong>Deletion</strong> — request erasure of your data (subject to legal retention requirements)</li>
          <li><strong>Objection</strong> — opt out of marketing communications at any time</li>
          <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
        </ul>
        <p className="mt-2">To exercise any of these rights, email us at <a href={`mailto:${supportEmail}`} className="text-[#1A1A18] font-bold underline">{supportEmail}</a>. We will respond within 30 days.</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>Our website is not directed at children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, contact us immediately.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this privacy policy from time to time. We will notify you of significant changes by posting a notice on our website or emailing you. The "Effective Date" at the top of this page indicates when the policy was last updated.</p>
      </Section>

      <Section title="11. Contact Us">
        <p>For any privacy-related questions, requests, or concerns:</p>
        <div className="bg-[#F7F4EB] border border-[#565449]/20 rounded-xl p-4 space-y-1 text-sm text-[#1A1A18]">
          <p className="font-bold text-[#1A1A18]">{storeName}</p>
          <p>Email: <a href={`mailto:${supportEmail}`} className="text-[#1A1A18] font-bold underline">{supportEmail}</a></p>
          <p>Phone: <a href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`} className="text-[#1A1A18] font-bold underline">{supportPhone}</a></p>
          <p>Address: Qissa Khwani Bazaar, Peshawar, Khyber Pakhtunkhwa, Pakistan</p>
        </div>
      </Section>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-[#565449]/20 flex flex-wrap gap-4 text-xs text-[#1A1A18]/80">
        <Link to="/contact" className="hover:text-[#1A1A18] font-bold transition-colors">Contact Us</Link>
        <Link to="/terms" className="hover:text-[#1A1A18] font-bold transition-colors">Terms of Service</Link>
        <Link to="/about" className="hover:text-[#1A1A18] font-bold transition-colors">About Us</Link>
        <Link to="/" className="hover:text-[#1A1A18] font-bold transition-colors">← Back to Store</Link>
      </div>
    </div>
  );
};
