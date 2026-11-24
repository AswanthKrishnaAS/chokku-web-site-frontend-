import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { X, Sparkles, Gift, Coins, ArrowRight, Percent, Clock } from 'lucide-react';
import monkeyGif from '../assets/monkey_no_bg.gif';

interface MascotRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MascotRewardModal: React.FC<MascotRewardModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isClosing, setIsClosing] = useState(false);

  // Close handler with smooth exit animation for both modal & mascot GIF
  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsModalOpen(false);
      onClose();
    }, 280);
  };

  // 1. Sequence Timing:
  // The monkey GIF appears first on screen and plays its 1.25s entrance animation.
  // The modal opens only after the monkey GIF has appeared on the screen (1.35s delay).
  useEffect(() => {
    if (!isOpen) {
      setIsModalOpen(false);
      setIsClosing(false);
      return;
    }

    const entranceTimer = setTimeout(() => {
      setIsModalOpen(true);
    }, 1350);

    return () => clearTimeout(entranceTimer);
  }, [isOpen]);

  // 2. 10-Second Countdown Timer & Auto-Close
  // Starts ONLY after the modal has opened, giving the user full 10 seconds to read
  useEffect(() => {
    if (!isOpen || !isModalOpen) return;
    setSecondsLeft(10);
    setIsClosing(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isModalOpen]);

  // 3. Escape key support
  useEffect(() => {
    if (!isOpen || !isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isModalOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="mascot-reward-experience-root">
      {/* ===== LAYER 1: MODAL BACKDROP (z-[80]) ===== */}
      {/* Blurs and dims only the background page behind it. Placed BEHIND the monkey (z-[90]) so NO BLUR is ever applied to the monkey GIF! */}
      {isModalOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          className={`fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto cursor-pointer ${
            isClosing ? 'opacity-0' : 'animate-fade-in'
          }`}
          onClick={handleDismiss}
        />
      )}

      {/* ===== LAYER 2: MONKEY MASCOT GIF (z-[90]) ===== */}
      {/* Above the backdrop (z-[80]) -> 100% SHARP, CRISP, & UNBLURRED at all times! */}
      <div
        className={`fixed top-0 right-0 w-screen h-[100dvh] sm:w-[480px] md:w-[540px] lg:w-[620px] sm:h-[650px] md:h-[720px] pointer-events-none z-[90] overflow-visible transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : ''
        }`}
        style={{ isolation: 'isolate' }}
      >
        <div className="relative w-full h-full animate-marquee-monkey-fullscreen flex items-start justify-end">
          <img
            src={monkeyGif}
            alt="Chokku Mascot"
            className="w-full h-full object-contain object-top-right drop-shadow-[0_12px_28px_rgba(0,0,0,0.22)] block select-none pointer-events-none"
            style={{
              imageRendering: 'auto',
              transform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
            }}
          />

          {/* Interactive Clickable Area on the Monkey */}
          <Link
            to="/play-and-win"
            onClick={handleDismiss}
            className="pointer-events-auto absolute top-0 right-0 w-3/5 sm:w-1/2 h-1/2 block group/mascot focus:outline-none"
            title="Play and Win with Chokku!"
            aria-label="Play and Win with Chokku!"
          >
            <div className="absolute top-1/4 left-0 -translate-x-full -translate-y-1/2 opacity-0 group-hover/mascot:opacity-100 transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-1.5 bg-white/95 text-[#488710] font-black text-xs px-3 py-1.5 rounded-full shadow-xl border border-emerald-200/90 whitespace-nowrap">
              <span>Play and Win!</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </div>
          </Link>
        </div>
      </div>

      {/* ===== LAYER 3: MODAL DIALOG CARD CONTAINER (z-[100]) ===== */}
      {/* Opens ONLY after the monkey GIF has appeared on the screen (after 1.35s delay) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mascot-reward-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
        >
          <div
            className={`relative w-full max-w-[340px] xs:max-w-sm sm:max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-emerald-100 text-center overflow-hidden my-auto pointer-events-auto transition-all duration-300 ${
              isClosing ? 'animate-modal-fade-out' : 'animate-scale-up'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top 10-Second Auto-Close Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#488710] via-emerald-400 to-amber-400 animate-modal-10s-timer" />
            </div>

            {/* Decorative Background Glows */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Close (X) Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer shadow-xs z-30 group"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
            </button>

            {/* Top Countdown Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f9e8] text-[#386b0c] text-[11px] font-black uppercase tracking-wider mb-2 mt-2 border border-[#d2ea9d]">
              <Clock className="w-3.5 h-3.5 text-[#488710]" />
              <span>Closes in {secondsLeft}s</span>
            </div>

            {/* Main Heading */}
            <h2 id="mascot-reward-modal-title" className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight flex items-center justify-center gap-1.5">
              <span>Special Welcome Bonus!</span>
              <span className="text-xl">🎉</span>
            </h2>

            {/* Subtitle */}
            <p className="mt-1.5 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-xs mx-auto">
              Welcome to Chokku Store! Play games to win points, unlock discounts, and enjoy special perks.
            </p>

            {/* Perks Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              {/* Perk 1 */}
              <div className="bg-[#f8faf6] p-2.5 rounded-2xl border border-emerald-100/80 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                  <Percent className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block leading-tight">Code: WELCOME20</span>
                  <span className="text-xs font-black text-gray-900 leading-tight">Flat 20% OFF</span>
                </div>
              </div>

              {/* Perk 2 */}
              <div className="bg-[#f8faf6] p-2.5 rounded-2xl border border-emerald-100/80 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                  <Coins className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block leading-tight">Arcade Wallet</span>
                  <span className="text-xs font-black text-[#488710] leading-tight">+100 Game Coins</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              {/* Primary Button: Play & Win Arcade */}
              <button
                onClick={() => {
                  handleDismiss();
                  navigate('/play-and-win');
                }}
                className="w-full h-11 bg-gradient-to-r from-[#488710] to-[#3d730d] hover:from-[#3d730d] hover:to-[#315d0a] text-white font-black rounded-2xl shadow-lg shadow-[#488710]/25 transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Play &amp; Win Arcade</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Secondary Button: Claim Welcome Code */}
              <button
                onClick={() => {
                  handleDismiss();
                  navigate('/shop?tag=offers');
                }}
                className="w-full h-9 bg-gray-50 hover:bg-[#f0f9e8] text-gray-700 hover:text-[#488710] font-bold rounded-2xl border border-gray-200/80 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5 text-[#488710]" />
                <span>Claim Code WELCOME20</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
