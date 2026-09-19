import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, MessageSquare, ArrowRight, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { apiService } from '../services/api';

export const ContactPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Order & Sizing Inquiry',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportEmail = settings.supportEmail || 'concierge@peshawarichappal.com';
  const supportPhone = settings.supportPhone || '+92 91 111 222 333';
  const whatsappNumber = settings.socialLinks?.whatsapp;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await apiService.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: `${formData.subject} ${formData.phone ? `(${formData.phone})` : ''}`,
        message: formData.message.trim(),
      });

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Order & Sizing Inquiry',
        message: '',
      });
    } catch {
      setError('Could not send message. Please email us directly or try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      <SEOHelmet
        title={`Contact Us | Customer Support & Artisan Concierge`}
        description={`Get in touch with ${settings.storeName || 'Peshawari Chappal Co.'}. Contact our concierge for camera foot sizing questions, custom bespoke orders, and order status.`}
      />

      {/* Hero Header */}
      <div className="text-center space-y-3 pb-8 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
          <span>Customer Care &amp; Bespoke Concierge</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900">
          We&apos;re Here to Assist You
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Whether you need advice on foot sizing, shade matching for a wedding, or tracking an active order, our Peshawar artisan team is at your service.
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Email Support Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Email Support</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our official support inbox. We reply to customer queries, size checks, and exchanges within 2-4 business hours.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <a
              href={`mailto:${supportEmail}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 break-all block"
            >
              {supportEmail}
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Email Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy email address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Phone & WhatsApp Support Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Phone &amp; WhatsApp</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Speak directly with our concierge desk or chat on WhatsApp for immediate sizing confirmation before dispatch.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <a
              href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`}
              className="text-xs font-semibold text-slate-900 hover:text-blue-600 block"
            >
              {supportPhone}
            </a>
            {whatsappNumber && (
              <a
                href={
                  whatsappNumber.startsWith('http')
                    ? whatsappNumber
                    : `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <span>Chat on WhatsApp</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Studio & Workshop Location Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Heritage Workshop</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bazaar-e-Kissa Khwani, Old Peshawar, Khyber Pakhtunkhwa, Pakistan.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Mon – Sat: 10:00 AM – 9:00 PM PKT</span>
          </div>
        </div>
      </div>

      {/* Main Inquiry Form & FAQ Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <h2 className="font-serif font-bold text-2xl text-slate-900">Send Us an Inquiry</h2>
            <p className="text-xs text-slate-500">
              Leave your details below and our concierge team will reach out directly via email or phone.
            </p>
          </div>

          {submitted ? (
            <div className="py-10 px-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-serif font-bold text-xl text-slate-900">Message Received!</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Thank you for contacting us. A member of our artisan team has received your message and will respond to your email at <span className="font-semibold text-slate-900">{supportEmail}</span> shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="Order & Sizing Inquiry">Order &amp; Sizing Inquiry</option>
                    <option value="Size Exchange & Replacement">Size Exchange &amp; Replacement</option>
                    <option value="Wedding & Bulk Order">Wedding &amp; Bulk Order</option>
                    <option value="Custom Leather Shade Request">Custom Leather Shade Request</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="How can our master craftsmen help you today?"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to Concierge</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Side Information: Fast Assistance & FAQs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-100 space-y-4">
            <h3 className="font-serif font-bold text-lg text-blue-950">Quick Help &amp; FAQs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Looking for quick answers about doorstep COD delivery, tire rubber soles, or how our camera measurement algorithm calculates size?
            </p>
            <div className="space-y-2 pt-2">
              <Link
                to="/faqs"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200/70 text-xs font-semibold text-slate-800 hover:text-blue-600 hover:border-blue-400 transition-all shadow-2xs"
              >
                <span>Read Frequently Asked Questions (FAQs)</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>
              <Link
                to="/size-finder"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200/70 text-xs font-semibold text-slate-800 hover:text-blue-600 hover:border-blue-400 transition-all shadow-2xs"
              >
                <span>Scan Foot Size on A4 Paper</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>
              <Link
                to="/orders"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200/70 text-xs font-semibold text-slate-800 hover:text-blue-600 hover:border-blue-400 transition-all shadow-2xs"
              >
                <span>Track an Existing Order</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-serif font-bold text-base text-slate-900">Exchange &amp; Returns Guarantee</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We stand 100% behind our craftsmanship. If you receive a pair that does not fit your bridge comfortably, our concierge will arrange a smooth doorstep size exchange across Pakistan.
            </p>
            <p className="text-[11px] font-bold text-blue-600">
              Direct Contact: {supportEmail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
