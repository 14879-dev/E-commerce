import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, Check, AlertCircle, Home } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { SEOHelmet } from '../components/common/SEOHelmet';
import { apiService } from '../services/api';
import type { PromoCode } from '../types/admin';

export const ShoppingBagPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, subtotal, itemCount } = useCart();
  const { settings, formatPrice } = useStoreSettings();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Free shipping check
  const isFreeShipping = settings.freeShippingMode === 'all'
    || (settings.freeShippingMode === 'threshold' && subtotal >= settings.freeShippingThreshold)
    || (settings.freeShippingMode === 'product-specific' && items.some(i => i.product.freeShipping));

  const shippingFee = isFreeShipping ? 0 : settings.standardShippingFee;

  // Calculate discount
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * appliedPromo.value) / 100);
    } else {
      discountAmount = appliedPromo.value;
    }
  }

  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);
  const total = effectiveSubtotal + shippingFee;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setIsApplyingPromo(true);
    setPromoError('');

    try {
      const res = await apiService.validatePromoCode(promoCodeInput.trim(), subtotal);
      if (res.valid && res.promoCode) {
        setAppliedPromo(res.promoCode);
        setPromoError('');
      } else {
        setPromoError(res.message || 'Invalid promotion code.');
        setAppliedPromo(null);
      }
    } catch {
      setPromoError('Failed to validate promotional code. Please try again.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <SEOHelmet
        title="Your Shopping Bag — Peshawari Chappal Co."
        description="Review your selected handcrafted Peshawari leather chappals and proceed to secure checkout."
      />

      {/* Page Header */}
      <div className="border-b border-[#A0988A]/40 pb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#1A1A18] block mb-1">
          Review Your Order
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1A18]">
          Your Shopping Bag
        </h1>
        <p className="text-sm text-[#1A1A18]/80 mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart. {
            settings.freeShippingMode === 'all'
              ? 'Free Nationwide Shipping on all orders!'
              : settings.freeShippingMode === 'threshold'
              ? `Free shipping on orders over ${formatPrice(settings.freeShippingThreshold)}.`
              : settings.freeShippingMode === 'product-specific'
              ? 'Free shipping available on eligible items.'
              : 'Nationwide standard delivery rates apply.'
          }
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#A0988A]/30 text-[#1A1A18] border border-[#565449]/30 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#1A1A18]">Your Bag is Empty</h2>
          <p className="text-sm text-[#1A1A18]/80 max-w-md mx-auto">
            Explore our collection of authentic handcrafted Peshawari Chappals to add your ideal size and style.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/products" className="btn-copper text-xs sm:text-sm py-3 px-7 inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-md">
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/" className="btn-glass text-xs sm:text-sm py-3 px-7 inline-flex items-center justify-center gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" /> Return to Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Item List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map(item => {
              if (!item || !item.product) return null;
              const itemPrice = Number(item.product.price) || 0;
              const imageUrl = (item.product.images && (item.product.images.front || (Array.isArray(item.product.images.gallery) && item.product.images.gallery[0]))) || '';
              const colorDisplay = (item.selectedColor || 'saddle-tan').toString().replace(/-/g, ' ');

              return (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-[#A0988A]/20 rounded-2xl border border-[#A0988A]">
                  <div className="flex items-center gap-4">
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-xl bg-[#F7F4EB]/40 border border-[#A0988A] shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif font-bold text-base text-[#1A1A18]">
                          {item.product.name}
                        </h3>
                      </div>

                      <div className="text-xs text-[#1A1A18]/80 mt-1 space-y-0.5">
                        <p>Size: <strong className="text-[#1A1A18]">Size {item.size}</strong> • Color: <strong className="text-[#1A1A18] capitalize">{colorDisplay}</strong></p>
                      </div>

                      <span className="font-serif font-bold text-base text-[#1A1A18] block mt-1.5">
                        {formatPrice(itemPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1 bg-[#F7F4EB] border border-[#A0988A] rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 rounded-lg hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-[#1A1A18]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 rounded-lg hover:bg-[#A0988A]/30 text-[#1A1A18] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 rounded-xl hover:bg-[#A0988A]/30 text-[#1A1A18]/70 hover:text-[#1A1A18] border border-[#A0988A] transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar (Warm Taupe Section Panel) */}
          <div className="lg:col-span-4 bg-[#A0988A]/25 border border-[#A0988A] rounded-2xl p-6 space-y-5 sticky top-24 shadow-xs">
            <h2 className="font-serif font-bold text-xl text-[#1A1A18] pb-3 border-b border-[#A0988A]/40">
              Order Summary
            </h2>

            {/* Promo Code Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1A1A18] uppercase tracking-wider block">Have a Promo Code?</label>
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A18]/60" />
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                    placeholder="Enter code (e.g. PSH20)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F7F4EB] border border-[#A0988A] text-[#1A1A18] uppercase font-semibold focus:outline-none focus:border-[#565449]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isApplyingPromo || !promoCodeInput.trim()}
                  className="px-4 py-2 bg-[#565449] hover:bg-[#45433A] border border-[#565449] disabled:opacity-50 text-[#F7F4EB] rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-xs cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {appliedPromo && (
                <div className="p-2.5 rounded-xl bg-[#A0988A]/30 border border-[#565449]/30 text-[#1A1A18] text-xs font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#1A1A18]" /> Code <strong>{appliedPromo.code}</strong> Applied!
                  </span>
                  <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="text-[#1A1A18] underline text-[11px] cursor-pointer">Remove</button>
                </div>
              )}

              {promoError && (
                <div className="p-2.5 rounded-xl bg-[#A0988A]/30 border border-[#565449]/40 text-[#1A1A18] text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-[#1A1A18] shrink-0" /> {promoError}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-[#1A1A18]/80 border-t border-[#A0988A]/40 pt-4">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-[#1A1A18]">{formatPrice(subtotal)}</span>
              </div>

              {appliedPromo && (
                <div className="flex justify-between text-[#1A1A18] font-semibold">
                  <span>Promo Discount ({appliedPromo.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-[#1A1A18]">
                  {shippingFee === 0 ? <strong className="text-[#1A1A18]">FREE</strong> : formatPrice(shippingFee)}
                </span>
              </div>

              {shippingFee > 0 && settings.freeShippingMode === 'threshold' && effectiveSubtotal < settings.freeShippingThreshold && (
                <p className="text-[11px] text-[#1A1A18]">
                  Add {formatPrice(settings.freeShippingThreshold - effectiveSubtotal)} more for free delivery.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[#A0988A]/40 flex justify-between items-baseline">
              <span className="font-serif font-bold text-lg text-[#1A1A18]">Total Amount</span>
              <span className="font-serif font-bold text-3xl text-[#1A1A18]">{formatPrice(total)}</span>
            </div>

            {/* Strict Olive Drab Primary Button */}
            <Link
              to="/checkout"
              state={{ appliedPromoCode: appliedPromo?.code }}
              className="w-full bg-[#565449] hover:bg-[#45433A] text-[#F7F4EB] border border-[#565449] py-3.5 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-1 text-center text-xs text-[#1A1A18]/70 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1A1A18]" /> 256-Bit SSL Encrypted Checkout
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
