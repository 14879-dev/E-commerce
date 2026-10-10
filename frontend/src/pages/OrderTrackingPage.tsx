import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Search, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, Check, Sparkles, Home } from 'lucide-react';
import { apiService } from '../services/api';
import type { Order } from '../types';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { PageHero } from '../components/common/PageHero';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { formatPrice } = useStoreSettings();

  const isJustPlaced = Boolean((location.state as any)?.justPlaced);

  const [searchId, setSearchId] = useState(id || '');
  const [order, setOrder] = useState<Order | null>((location.state as any)?.order || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replacement Request Modal State
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementReason, setReplacementReason] = useState('');
  const [isSubmittingReplacement, setIsSubmittingReplacement] = useState(false);

  // Privacy helpers
  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const clean = phone.replace(/[^0-9+]/g, '');
    if (clean.length <= 4) return clean;
    return clean.slice(0, 3) + '••••' + clean.slice(-3);
  };

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `•••@${domain}`;
    return `${user[0]}•••${user[user.length - 1]}@${domain}`;
  };

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getOrder(orderId);
      if (data) {
        setOrder(data);
        setSearchId(data.orderNumber || orderId);
      } else {
        setError(`No order found matching "${orderId}"`);
        setOrder(null);
      }
    } catch {
      setError('Error retrieving order status');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      loadOrder(searchId.trim());
    }
  };

  const handleRequestReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !replacementReason.trim()) return;

    setIsSubmittingReplacement(true);
    try {
      const updated = await apiService.requestReplacement(order.id, replacementReason);
      setOrder(updated);
      setShowReplacementModal(false);
    } catch {
      alert('Could not submit replacement request.');
    } finally {
      setIsSubmittingReplacement(false);
    }
  };

  return (
    <div className="w-full">
      <SEOHelmet
        title={isJustPlaced ? "Thank You For Your Order - Tracking" : "Live Order Tracking"}
        description="Track the handcrafted progress, quality check, and shipping status of your Peshawari Chappal order."
      />

      <PageHero
        badge="Real-Time Verification"
        title="Live Order Tracking"
        subtitle="Artisan Craft to Doorstep Delivery"
        description="Follow every milestone of your Peshawari pair — from hand-lasting and sole stitching to courier transit."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Thank You & Order Confirmation Celebration Hero */}
        {isJustPlaced && (
        <div className="rounded-3xl p-6 sm:p-8 bg-[#A0988A]/25 border-2 border-[#565449]/40 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#A0988A]/40">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#565449] text-[#F7F4EB] flex items-center justify-center shadow-lg shrink-0">
                <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#A0988A]/35 text-[#1A1A18] text-xs font-bold uppercase tracking-wider mb-1 border border-[#565449]/30">
                  <Sparkles className="w-3 h-3 text-[#1A1A18]" /> Order Placed Successfully
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A18]">
                  Thank You For Your Order!
                </h1>
                <p className="text-xs sm:text-sm text-[#1A1A18]/80 mt-0.5">
                  We've received your handcrafted order and our master artisans have begun preparing your pair.
                </p>
              </div>
            </div>

            {(order?.orderNumber || id) && (
              <div className="sm:text-right bg-[#F7F4EB]/60 backdrop-blur-xs px-4 py-3 rounded-2xl border border-[#A0988A] shadow-xs shrink-0">
                <span className="text-[10px] font-bold text-[#1A1A18]/80 uppercase tracking-wider block">Your Order ID</span>
                <span className="font-mono text-lg sm:text-xl font-extrabold text-[#1A1A18]">#{order?.orderNumber || id}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Bar Container */}
      <div className="bg-[#A0988A]/20 border border-[#A0988A] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18] block">Doorstep Verification</span>
            <h2 className="font-serif font-bold text-2xl text-[#1A1A18] mt-0.5">Track Your Order Status</h2>
            <p className="text-xs text-[#1A1A18]/80 mt-0.5">Enter your order reference code (e.g. PSH-2026-...) to view live progress.</p>
          </div>
          <div className="flex items-center gap-2.5 bg-[#F7F4EB] px-3.5 py-1.5 rounded-xl border border-[#565449]/35 shadow-xs shrink-0 self-start sm:self-auto">
            <img src="/leopards-logo.png" alt="Leopards Courier" className="h-6 w-auto object-contain" />
            <span className="text-[10px] font-bold text-[#1A1A18] uppercase tracking-wider">Logistics Partner</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#1A1A18]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="e.g. PSH-2026-..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-sm text-[#1A1A18] placeholder:text-[#1A1A18]/60 focus:outline-none focus:border-[#565449]"
            />
          </div>
          <button
            type="submit"
            className="btn-copper text-xs py-2.5 px-6 font-bold"
          >
            Track
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#1A1A18]">
          Loading live tracking timeline...
        </div>
      ) : error ? (
        <div className="py-10 text-center text-[#1A1A18] space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-[#1A1A18]" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : order ? (
        <div className="space-y-6">
          
          {/* Order Reference Summary Line Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#A0988A]/40">
            <div>
              <span className="text-xs text-[#1A1A18] uppercase tracking-wider font-semibold block">Order Reference</span>
              <h2 className="font-serif font-bold text-2xl text-[#1A1A18]">{order.orderNumber}</h2>
              <span className="text-xs text-[#1A1A18]/70">Placed on {order.date}</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#1A1A18]/80 block">Status</span>
              <span className="px-3 py-1 rounded-full bg-[#565449] text-[#F7F4EB] border border-[#565449] text-xs font-bold uppercase tracking-wider inline-block mt-1">
                {order.status}
              </span>
            </div>
          </div>

          {/* Interactive Timeline Milestone Visualizer */}
          <div className="py-4 space-y-6">
            <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Artisan Milestone Timeline</h3>
            
            <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
              {/* Desktop Timeline Connecting Line */}
              <div className="hidden md:block absolute top-5 left-10 right-10 h-0.5 bg-[#A0988A]/40 -z-0" />

              {order.trackingSteps.map((step, idx) => (
                <div key={idx} className="relative z-10 flex md:flex-col items-start md:items-center gap-4 md:gap-2 max-w-xs">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${
                    step.completed
                      ? 'bg-[#565449] text-[#F7F4EB] border-[#565449] shadow-xs'
                      : 'bg-[#F7F4EB] text-[#1A1A18] border-[#A0988A]'
                  }`}>
                    {step.completed ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div className="md:text-center">
                    <h4 className={`font-serif font-bold text-sm ${step.completed ? 'text-[#1A1A18]' : 'text-[#1A1A18]/60'}`}>
                      {step.status}
                    </h4>
                    <span className="text-[11px] text-[#1A1A18] font-semibold block">{step.date}</span>
                    <p className="text-xs text-[#1A1A18]/80 mt-0.5 leading-snug">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Manifest & Shipping Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-[#A0988A]/40">
            <div className="md:col-span-8 space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Order Manifest</h3>

              <div className="space-y-2.5">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#A0988A]/20 border border-[#A0988A]">
                    <div className="flex items-center gap-3">
                      <img src={item.product.images.front} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div>
                        <h4 className="font-semibold text-sm text-[#1A1A18]">{item.product.name}</h4>
                        <p className="text-xs text-[#1A1A18]/80">Size {item.size} • Color: {item.selectedColor}</p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[#1A1A18] text-sm">
                      {formatPrice((item.product?.price || 0) * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Replacement Request Action */}
              <div className="pt-4 border-t border-[#A0988A]/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-semibold text-sm text-[#1A1A18]">Need a Size Exchange?</h4>
                  <p className="text-xs text-[#1A1A18]/80">Items are eligible for size exchange and replacement protection.</p>
                </div>

                {order.replacementRequested ? (
                  <span className="px-3 py-1 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449] text-xs font-semibold">
                    Replacement Pending ({order.replacementStatus})
                  </span>
                ) : (
                  <button
                    onClick={() => setShowReplacementModal(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#565449] text-[#F7F4EB] border border-[#565449] hover:bg-[#45433A] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Request Replacement
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Details */}
            <div className="md:col-span-4 space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#A0988A]/40">
                <h3 className="font-serif font-bold text-lg text-[#1A1A18]">Delivery Details</h3>
              </div>
              <div className="text-xs text-[#1A1A18] space-y-1.5 pt-1">
                <p className="font-bold text-[#1A1A18] text-sm">{order.shippingAddress.fullName}</p>
                <p className="text-[#1A1A18]/80">Delivering to: <span className="font-semibold text-[#1A1A18]">{order.shippingAddress.city}, {order.shippingAddress.country}</span></p>
                <p>Contact: <span className="font-mono text-[#1A1A18]">{maskEmail(order.shippingAddress.email)}</span></p>
                <p>Phone: <span className="font-mono text-[#1A1A18]">{maskPhone(order.shippingAddress.phone)}</span></p>
              </div>
              {/* Privacy Notice */}
              <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-[#A0988A]/25 border border-[#A0988A]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1A1A18] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#1A1A18] leading-snug">
                  Contact details are partially masked for your privacy and security.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Navigation & Support Action Bar */}
          <div className="pt-6 border-t border-[#A0988A]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#1A1A18]/80 text-center sm:text-left">
              Need assistance with your handcrafted pair? Reach out to our <Link to="/contact" className="text-[#1A1A18] font-semibold underline hover:text-[#45433A]">Artisan Support Team</Link>.
            </p>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                to="/products"
                className="btn-copper text-xs py-2.5 px-5 inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-md"
              >
                Explore Products <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/"
                className="btn-glass text-xs py-2.5 px-4 inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                <Home className="w-3.5 h-3.5" /> Home
              </Link>
            </div>
          </div>

          {/* Replacement Request Modal */}
          {showReplacementModal && (
            <div className="fixed inset-0 z-50 bg-[#565449]/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#F7F4EB] rounded-2xl p-6 max-w-md w-full border border-[#A0988A] shadow-xl space-y-4">
                <h3 className="font-serif font-bold text-xl text-[#1A1A18]">Request Size / Model Replacement</h3>
                <p className="text-xs text-[#1A1A18]/80 leading-relaxed">
                  Describe your fit issue or replacement preference. Our team will arrange doorstep pickup.
                </p>

                <textarea
                  rows={3}
                  required
                  value={replacementReason}
                  onChange={e => setReplacementReason(e.target.value)}
                  placeholder="e.g. Size 9 is too tight around instep, need replacement with Size 10..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-[#1A1A18] text-sm focus:border-[#565449] focus:outline-none"
                />

                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowReplacementModal(false)} className="btn-glass text-xs py-2 px-4 cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleRequestReplacement} disabled={isSubmittingReplacement} className="btn-copper text-xs py-2 px-5 cursor-pointer">
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
};
