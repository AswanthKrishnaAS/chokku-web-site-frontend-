import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  X,
  Coins,
  ShoppingBag,
} from 'lucide-react';
import { Product } from '../types';

interface GuestBuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  quantity: number;
  selectedSize?: string | null;
  activePrice: number;
  onSkipToBuy: () => void;
}

export const GuestBuyNowModal: React.FC<GuestBuyNowModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity,
  selectedSize,
  activePrice,
  onSkipToBuy,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const totalPrice = activePrice * quantity;

  // Navigate directly to the Login / Sign Up page
  const handleSignInSignUp = () => {
    try {
      sessionStorage.setItem('chokku_redirect_after_login', '/checkout?mode=buynow');
      sessionStorage.setItem('chokku_buy_now_product_id', product.id);
      sessionStorage.setItem('chokku_buy_now_qty', String(quantity));
    } catch (e) {
      console.warn('Failed to set sessionStorage for buy now redirect', e);
    }

    onClose();
    navigate('/login', {
      state: {
        returnUrl: '/checkout?mode=buynow',
        buyNowProductId: product.id,
        buyNowQuantity: quantity,
        tab: 'signup',
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-100 text-left my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Product Snippet Header */}
        <div className="flex items-center gap-3 p-2.5 bg-gray-50/90 rounded-2xl border border-gray-100 mb-4 pr-10">
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 object-cover rounded-xl border border-gray-200/80 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
              {product.name}
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Qty: <span className="font-semibold text-gray-800">{quantity}</span>
              {selectedSize ? ` • Size: ${selectedSize}` : ''} • Total:{' '}
              <span className="font-bold text-[#488710]">₹{totalPrice.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Modal Title & Subtitle */}
        <div className="mb-3.5">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            How would you like to proceed?
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Earn bonus coins with an account, or continue directly as a guest.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: Sign In / Sign Up & Earn Coins (Recommended) */}
          <div
            onClick={handleSignInSignUp}
            className="group rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-white p-3.5 sm:p-4 transition-all duration-200 hover:border-amber-400 hover:shadow-xs cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-amber-400 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-amber-950 transition-colors">
                    Sign In &amp; Earn Coins
                  </h4>
                  <p className="text-[11px] font-bold text-amber-800">
                    Get 100 Bonus Coins instantly
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200/60 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                <span>Recommended</span>
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-600 mt-2 leading-relaxed">
              Play Spin &amp; Win games, earn rewards, and redeem your coins towards this purchase.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSignInSignUp();
              }}
              className="mt-3 w-full h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <span>Sign In / Sign Up &amp; Earn Coins</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Option 2: Skip to Buy (Direct Guest Checkout) */}
          <div
            onClick={onSkipToBuy}
            className="group rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/70 p-3.5 sm:p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-xs cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 border border-gray-200/60 flex items-center justify-center shrink-0 text-gray-700">
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-black transition-colors">
                    Skip to Buy
                  </h4>
                  <p className="text-[11px] font-medium text-gray-500">
                    Fast guest checkout
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200/60 shrink-0">
                Guest Checkout
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-600 mt-2 leading-relaxed">
              No account or password needed. Simply enter your delivery address to place your order directly.
            </p>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSkipToBuy();
              }}
              className="mt-3 w-full h-10 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <span>Skip to Buy &amp; Enter Delivery Details</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
