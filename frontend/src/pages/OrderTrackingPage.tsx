import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, RefreshCw, AlertCircle, Check, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/api';
import type { Order } from '../types';
import { SEOHelmet } from '../components/common/SEOHelmet';

// ─── Privacy Helpers ───────────────────────────────────────
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';
  const maskedLocal = local.length > 2 ? local[0] + '***' : '***';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0][0] + '***';
  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
};

const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '***-***-****';
  const prefix = phone.substring(0, Math.ceil(phone.length * 0.35));
  const suffix = phone.slice(-3);
  return `${prefix}${'*'.repeat(phone.length - prefix.length - suffix.length - 1)} ${suffix}`;
};

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchId, setSearchId] = useState(id || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replacement Form State
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementReason, setReplacementReason] = useState('');
  const [isSubmittingReplacement, setIsSubmittingReplacement] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
    // no auto-load of demo order
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getOrderById(orderId);
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
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      <SEOHelmet
        title="Live Order Tracking"
        description="Track the handcrafted progress, quality check, and shipping status of your Peshawari Chappal order."
      />

      {/* Main Order Tracking Header - Open Layout with Divider Line */}
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
            Artisan Status Tracker
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            Live Order Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor your handcrafted pair step-by-step from leather cutting to doorstep delivery.
          </p>
        </div>

        {/* Order Search Form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="Enter Order ID (e.g. PSH-89210)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-copper text-xs sm:text-sm py-2.5 px-6 whitespace-nowrap">
            Track Order
          </button>
        </form>

        {/* Privacy Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Enter your exact order ID as shown in your confirmation email.</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          Loading live tracking timeline...
        </div>
      ) : error ? (
        <div className="py-10 text-center text-rose-500 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      ) : order ? (
        <div className="space-y-6">
          
          {/* Order Reference Summary Line Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs text-blue-600 uppercase tracking-wider font-semibold block">Order Reference</span>
              <h2 className="font-serif font-bold text-2xl text-slate-900">{order.orderNumber}</h2>
              <span className="text-xs text-slate-500">Placed on {order.date}</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Status</span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold uppercase tracking-wider inline-block mt-1">
                {order.status}
              </span>
            </div>
          </div>

          {/* Interactive Timeline Milestone Visualizer */}
          <div className="py-4 space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-900">Artisan Milestone Timeline</h3>
            
            <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-2">
              {/* Desktop Timeline Connecting Line */}
              <div className="hidden md:block absolute top-5 left-10 right-10 h-0.5 bg-slate-200 -z-0" />

              {order.trackingSteps.map((step, idx) => (
                <div key={idx} className="relative z-10 flex md:flex-col items-start md:items-center gap-4 md:gap-2 max-w-xs">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${
                    step.completed
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}>
                    {step.completed ? <Check className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div className="md:text-center">
                    <h4 className={`font-serif font-bold text-sm ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.status}
                    </h4>
                    <span className="text-[11px] text-blue-600 font-semibold block">{step.date}</span>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Manifest & Shipping Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-slate-200">
            <div className="md:col-span-8 space-y-4">
              <h3 className="font-serif font-bold text-lg text-slate-900">Order Manifest</h3>

              <div className="space-y-2.5">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-3">
                      <img src={item.product.images.front} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg" />
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">{item.product.name}</h4>
                        <p className="text-xs text-slate-500">EU {item.size} • Color: {item.selectedColor}</p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-slate-900 text-sm">
                      ${(item.customizationDetails ? item.customizationDetails.customPrice : item.product.price) * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Replacement Request Action */}
              {!order.isCustomizedOrder && (
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-serif font-semibold text-sm text-slate-900">Need a Size Exchange?</h4>
                    <p className="text-xs text-slate-500">Standard items are eligible for replacement protection.</p>
                  </div>

                  {order.replacementRequested ? (
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                      Replacement Pending ({order.replacementStatus})
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowReplacementModal(true)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Request Replacement
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Details — Privacy Masked */}
            <div className="md:col-span-4 space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <h3 className="font-serif font-bold text-lg text-slate-900">Delivery Details</h3>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
                <p className="text-slate-500">Delivering to: <span className="font-semibold text-slate-700">{order.shippingAddress.city}, {order.shippingAddress.country}</span></p>
                <p>Contact: <span className="font-mono text-slate-700">{maskEmail(order.shippingAddress.email)}</span></p>
                <p>Phone: <span className="font-mono text-slate-700">{maskPhone(order.shippingAddress.phone)}</span></p>
              </div>
              {/* Privacy Notice */}
              <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-600 leading-snug">
                  Contact details are partially masked for your privacy and security.
                </p>
              </div>
            </div>
          </div>

          {/* Replacement Request Modal */}
          {showReplacementModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
                <h3 className="font-serif font-bold text-xl text-slate-900">Request Size / Model Replacement</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Describe your fit issue or replacement preference. Our team will arrange doorstep pickup.
                </p>

                <textarea
                  rows={3}
                  required
                  value={replacementReason}
                  onChange={e => setReplacementReason(e.target.value)}
                  placeholder="e.g. EU 42 is too tight around instep, need replacement with EU 43..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-blue-600 focus:outline-none"
                />

                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowReplacementModal(false)} className="btn-glass text-xs py-2 px-4">
                    Cancel
                  </button>
                  <button onClick={handleRequestReplacement} disabled={isSubmittingReplacement} className="btn-copper text-xs py-2 px-5">
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
