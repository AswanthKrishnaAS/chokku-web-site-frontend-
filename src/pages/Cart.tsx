import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Tag,
  ShieldCheck,
  ArrowLeft,
  Trash2,
  CheckCircle,
  Truck,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  X,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCategories } from '../context/CategoryContext';
import { CartItem } from '../components/CartItem';
import { Button } from '../components/Button';
import { TreasureCoin } from '../components/TreasureCoin';

export const Cart: React.FC = () => {
  const { customerUser, user } = useAuth();
  const { addToast } = useToast();
  const { categories } = useCategories();
  const {
    cartItems,
    clearCart,
    subtotal,
    discountAmount,
    deliveryFee,
    totalAmount,
    couponCode,
    isCouponApplied,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [inputCode, setInputCode] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  // Active user check
  const activeUser = customerUser || user;

  const handleProceedToCheckout = () => {
    if (!activeUser) {
      addToast('Login Required', 'Please log in or sign up to proceed to checkout.', 'info');
      sessionStorage.setItem('chokku_redirect_after_login', '/checkout');
      navigate('/login', { state: { returnUrl: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      applyCoupon(inputCode.trim());
      setInputCode('');
    }
  };

  // Delivery Free threshold (₹50)
  const deliveryThreshold = 50;
  const isFreeDelivery = subtotal >= deliveryThreshold;
  const amountToFreeDelivery = Math.max(0, deliveryThreshold - subtotal);
  const deliveryProgressPercent = Math.min(100, Math.round((subtotal / deliveryThreshold) * 100));

  // If Cart is Empty
  if (cartItems.length === 0) {
    return (
      <div className="bg-gradient-to-b from-gray-50/70 via-white to-gray-50/40 min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6">
        <div className="max-w-md w-full text-center">
          {/* Animated decorative orb and cart icon */}
          <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-brand-light-green/80 animate-ping opacity-25" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-brand-green/20 to-brand-blue/20 blur-sm" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-lg border border-brand-green/20 flex items-center justify-center text-brand-green">
              <ShoppingBag className="w-12 h-12 stroke-[1.8]" />
            </div>
            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1.5 rounded-full shadow-md animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Your Cart is Empty
          </h1>
          <p className="text-sm text-gray-500 mt-2.5 leading-relaxed max-w-sm mx-auto">
            Looks like you haven't added anything to your cart yet. Explore our curated collections and grab the best deals today!
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/shop" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<ArrowLeft className="w-4 h-4" />}
                className="shadow-md hover:shadow-lg font-bold"
              >
                Start Shopping Now
              </Button>
            </Link>
            <Link to="/play-and-win" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                className="font-bold border-gray-200"
              >
                Play &amp; Win Coins
              </Button>
            </Link>
          </div>

          {/* Quick Category Badges */}
          {categories && categories.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Popular Categories to Explore
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:text-brand-blue hover:border-brand-blue/40 hover:bg-brand-light-blue transition-all shadow-2xs"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Treasure Coin support */}
        <TreasureCoin pageId="cart" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-4 sm:py-8 pb-36 lg:pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb & Stepper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <Link to="/shop" className="hover:text-brand-blue transition-colors">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-bold text-gray-800">Shopping Cart</span>
          </div>

          {/* Checkout Steps Indicator */}
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-2xs self-start sm:self-auto text-xs">
            <span className="flex items-center gap-1.5 font-bold text-brand-green">
              <span className="w-4 h-4 rounded-full bg-brand-green text-white flex items-center justify-center text-[10px]">1</span>
              <span>Cart</span>
            </span>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">2</span>
              <span>Checkout</span>
            </span>
            <span className="text-gray-300">/</span>
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px]">3</span>
              <span>Payment</span>
            </span>
          </div>
        </div>

        {/* Header Title with Item Count & Clear Cart */}
        <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200/80 mb-5 sm:mb-8">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Shopping Cart
              </h1>
              <span className="bg-brand-light-green text-brand-green border border-brand-green/20 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review your selected items before proceeding to secure checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Clear all items in cart"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Cart</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </div>

        {/* Dynamic Free Delivery Progress Bar Card */}
        <div className="mb-6 bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-2xs">
          <div className={`flex items-center justify-between gap-3 ${!isFreeDelivery ? 'mb-2' : ''} flex-wrap`}>
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isFreeDelivery ? 'bg-brand-light-green text-brand-green' : 'bg-brand-light-blue text-brand-blue'}`}>
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-gray-800">
                {isFreeDelivery ? (
                  <span className="text-brand-green flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-brand-green inline shrink-0" />
                    Congratulations! You qualify for <strong>FREE Delivery</strong>!
                  </span>
                ) : (
                  <>
                    Add <strong className="text-brand-blue">₹{amountToFreeDelivery.toFixed(2)}</strong> more to get <strong className="text-brand-green">FREE Delivery</strong>
                  </>
                )}
              </span>
            </div>
            {!isFreeDelivery && (
              <span className="text-xs font-extrabold text-gray-500">
                {deliveryProgressPercent}%
              </span>
            )}
          </div>

          {/* Progress track */}
          {!isFreeDelivery && (
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-brand-blue to-cyan-500"
                style={{ width: `${deliveryProgressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Main Grid: Cart Items List + Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column (2 Cols): Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-3 sm:p-6 shadow-sm divide-y divide-gray-100">
              {cartItems.map((item) => (
                <CartItem key={`${item.product.id}-${item.selectedSize || ''}-${item.selectedColor || ''}`} item={item} />
              ))}
            </div>

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-brand-blue hover:text-brand-blue-hover py-2 px-4 rounded-xl border border-brand-blue/20 hover:border-brand-blue/50 bg-white shadow-2xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-brand-green" />
                  <span>Secure Payments</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-brand-blue" />
                  <span>7-Day Return Policy</span>
                </span>
              </div>
            </div>

          </div>

          {/* Right Column (1 Col): Order Summary & Promos */}
          <div className="space-y-5 lg:sticky lg:top-24">
            
            {/* Promo / Coupon Code Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-brand-light-green text-brand-green flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Have a Promo Code?</h3>
                  <p className="text-[11px] text-gray-400">Apply coupon code to save instantly</p>
                </div>
              </div>

              {isCouponApplied ? (
                <div className="bg-brand-light-green/90 border border-brand-green/30 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-4 h-4 text-brand-green shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-800 block truncate">
                        Code <strong className="text-brand-green">{couponCode}</strong> applied!
                      </span>
                      <span className="text-[10px] text-brand-green font-semibold">
                        You saved ₹{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCouponSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Enter coupon code (e.g. SAVE10)"
                    className="flex-1 bg-gray-50 border border-gray-200 text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue uppercase font-bold text-gray-800 placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 transition-all"
                  />
                  <Button variant="outline" size="sm" type="submit" className="font-bold border-gray-300">
                    Apply
                  </Button>
                </form>
              )}
            </div>

            {/* Order Summary Breakdown Box */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-extrabold text-gray-900 text-base pb-3 border-b border-gray-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-bold text-gray-500">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </h3>

              <div className="space-y-3 text-xs sm:text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-brand-green font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Coupon Discount ({couponCode})</span>
                    </span>
                    <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    <span>Estimated Delivery</span>
                  </span>
                  {deliveryFee === 0 ? (
                    <span className="font-extrabold text-brand-green bg-brand-light-green px-2 py-0.5 rounded-md">
                      FREE
                    </span>
                  ) : (
                    <span className="font-bold text-gray-900">₹{deliveryFee.toFixed(2)}</span>
                  )}
                </div>

                {/* Savings highlight message */}
                {(discountAmount > 0 || deliveryFee === 0) && (
                  <div className="bg-brand-light-green/70 text-brand-green text-xs font-bold p-2.5 rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      You are saving ₹{(discountAmount + (deliveryFee === 0 ? 5.99 : 0)).toFixed(2)} on this order!
                    </span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-3.5 border-t border-gray-100">
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-extrabold text-gray-900 text-base">Total Amount</span>
                    <span className="text-[11px] text-gray-400 block font-normal">
                      (Includes all taxes &amp; fees)
                    </span>
                  </div>
                  <span className="font-extrabold text-gray-900 text-2xl sm:text-3xl text-brand-blue">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 sm:py-4 px-6 bg-brand-green hover:bg-brand-green-hover text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Trust & Safe Checkout Badges */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                  <span className="font-medium">100% Encrypted &amp; Secure Checkout</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>UPI • Credit/Debit Cards • NetBanking • COD</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Clear Cart Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 text-center">
              Clear Shopping Cart?
            </h3>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              Are you sure you want to remove all {cartItems.length} items from your shopping cart? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Keep Items
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                  addToast('Cart Cleared', 'All items have been removed from your shopping cart.', 'info');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Yes, Empty Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Golden Treasure Coin for Shopping Cart Page */}
      <TreasureCoin pageId="cart" />
    </div>
  );
};
