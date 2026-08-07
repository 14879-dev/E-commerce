import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, AlertTriangle, ShieldCheck, Tag, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { apiService } from '../services/api';
import type { PromoCode } from '../types/admin';
import { SEOHelmet } from '../components/common/SEOHelmet';

export const ShoppingBagPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, itemCount, subtotal } = useCart();
  const { formatPrice, settings } = useStoreSettings();

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setIsApplyingPromo(true);
    setPromoError(null);

    try {
      const promos = await apiService.getPromoCodes();
      const match = promos.find(p => p.code.toUpperCase() === promoCodeInput.trim().toUpperCase() && p.active);

      if (!match) {
        setPromoError('Invalid or expired promo code.');
        setAppliedPromo(null);
        return;
      }

      if (subtotal < match.minOrderValue) {
        setPromoError(`Minimum order of ${formatPrice(match.minOrderValue)} required for this code.`);
        setAppliedPromo(null);
        return;
      }

      setAppliedPromo(match);
      setPromoError(null);
    } catch {
      setPromoError('Failed to apply promo code.');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Calculate discount
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discountAmount = (subtotal * appliedPromo.value) / 100;
    } else {
      discountAmount = appliedPromo.value;
    }
  }

  const effectiveSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = effectiveSubtotal > settings.freeShippingThreshold || itemCount === 0 ? 0 : settings.standardShippingFee;
  const total = effectiveSubtotal + shippingFee;
  const hasCustomizedItems = items.some(item => item.isCustomized);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <SEOHelmet
        title="Shopping Bag"
        description="Review your selected handcrafted Peshawari Chappal order before checkout."
      />

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-1">
          Review Your Order
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Your Shopping Bag
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart. Free shipping on orders over {formatPrice(settings.freeShippingThreshold)}.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Your Bag is Empty</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Explore our collection of authentic handcrafted Peshawari Chappals to add your ideal size and style.
          </p>
          <Link to="/products" className="btn-copper text-sm py-3 px-8 inline-flex items-center gap-2">
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Item List */}
          <div className="lg:col-span-8 space-y-4">
            
            {hasCustomizedItems && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  <strong>Customized Product Notice:</strong> Items created via 3D Customizer Studio are bespoke handcrafted pieces and non-returnable per brand policy. Standard items remain eligible for exchange.
                </span>
              </div>
            )}

            {items.map(item => {
              const itemPrice = item.customizationDetails ? item.customizationDetails.customPrice : item.product.price;
              
              return (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-slate-100 last:border-0 bg-white rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.images.front}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-xl bg-slate-50 border border-slate-200 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif font-bold text-base text-slate-900">
                          {item.product.name}
                        </h3>
                        {item.isCustomized && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                            3D Customized
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <p>Size: <strong className="text-slate-900">EU {item.size}</strong> • Color: <strong className="text-slate-900 capitalize">{item.selectedColor.replace('-', ' ')}</strong></p>
                        
                        {item.customizationDetails && (
                          <p className="text-[11px] text-blue-600">
                            Sole: {item.customizationDetails.soleType.replace('-', ' ')} • Buckle: {item.customizationDetails.buckleFinish.replace('-', ' ')}
                            {item.customizationDetails.initials && ` • Initials: "${item.customizationDetails.initials}"`}
                          </p>
                        )}
                      </div>

                      <span className="font-serif font-bold text-base text-slate-900 block mt-1.5">
                        {formatPrice(itemPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 rounded-xl hover:bg-rose-50 text-rose-400 border border-slate-200 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 sticky top-24 shadow-xs">
            <h2 className="font-serif font-bold text-xl text-slate-900 pb-3 border-b border-slate-200">
              Order Summary
            </h2>

            {/* Promo Code Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">Have a Promo Code?</label>
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                    placeholder="Enter code (e.g. PSH20)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 uppercase font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isApplyingPromo || !promoCodeInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-xs"
                >
                  Apply
                </button>
              </form>

              {appliedPromo && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Code <strong>{appliedPromo.code}</strong> Applied!
                  </span>
                  <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="text-emerald-800 underline text-[11px]">Remove</button>
                </div>
              )}

              {promoError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" /> {promoError}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-slate-500 border-t border-slate-200 pt-4">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
              </div>

              {appliedPromo && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount ({appliedPromo.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingFee === 0 ? <strong className="text-emerald-600">FREE</strong> : formatPrice(shippingFee)}
                </span>
              </div>

              {shippingFee > 0 && (
                <p className="text-[11px] text-blue-600">
                  Add {formatPrice(settings.freeShippingThreshold - effectiveSubtotal)} more for free express delivery.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-serif font-bold text-lg text-slate-900">Total Amount</span>
              <span className="font-serif font-bold text-3xl text-slate-900">{formatPrice(total)}</span>
            </div>

            <Link
              to="/checkout"
              state={{ appliedPromoCode: appliedPromo?.code }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-1 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> 256-Bit SSL Encrypted Checkout
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

