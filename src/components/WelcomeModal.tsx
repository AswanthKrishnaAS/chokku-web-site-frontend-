import React, { useEffect } from 'react';
import { Sparkles, ShoppingBag, ArrowRight, X, PartyPopper, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const WelcomeModal: React.FC = () => {
  const { welcomeModal, closeWelcomeModal } = useAuth();

  useEffect(() => {
    if (!welcomeModal.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWelcomeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [welcomeModal.isOpen, closeWelcomeModal]);

  if (!welcomeModal.isOpen) return null;

  const displayName = welcomeModal.name || 'Shopper';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={closeWelcomeModal}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeWelcomeModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated Badge Icon */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f0f9e8] to-[#e1f3cd] border-2 border-[#cbe595] text-[#488710] flex items-center justify-center shadow-md">
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          {welcomeModal.isSignUp ? (
            <PartyPopper className="w-9 h-9 stroke-[2.2] animate-bounce" />
          ) : (
            <ShoppingBag className="w-9 h-9 stroke-[2.2] animate-bounce" />
          )}
        </div>

        {/* Brand Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f9e8] text-[#386b0c] text-[11px] font-black uppercase tracking-wider mb-2 border border-[#d2ea9d]">
          <CheckCircle className="w-3 h-3 text-[#488710]" />
          <span>{welcomeModal.isSignUp ? 'New Account Created' : 'Successfully Signed In'}</span>
        </div>

        {/* Main Heading: Required exact text “Welcome to Chokku Store!” */}
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
          Welcome to Chokku Store!
        </h2>

        {/* Greeting with User Name */}
        <p className="mt-2 text-sm sm:text-base font-extrabold text-[#488710]">
          Hello, {displayName}! 🎉
        </p>

        {/* Subtitle Description */}
        <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-sm mx-auto">
          {welcomeModal.isSignUp
            ? "We're thrilled to have you join us! Explore exciting trendy products, earn arcade points, and enjoy exclusive member discounts."
            : "Great to have you back! Continue discovering top collections, play games to win rewards, and enjoy seamless shopping."}
        </p>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={closeWelcomeModal}
            className="w-full h-12 bg-gradient-to-r from-[#488710] to-[#3d730d] hover:from-[#3d730d] hover:to-[#315d0a] text-white font-extrabold rounded-2xl shadow-lg shadow-[#488710]/25 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{welcomeModal.isSignUp ? 'Start Exploring' : 'Continue Shopping'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
