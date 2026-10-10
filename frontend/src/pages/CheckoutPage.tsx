import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ShieldCheck, Truck, Wallet, CheckCircle, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { apiService } from '../services/api';
import type { ShippingAddress, CartItem } from '../types';
import type { PromoCode } from '../types/admin';
import { SEOHelmet } from '../components/common/SEOHelmet';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart, updateQuantity, updateSize, removeFromCart } = useCart();
  const { formatPrice, settings } = useStoreSettings();

  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
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

    if (!address.whatsapp || !address.whatsapp.trim()) {
      alert('Please provide a mandatory WhatsApp number for order tracking and dispatch updates.');
      return;
    }

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
        <h2 className="font-serif font-bold text-2xl text-[#1A1A18]">No items to checkout</h2>
        <p className="text-[#1A1A18]/80 text-sm">Please add items to your shopping bag before proceeding to checkout.</p>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <SEOHelmet
        title="Checkout Order"
        description="Complete your order for handcrafted Peshawari Chappals with secure payment."
      />

      <div className="border-b border-[#A0988A]/40 pb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-1">
          Finalize Purchase
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A18]">
          Artisan Order Checkout
        </h1>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Shipping Address Section */}
          <div className="space-y-4 pb-6 border-b border-[#A0988A]/40">
            <h2 className="font-serif font-bold text-xl text-[#1A1A18]">1. Delivery Address</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={e => setAddress({ ...address, fullName: e.target.value })}
                  placeholder="e.g. Muhammad Ali Khan"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-sm text-[#1A1A18] placeholder-[#1A1A18]/45 focus:outline-none focus:border-[#565449]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={address.email}
                  onChange={e => setAddress({ ...address, email: e.target.value })}
                  placeholder="e.g. alikhan@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-sm text-[#1A1A18] placeholder-[#1A1A18]/45 focus:outline-none focus:border-[#565449]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
                  Calling Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={address.phone}
                  onChange={e => {
                    const val = e.target.value;
                    setAddress(prev => ({
                      ...prev,
                      phone: val,
                      whatsapp: sameAsPhone ? val : prev.whatsapp
                    }));
                  }}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-sm text-[#1A1A18] placeholder-[#1A1A18]/45 focus:outline-none focus:border-[#565449]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#1A1A18] block">
                    WhatsApp Number <span className="text-red-600 font-bold">* Mandatory</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#1A1A18]/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={e => {
                        const checked = e.target.checked;
                        setSameAsPhone(checked);
                        if (checked) {
                          setAddress(prev => ({ ...prev, whatsapp: prev.phone }));
                        }
                      }}
                      className="rounded border-[#A0988A] text-[#565449] focus:ring-0 cursor-pointer"
                    />
                    <span>Same as calling</span>
                  </label>
                </div>
                <input
                  type="tel"
                  required
                  value={address.whatsapp || ''}
                  onChange={e => {
                    setSameAsPhone(false);
                    setAddress({ ...address, whatsapp: e.target.value });
                  }}
                  placeholder="e.g. 0300-1234567 (for order tracking)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-sm text-[#1A1A18] placeholder-[#1A1A18]/45 focus:outline-none focus:border-[#565449]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address.city}
                  onChange={e => setAddress({ ...address, city: e.target.value })}
                  placeholder="e.g. Peshawar, Lahore, Islamabad, Karachi"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-sm text-[#1A1A18] placeholder-[#1A1A18]/45 focus:outline-none focus:border-[#565449]"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
                  Country
                </label>
                <input
                  type="text"
                  readOnly
                  value={address.country || 'Pakistan'}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/10 border border-[#A0988A]/50 text-sm text-[#1A1A18]/80 cursor-default"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#1A1A18] block mb-1">
                  Street Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address.address}
                  onChange={e => setAddress({ ...address, address: e.target.value })}
                  placeholder="e.g. House #14, Street 3, Sector F-7/2, Near Jamia Masjid"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#A0988A]/20 border border-[#A0988A] text-sm text-[#1A1A18] placeholder-[#1A1A18]/45 focus:outline-none focus:border-[#565449]"
                />
              </div>
            </div>
          </div>

          {/* Shipping Method Section */}
          <div className="space-y-4 pb-6 border-b border-[#A0988A]/40">
            <h2 className="font-serif font-bold text-xl text-[#1A1A18]">2. Shipping Method</h2>
            
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
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    shippingMethod === method.id
                      ? 'bg-[#565449] border-[#565449] text-[#F7F4EB] shadow-xs'
                      : 'bg-[#A0988A]/20 border-[#A0988A] text-[#1A1A18] hover:border-[#565449]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{method.label}</span>
                    <span className={shippingMethod === method.id ? 'text-[#F7F4EB]' : 'text-[#1A1A18]'}>
                      {method.price}
                    </span>
                  </div>
                  <span className={`text-[11px] block mt-1 ${shippingMethod === method.id ? 'text-[#F7F4EB]/80' : 'text-[#1A1A18]/70'}`}>{method.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="space-y-4">
            <h2 className="font-serif font-bold text-xl text-[#1A1A18]">3. Payment Gateway</h2>
            
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
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#565449] border-[#565449] text-[#F7F4EB] shadow-xs'
                        : 'bg-[#A0988A]/20 border-[#A0988A] text-[#1A1A18] hover:border-[#565449]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#F7F4EB]' : 'text-[#1A1A18]'}`} />
                    <span className="font-bold text-xs block">{pm.label}</span>
                    <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-[#F7F4EB]/80' : 'text-[#1A1A18]/70'}`}>{pm.note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Review Sidebar */}
        <div className="lg:col-span-4 bg-[#A0988A]/25 border border-[#A0988A] rounded-2xl p-6 space-y-5 sticky top-24 shadow-xs">
          <h2 className="font-serif font-bold text-xl text-[#1A1A18] pb-3 border-b border-[#A0988A]/40">
            Order Summary
          </h2>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-[#A0988A]/30">
            {activeItems.map(item => {
              const availableSizes = Array.isArray(item.product.availableSizes) && item.product.availableSizes.length > 0
                ? item.product.availableSizes
                : [7, 8, 9, 10, 11, 12, 13];
              const itemTotal = (Number(item.product.price) || 0) * (Number(item.quantity) || 1);
              const colorDisplay = (item.selectedColor || 'saddle-tan').toString().replace(/-/g, ' ');

              return (
                <div key={item.id} className="pt-2.5 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#1A1A18] truncate">{item.product.name}</h4>
                      <p className="text-[#1A1A18]/70 text-[11px] capitalize">{colorDisplay}</p>
                    </div>
                    <span className="font-bold text-xs text-[#1A1A18] shrink-0">
                      {formatPrice(itemTotal)}
                    </span>
                  </div>

                  {/* Size Dropdown & Quantity Stepper */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#1A1A18]">Size:</span>
                      <select
                        value={item.size}
                        onChange={(e) => updateSize(item.id, Number(e.target.value))}
                        className="px-2 py-0.5 bg-[#F7F4EB] border border-[#A0988A] rounded-lg text-xs font-bold text-[#1A1A18] focus:outline-none focus:border-[#565449] cursor-pointer"
                        title="Change size"
                      >
                        {availableSizes.map(s => (
                          <option key={s} value={s}>Size {s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-[#F7F4EB] border border-[#A0988A] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold min-w-[1.25rem] text-center text-[#1A1A18]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-[#1A1A18]/60 hover:text-red-700 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Promo Code Entry in Checkout */}
          <div className="pt-3 border-t border-[#A0988A]/40 space-y-2">
            <label className="text-xs font-semibold text-[#1A1A18] uppercase tracking-wider block">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={e => setPromoCodeInput(e.target.value)}
                placeholder="Enter promo code"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-[#1A1A18] uppercase font-semibold focus:outline-none focus:border-[#565449]"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-3.5 py-2 bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] border border-[#565449] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Apply
              </button>
            </div>

            {appliedPromo && (
              <div className="p-2 rounded-xl bg-[#A0988A]/30 border border-[#565449]/30 text-[#1A1A18] text-xs font-medium flex items-center justify-between">
                <span>Code <strong>{appliedPromo.code}</strong> applied!</span>
                <button type="button" onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="text-[#1A1A18] underline text-[10px] cursor-pointer">Remove</button>
              </div>
            )}

            {promoError && (
              <p className="text-xs text-[#1A1A18] font-medium">{promoError}</p>
            )}
          </div>

          <div className="space-y-3 text-sm text-[#1A1A18]/80 border-t border-[#A0988A]/40 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#1A1A18]">{formatPrice(currentSubtotal)}</span>
            </div>

            {appliedPromo && (
              <div className="flex justify-between text-[#1A1A18] font-semibold">
                <span>Promo Discount ({appliedPromo.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-[#1A1A18]">{shippingFee === 0 ? <strong className="text-[#1A1A18]">FREE</strong> : formatPrice(shippingFee)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#A0988A]/40 flex justify-between items-baseline">
            <span className="font-serif font-bold text-lg text-[#1A1A18]">Total Payable</span>
            <span className="font-serif font-bold text-3xl text-[#1A1A18]">{formatPrice(total)}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] border border-[#565449] py-3.5 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <span>Confirming Order...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-[#F7F4EB]" />
                Place Order Now
              </>
            )}
          </button>

          <div className="pt-1 text-center text-xs text-[#1A1A18]/70 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1A1A18]" /> 100% Encrypted &amp; Authenticated Order
          </div>
        </div>
      </form>
    </div>
  );
};
