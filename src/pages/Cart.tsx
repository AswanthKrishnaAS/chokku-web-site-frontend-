import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Tag, ShieldCheck, ArrowLeft, Trash2, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CartItem } from '../components/CartItem';
import { Button } from '../components/Button';
import { TreasureCoin } from '../components/TreasureCoin';

export const Cart: React.FC = () => {
  const { customerUser } = useAuth();
  const { addToast } = useToast();
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
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (!customerUser) {
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
      applyCoupon(inputCode);
      setInputCode('');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-white min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-brand-light-green text-brand-green flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Explore our collection of Electronics, Fashion, and Home & Lifestyle items to add products to your cart.
        </p>
        <Link to="/shop" className="mt-6">
          <Button variant="primary" size="lg" icon={<ArrowLeft className="w-4 h-4" />}>
            Start Shopping Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
          <div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
              Shopping Overview
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
              Your Shopping Cart ({cartItems.length} items)
            </h1>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        </div>

        {/* Main Cart Grid: Item List + Summary Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs divide-y divide-gray-100">
              {cartItems.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link to="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-brand-blue hover:underline">
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="space-y-6">
            
            {/* Coupon Code Input Card */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-brand-green" />
                <h3 className="font-bold text-gray-900 text-sm">Have a Promo Code?</h3>
              </div>

              {isCouponApplied ? (
                <div className="bg-brand-light-green border border-brand-green/30 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-green" />
                    <span className="text-xs font-bold text-gray-800">
                      Code <strong className="text-brand-green">{couponCode}</strong> applied
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-semibold text-red-500 hover:underline"
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
                    placeholder="e.g. SAVE10 or WELCOME20"
                    className="flex-1 bg-white border border-gray-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-brand-blue uppercase"
                  />
                  <Button variant="outline" size="sm" type="submit">
                    Apply
                  </Button>
                </form>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                Tip: Try code <strong>SAVE10</strong> for 10% off or <strong>WELCOME20</strong> for 20% off!
              </p>
            </div>

            {/* Order Summary Breakdown Box */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
              <h3 className="font-extrabold text-gray-900 text-base pb-3 border-b border-gray-200">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-brand-green font-semibold">
                    <span>Discount ({couponCode})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Delivery Charge</span>
                  {deliveryFee === 0 ? (
                    <span className="font-bold text-brand-green">FREE</span>
                  ) : (
                    <span className="font-bold text-gray-900">₹{deliveryFee.toFixed(2)}</span>
                  )}
                </div>

                {deliveryFee > 0 && (
                  <p className="text-[11px] text-brand-blue bg-brand-light-blue p-2 rounded-lg">
                    Add ₹{(50 - subtotal).toFixed(2)} more to qualify for <strong>FREE Delivery</strong>!
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-extrabold text-gray-900 text-sm">Total Amount</span>
                <span className="font-extrabold text-gray-900 text-2xl">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={handleProceedToCheckout}
                variant="primary"
                size="lg"
                fullWidth
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Proceed to Checkout
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-brand-green" />
                <span>100% Secure & Encrypted Checkout</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Golden Treasure Coin for Shopping Cart Page */}
      <TreasureCoin pageId="cart" />
    </div>
  );
};
