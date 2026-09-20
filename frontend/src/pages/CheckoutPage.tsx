import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ShieldCheck, Truck, Wallet, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { apiService } from '../services/api';
import type { ShippingAddress, CartItem } from '../types';
import type { PromoCode } from '../types/admin';
import { SEOHelmet } from '../components/common/SEOHelmet';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart } = useCart();
  const { formatPrice, settings } = useStoreSettings();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Pakistan'
  });

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'easypaisa' | 'jazzcash'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active items with instant localStorage fallback
  const storedItems: CartItem[] = (() => {
    try {
      const saved = localStorage.getItem('psh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();
  const activeItems: CartItem[] = items.length > 0 ? items : storedItems;

  const currentSubtotal = activeItems.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  // Promo code state
  const initialPromoCode = (location.state as any)?.appliedPromoCode || '';
  const [promoCodeInput, setPromoCodeInput] = useState(initialPromoCode);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPromoCode) {
      apiService.getPromoCodes().then(promos => {
        const match = promos.find(p => p.code.toUpperCase() === initialPromoCode.toUpperCase() && p.active);
        if (match && currentSubtotal >= match.minOrderValue) {
          setAppliedPromo(match);
        }
      });
    }
  }, [initialPromoCode, currentSubtotal]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setPromoError(null);
    try {
      const promos = await apiService.getPromoCodes();
      const match = promos.find(p => p.code.toUpperCase() === promoCodeInput.trim().toUpperCase() && p.active);

      if (!match) {
        setPromoError('Invalid or expired promo code.');
        setAppliedPromo(null);
        return;
      }

      if (currentSubtotal < match.minOrderValue) {
        setPromoError(`Minimum order of ${formatPrice(match.minOrderValue)} required for this code.`);
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(match);
      setPromoError(null);
    } catch {
      setPromoError('Failed to apply promo code.');
    }
  };

  // Discount Calculation
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discountAmount = (currentSubtotal * appliedPromo.value) / 100;
    } else {
      discountAmount = appliedPromo.value;
    }
  }

  const effectiveSubtotal = Math.max(0, currentSubtotal - discountAmount);

  // Free shipping policy rule matching Admin Settings
  const isFreeShipping = 
    settings.freeShippingMode === 'all' ||
    (settings.freeShippingMode === 'threshold' && effectiveSubtotal >= settings.freeShippingThreshold) ||
    (settings.freeShippingMode === 'product-specific' && activeItems.some(i => i.product.freeShipping)) ||
    activeItems.some(i => i.product.freeShipping);

  const shippingFee = shippingMethod === 'standard'
    ? (isFreeShipping ? 0 : settings.standardShippingFee)
    : settings.expressShippingFee;

  const total = effectiveSubtotal + shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const order = await apiService.createOrder({
        items: activeItems,
        shippingAddress: address,
        shippingMethod,
        paymentMethod,
        subtotal: currentSubtotal,
        shippingFee,
        discount: discountAmount,
        total,
        promoCode: appliedPromo?.code
      } as any);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      clearCart();
      const orderTargetId = order.orderNumber || order.id || (order as any)._id;
      navigate(`/orders/${orderTargetId}`, {
        state: {
          justPlaced: true,
          orderNumber: order.orderNumber,
          order
        }
      });
    } catch (err) {
      console.error('Order submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeItems.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-lg mx-auto">
        <h2 className="font-serif font-bold text-2xl text-slate-900">No items to checkout</h2>
        <p className="text-slate-500 text-sm">Please add items to your shopping bag before proceeding to checkout.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button onClick={() => navigate('/products')} className="btn-copper text-xs py-2.5 px-6">
            View Catalog
          </button>
          <button onClick={() => navigate('/')} className="btn-glass text-xs py-2.5 px-6">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <SEOHelmet
        title="Checkout Order"
        description="Complete your order for handcrafted Peshawari Chappals with secure payment."
      />

      <div className="border-b border-slate-200 pb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
          Finalize Purchase
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Artisan Order Checkout
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Shipping Address Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h2 className="font-serif font-bold text-xl text-slate-900">1. Delivery Address</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text" required value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email" required value={address.email} onChange={e => setAddress({ ...address, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel" required value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                <input
                  type="text" required value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text" required value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Shipping Method Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <h2 className="font-serif font-bold text-xl text-slate-900">2. Shipping Method</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'standard',
                  label: 'Standard Delivery (3-5 Days)',
                  price: isFreeShipping ? 'FREE' : formatPrice(settings.standardShippingFee),
                  note: isFreeShipping ? 'Free shipping applied' : 'Nationwide tracked delivery'
                },
                {
                  id: 'express',
                  label: 'Express Courier (1-2 Days)',
                  price: formatPrice(settings.expressShippingFee),
                  note: 'Priority dispatch & fast delivery'
                }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setShippingMethod(method.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    shippingMethod === method.id
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{method.label}</span>
                    <span className={method.price === 'FREE' ? 'text-emerald-600 font-extrabold' : 'text-blue-600'}>
                      {method.price}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">{method.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-xl text-slate-900">3. Payment Gateway</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'cod', label: 'Cash on Delivery', icon: Truck, note: 'Pay at Doorstep (All Pakistan)' },
                { id: 'easypaisa', label: 'Easypaisa Mobile Wallet', icon: Wallet, note: 'Instant Mobile Transfer' },
                { id: 'jazzcash', label: 'JazzCash Wallet', icon: Wallet, note: 'Instant Mobile Transfer' }
              ].map(pm => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs block">{pm.label}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{pm.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 sticky top-24 shadow-xs">
          <h2 className="font-serif font-bold text-xl text-slate-900 pb-3 border-b border-slate-200">
            Order Manifest
          </h2>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {activeItems.map((item: CartItem) => {
              if (!item || !item.product) return null;
              const imgUrl = (item.product.images && (item.product.images.front || (Array.isArray(item.product.images.gallery) && item.product.images.gallery[0]))) || '';
              const itemTotal = (Number(item.product.price) || 0) * (Number(item.quantity) || 1);
              const colorDisplay = (item.selectedColor || 'saddle-tan').toString().replace(/-/g, ' ');

              return (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={imgUrl} alt={item.product.name} className="w-10 h-10 object-cover rounded-lg bg-white border" />
                    <div>
                      <h4 className="font-semibold text-slate-900 line-clamp-1">{item.product.name}</h4>
                      <span className="text-slate-500">Qty: {item.quantity || 1} • Size {item.size} • <span className="capitalize">{colorDisplay}</span></span>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-slate-900">{formatPrice(itemTotal)}</span>
                </div>
              );
            })}
          </div>

          {/* Promo Code Entry in Checkout */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={e => setPromoCodeInput(e.target.value)}
                placeholder="Enter promo code"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 uppercase font-semibold focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Apply
              </button>
            </div>

            {appliedPromo && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-between">
                <span>Code <strong>{appliedPromo.code}</strong> applied!</span>
                <button type="button" onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="text-emerald-800 underline text-[10px]">Remove</button>
              </div>
            )}

            {promoError && (
              <p className="text-xs text-rose-500 font-medium">{promoError}</p>
            )}
          </div>

          <div className="space-y-3 text-sm text-slate-500 border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatPrice(currentSubtotal)}</span>
            </div>

            {appliedPromo && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Promo Discount ({appliedPromo.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-slate-900">{shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : formatPrice(shippingFee)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
            <span className="font-serif font-bold text-lg text-slate-900">Total Payable</span>
            <span className="font-serif font-bold text-3xl text-slate-900">{formatPrice(total)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Confirming Order...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-white" />
                Place Order Now
              </>
            )}
          </button>

          <div className="pt-1 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> 100% Encrypted & Authenticated Order
          </div>
        </div>
      </form>
    </div>
  );
};
