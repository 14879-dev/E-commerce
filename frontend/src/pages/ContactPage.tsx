import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, MessageSquare, ArrowRight, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { apiService } from '../services/api';
import { PageHero } from '../components/common/PageHero';

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
    <div className="w-full">
      <SEOHelmet
        title={`Contact Us | Customer Support & Artisan Concierge`}
        description={`Get in touch with ${settings.storeName || 'Peshawari Chappal Co.'}. Contact our concierge for camera foot sizing questions, custom bespoke orders, and order status.`}
      />

      <PageHero
        badge="Customer Care & Bespoke Concierge"
        title="We're Here to Assist You"
        subtitle="Heritage Craftsmanship & Dedicated Support"
        description="Whether you need advice on foot sizing, shade matching for special events, or tracking an active order, our team is at your service."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Header */}
        <div className="text-center space-y-3 pb-8 border-b border-[#565449]/20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A0988A]/25 border border-[#565449]/30 text-[#1A1A18] text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-[#1A1A18]" />
            <span>Customer Care &amp; Bespoke Concierge</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1A1A18]">
            We&apos;re Here to Assist You
          </h1>
          <p className="text-sm sm:text-base text-[#1A1A18]/80 max-w-2xl mx-auto leading-relaxed">
            Whether you need advice on foot sizing, shade matching for a wedding, or tracking an active order, our Peshawar artisan team is at your service.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Email Support Card */}
        <div className="p-6 rounded-2xl bg-[#A0988A]/20 border border-[#A0988A]/40 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#565449]/60 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#565449]/15 text-[#1A1A18] border border-[#565449]/20 flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Email Support</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Our official support inbox. We reply to customer queries, size checks, and exchanges within 2-4 business hours.
            </p>
          </div>

          <div className="pt-2 border-t border-[#565449]/20 space-y-2">
            <a
              href={`mailto:${supportEmail}`}
              className="text-xs font-bold text-[#1A1A18] hover:underline break-all block"
            >
              {supportEmail}
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1A1A18]/70 hover:text-[#1A1A18] transition-colors cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1A1A18]" />
                  <span className="text-[#1A1A18] font-bold">Email Copied!</span>
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
        <div className="p-6 rounded-2xl bg-[#A0988A]/20 border border-[#A0988A]/40 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#565449]/60 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#565449]/15 text-[#1A1A18] border border-[#565449]/20 flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Phone &amp; WhatsApp</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Speak directly with our concierge desk or chat on WhatsApp for immediate sizing confirmation before dispatch.
            </p>
          </div>

          <div className="pt-2 border-t border-[#565449]/20 space-y-2">
            <a
              href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`}
              className="text-xs font-bold text-[#1A1A18] hover:underline block"
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
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A1A18] hover:underline"
              >
                <span>Chat on WhatsApp</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Studio & Workshop Location Card */}
        <div className="p-6 rounded-2xl bg-[#A0988A]/20 border border-[#A0988A]/40 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#565449]/60 transition-colors">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#565449]/15 text-[#1A1A18] border border-[#565449]/20 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Heritage Workshop</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Bazaar-e-Kissa Khwani, Old Peshawar, Khyber Pakhtunkhwa, Pakistan.
            </p>
          </div>

          <div className="pt-2 border-t border-[#565449]/20 flex items-center gap-2 text-xs text-[#1A1A18]/80">
            <Clock className="w-4 h-4 text-[#1A1A18] shrink-0" />
            <span>Mon – Sat: 10:00 AM – 9:00 PM PKT</span>
          </div>
        </div>
      </div>

      {/* Main Inquiry Form & FAQ Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-[#A0988A]/20 rounded-3xl border border-[#A0988A]/40 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1 pb-4 border-b border-[#565449]/20">
            <h2 className="font-serif font-bold text-2xl text-[#1A1A18]">Send Us an Inquiry</h2>
            <p className="text-xs text-[#1A1A18]/80">
              Leave your details below and our concierge team will reach out directly via email or phone.
            </p>
          </div>

          {submitted ? (
            <div className="py-10 px-6 rounded-2xl bg-[#565449]/10 border border-[#565449]/30 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-[#1A1A18] mx-auto" />
              <h3 className="font-serif font-bold text-xl text-[#1A1A18]">Message Received!</h3>
              <p className="text-xs sm:text-sm text-[#1A1A18]/80 max-w-md mx-auto">
                Thank you for contacting us. A member of our artisan team has received your message and will respond to your email at <span className="font-bold text-[#1A1A18]">{supportEmail}</span> shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 px-5 py-2.5 rounded-xl bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] text-xs font-bold transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[#565449]/15 border border-[#565449]/40 text-[#1A1A18] text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A18] mb-1">
                    Your Name <span className="text-[#1A1A18]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-xs text-[#1A1A18] placeholder:text-[#1A1A18]/50 focus:bg-[#F7F4EB] focus:border-[#565449] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A18] mb-1">
                    Email Address <span className="text-[#1A1A18]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-xs text-[#1A1A18] placeholder:text-[#1A1A18]/50 focus:bg-[#F7F4EB] focus:border-[#565449] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1A18] mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-xs text-[#1A1A18] placeholder:text-[#1A1A18]/50 focus:bg-[#F7F4EB] focus:border-[#565449] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A18] mb-1">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-xs text-[#1A1A18] focus:bg-[#F7F4EB] focus:border-[#565449] focus:outline-none transition-all cursor-pointer font-medium"
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
                <label className="block text-xs font-bold text-[#1A1A18] mb-1">
                  Message Details <span className="text-[#1A1A18]">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="How can our master craftsmen help you today?"
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4EB] border border-[#565449]/30 text-xs text-[#1A1A18] placeholder:text-[#1A1A18]/50 focus:bg-[#F7F4EB] focus:border-[#565449] focus:outline-none transition-all resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#F7F4EB] border-t-transparent rounded-full animate-spin" />
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
          <div className="p-6 rounded-3xl bg-[#A0988A]/20 border border-[#A0988A]/40 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Quick Help &amp; FAQs</h3>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              Looking for quick answers about doorstep COD delivery, tire rubber soles, or how our camera measurement algorithm calculates size?
            </p>
            <div className="space-y-2 pt-2">
              <Link
                to="/faqs"
                className="flex items-center justify-between p-3 rounded-xl bg-[#F7F4EB] border border-[#565449]/20 text-xs font-bold text-[#1A1A18] hover:bg-[#565449] hover:text-[#F7F4EB] transition-all shadow-2xs group"
              >
                <span>Read Frequently Asked Questions (FAQs)</span>
                <ArrowRight className="w-4 h-4 text-[#1A1A18] group-hover:text-[#F7F4EB]" />
              </Link>
              <Link
                to="/size-finder"
                className="flex items-center justify-between p-3 rounded-xl bg-[#F7F4EB] border border-[#565449]/20 text-xs font-bold text-[#1A1A18] hover:bg-[#565449] hover:text-[#F7F4EB] transition-all shadow-2xs group"
              >
                <span>Scan Foot Size on A4 Paper</span>
                <ArrowRight className="w-4 h-4 text-[#1A1A18] group-hover:text-[#F7F4EB]" />
              </Link>
              <Link
                to="/orders"
                className="flex items-center justify-between p-3 rounded-xl bg-[#F7F4EB] border border-[#565449]/20 text-xs font-bold text-[#1A1A18] hover:bg-[#565449] hover:text-[#F7F4EB] transition-all shadow-2xs group"
              >
                <span>Track an Existing Order</span>
                <ArrowRight className="w-4 h-4 text-[#1A1A18] group-hover:text-[#F7F4EB]" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#A0988A]/20 border border-[#A0988A]/40 space-y-3">
            <h4 className="font-serif font-bold text-base text-[#1A1A18]">Exchange &amp; Returns Guarantee</h4>
            <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
              We stand 100% behind our craftsmanship. If you receive a pair that does not fit your bridge comfortably, our concierge will arrange a smooth doorstep size exchange across Pakistan.
            </p>
            <p className="text-[11px] font-bold text-[#1A1A18]">
              Direct Contact: {supportEmail}
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
