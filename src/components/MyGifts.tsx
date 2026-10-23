import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Coins,
  Sparkles,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Tag,
  ArrowRight,
  RefreshCw,
  X,
  Lock,
  ChevronRight,
  PartyPopper
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { safeFetch } from '../utils/api';
import festiveBg from '../assets/img/Festive.png';
import tostMonkey from '../assets/img/tost.png';
import notificationSound from '../assets/notification.mp3';

export interface GiftItem {
  _id: string;
  boxNumber: number;
  rewardType: 'coins' | 'product_offer';
  coinAmount?: number;
  productId?: string;
  productName?: string;
  productImage?: string;
  offerPercentage?: number;
  originalPrice?: number;
  offerPrice?: number;
  expiryDate?: string;
  isOpened: boolean;
  openedAt?: string;
  caughtAt?: string;
}

interface MyGiftsProps {
  onGiftOpened?: () => void;
}

export const MyGifts: React.FC<MyGiftsProps> = ({ onGiftOpened }) => {
  const { customerUser, isAuthenticated, fetchCustomerPoints } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'unopened' | 'opened'>('unopened');
  const [loading, setLoading] = useState(false);
  const [unopenedGifts, setUnopenedGifts] = useState<GiftItem[]>([]);
  const [openedGifts, setOpenedGifts] = useState<GiftItem[]>([]);
  
  // Gift Opening Modal State
  const [openingGift, setOpeningGift] = useState<GiftItem | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealedReward, setRevealedReward] = useState<GiftItem | null>(null);

  const fetchMyGifts = async () => {
    if (!isAuthenticated || !customerUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await safeFetch('/catch-game/my-gifts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok && res.data?.success) {
        setUnopenedGifts(res.data.unopenedGifts || []);
        setOpenedGifts(res.data.openedGifts || []);
      }
    } catch (err) {
      console.warn('Error fetching customer gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGifts();
  }, [isAuthenticated, customerUser]);

  // Handle Box Opening Action
  const handleOpenGiftClick = async (gift: GiftItem) => {
    if (gift.isOpened) return; // Prevent re-opening already opened gift

    setOpeningGift(gift);
    setShowConfetti(true);
    setRevealedReward(null);

    // Play box shaking & confetti animation for 1.4s before calling backend
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
        const userId = customerUser?.id || (customerUser as any)?._id || '';

        const res = await safeFetch(`/catch-game/open-gift/${gift._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId,
          },
        });

        if (res.ok && res.data?.success && res.data?.gift) {
          setRevealedReward(res.data.gift);
          try {
            const audio = new Audio(notificationSound);
            audio.volume = 0.8;
            audio.play().catch(() => {});
          } catch (_) {}
          addToast('🎉 Gift Opened!', res.data.message || 'Reward revealed!', 'success');
          await fetchMyGifts();
          await fetchCustomerPoints();
          if (onGiftOpened) onGiftOpened();
        } else {
          addToast('Error', res.data?.message || 'Failed to open gift box', 'error');
          setOpeningGift(null);
        }
      } catch (err) {
        console.error('Error opening gift box:', err);
        addToast('Error', 'Server connection error', 'error');
        setOpeningGift(null);
      }
    }, 1400);
  };

  if (!isAuthenticated || !customerUser) {
    return (
      <div
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(247, 253, 243, 0.96) 100%), url(${festiveBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top'
        }}
        className="relative rounded-3xl p-6 sm:p-8 text-center border-2 border-emerald-300/80 shadow-xl space-y-4 backdrop-blur-md overflow-hidden"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-amber-100 text-[#488710] rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner">
          🎁
        </div>
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Sign In to View Your Gifts &amp; Rewards</h3>
          <p className="text-xs text-gray-600 max-w-sm mx-auto">
            Collect gift boxes in Catch the Gift and open them to win points, coins, and exclusive product discounts!
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#488710] to-[#59a815] hover:from-[#3a6e0c] hover:to-[#488710] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 uppercase tracking-wider"
        >
          <span>Sign In Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const totalGiftsCount = unopenedGifts.length + openedGifts.length;

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(247, 253, 243, 0.94) 100%), url(${festiveBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }}
      className="relative rounded-3xl p-5 sm:p-8 border-2 border-emerald-300/80 shadow-[0_20px_50px_rgba(72,135,16,0.12)] space-y-6 overflow-hidden backdrop-blur-md"
    >
      {/* Decorative top vibrant bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-[#488710]" />

      {/* Page Header */}
      <div className="text-center space-y-2 pt-1">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-amber-100 border border-emerald-200/80 text-[#386b0c] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
          <Gift className="w-4 h-4 fill-[#488710] text-[#488710]" />
          <span>My Gifts &amp; Won Rewards</span>
          {unopenedGifts.length > 0 && (
            <span className="flex items-center gap-1 bg-[#488710] text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse ml-1">
              {unopenedGifts.length} NEW
            </span>
          )}
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {unopenedGifts.length > 0
            ? `You Have ${unopenedGifts.length} Unopened Gift Box${unopenedGifts.length !== 1 ? 'es' : ''}!`
            : 'Your Gift Box Collection & Rewards'}
        </h3>

        <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md mx-auto">
          Open the gift boxes you caught in Catch the Gift to reveal exclusive discount vouchers and coin prizes!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-200/80 shadow-xs text-xs font-black">
          <button
            onClick={() => setActiveTab('unopened')}
            className={`px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'unopened'
                ? 'bg-gradient-to-r from-[#488710] to-[#5aa818] text-white shadow-md shadow-emerald-700/20 scale-102'
                : 'text-gray-600 hover:text-gray-900 hover:bg-emerald-50/50'
            }`}
          >
            <span className="text-sm">🎁</span>
            <span>Unopened Boxes</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'unopened' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {unopenedGifts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('opened')}
            className={`px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              activeTab === 'opened'
                ? 'bg-gradient-to-r from-[#488710] to-[#5aa818] text-white shadow-md shadow-emerald-700/20 scale-102'
                : 'text-gray-600 hover:text-gray-900 hover:bg-emerald-50/50'
            }`}
          >
            <span className="text-sm">🎟️</span>
            <span>Claimed Rewards</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'opened' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {openedGifts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="py-12 text-center text-gray-400 space-y-2">
          <RefreshCw className="w-7 h-7 animate-spin text-[#488710] mx-auto" />
          <p className="text-xs font-bold text-gray-600">Loading your gift boxes...</p>
        </div>
      ) : activeTab === 'unopened' ? (
        unopenedGifts.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 bg-white/70 backdrop-blur-xs rounded-3xl border-2 border-dashed border-emerald-200/80 shadow-xs">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-amber-100 text-[#488710] rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner">
              🎁
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-gray-900">No Unopened Gift Boxes Right Now</h4>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                Play <span className="font-bold text-[#488710]">Catch the Gift</span> to catch falling gift boxes and unlock exciting discounts and coin rewards!
              </p>
            </div>
            <button
              onClick={() => {
                const gameArea = document.getElementById('game-canvas-container');
                if (gameArea) {
                  gameArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#488710] to-[#59a815] hover:from-[#3a6e0c] hover:to-[#488710] text-white px-6 py-2.5 rounded-full text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <span>Play Game to Win Gifts</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* UNOPENED GIFT BOXES GRID */
          <div className="space-y-4">
            <p className="text-center text-xs font-black text-[#488710] tracking-wide uppercase flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>Click any gift box to unbox your reward</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
              {unopenedGifts.map((gift, index) => (
                <div
                  key={gift._id}
                  onClick={() => handleOpenGiftClick(gift)}
                  className="group relative bg-white/95 hover:bg-white border-2 border-amber-300 hover:border-amber-400 rounded-3xl p-5 text-center space-y-3 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-between cursor-pointer overflow-hidden backdrop-blur-xs"
                >
                  {/* Ambient highlight glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 via-transparent to-emerald-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Top Badge */}
                  <div className="relative z-10 inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-xs tracking-wider uppercase">
                    <span>Box #{gift.boxNumber || index + 1}</span>
                  </div>

                  {/* 3D Gift Box Visual */}
                  <div className="relative z-10 my-2 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-200 shadow-inner flex items-center justify-center text-5xl sm:text-6xl mx-auto group-hover:rotate-6 transition-transform">
                      🎁
                    </div>
                    <div className="w-14 h-2.5 bg-black/10 rounded-full mx-auto blur-[2px] mt-1 group-hover:scale-75 transition-transform" />
                  </div>

                  {/* Status Indicator */}
                  <span className="relative z-10 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-md border border-amber-200">
                    Tap to Open
                  </span>

                  {/* Action CTA Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGiftClick(gift);
                    }}
                    className="relative z-10 w-full bg-gradient-to-r from-[#488710] to-[#59a815] hover:from-[#3a6e0c] hover:to-[#488710] text-white font-black py-2.5 rounded-xl text-xs shadow-md transition-all group-hover:scale-102 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>OPEN GIFT</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* OPENED REWARDS TAB (Visually Distinct & Non-Reopenable) */
        openedGifts.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-white/60 backdrop-blur-xs rounded-3xl border border-gray-200">
            <Clock className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-black text-gray-700">No Opened Gifts Yet</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">Open your gift boxes in the Unopened tab to view your reward vouchers here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {openedGifts.map((gift) => (
              <div
                key={gift._id}
                className="bg-white/95 backdrop-blur-xs border-2 border-emerald-200/70 hover:border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-200 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
                    {gift.rewardType === 'coins' ? '🪙' : '🎁'}
                  </div>
                  <div className="min-w-0">
                    {gift.rewardType === 'coins' ? (
                      <div>
                        <h4 className="text-sm font-black text-gray-900">
                          +{gift.coinAmount?.toLocaleString()} Coins
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-bold">Credited to Points Balance</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-200">
                            {gift.offerPercentage}% OFF
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                            {gift.productName || 'Exclusive Product Voucher'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-1">
                          {gift.originalPrice && (
                            <span className="line-through text-gray-400">₹{gift.originalPrice}</span>
                          )}
                          {gift.offerPrice && (
                            <span className="font-black text-[#488710]">Special: ₹{gift.offerPrice}</span>
                          )}
                        </div>
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Claimed {gift.openedAt ? new Date(gift.openedAt).toLocaleDateString() : 'Recently'} • <span className="font-bold text-emerald-600">Saved in Account ✅</span>
                    </span>
                  </div>
                </div>

                {gift.rewardType === 'product_offer' && (
                  <Link
                    to={gift.productId ? `/product/${gift.productId}` : '/shop'}
                    className="bg-gradient-to-r from-[#488710] to-[#59a815] hover:from-[#3a6e0c] hover:to-[#488710] text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs shrink-0 flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    <span>Shop</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* GIFT OPENING MODAL ANIMATION & REVEAL STATE */}
      {openingGift && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pt-20">
          {/* Modal Outer Container enabling Mascot Overlap */}
          <div className="relative max-w-sm w-full animate-scale-up">

            {/* CELEBRATORY GREEN MONKEY (tost.png) OVERLAPPING ON TOP OF THE MODAL */}
            <div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <img
                src={tostMonkey}
                alt="Chokku Mascot"
                className={`w-28 sm:w-32 h-auto object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] transform transition-transform duration-500 ${
                  revealedReward ? 'animate-bounce scale-105' : 'animate-pulse'
                }`}
              />
            </div>

            {/* MODAL CARD WITH FESTIVE.PNG BACKGROUND */}
            <div
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(255, 255, 255, 0.90), rgba(255, 255, 255, 0.95)), url(${festiveBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
              className="relative rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-emerald-300/80 text-center overflow-hidden pt-14 sm:pt-16"
            >
              {/* Clean Close Button */}
              {revealedReward && (
                <button
                  onClick={() => setOpeningGift(null)}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-900 shadow-xs flex items-center justify-center transition-colors cursor-pointer z-20 border border-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {!revealedReward ? (
                /* STATE 1: UNBOXING SHAKING GIFT STATE (CLEAN, SIMPLE, NO CLUTTERED EMOJIS) */
                <div className="space-y-4 relative z-10 py-2">
                  <div className="relative inline-block animate-bounce">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 rounded-3xl shadow-xl flex items-center justify-center text-5xl sm:text-6xl mx-auto border-4 border-amber-200">
                      🎁
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      Unboxing Gift Box #{openingGift.boxNumber || 1}...
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">Opening your reward, please hold on!</p>
                  </div>

                  <div className="w-3/4 mx-auto bg-gray-200/80 rounded-full h-2 overflow-hidden border border-gray-200">
                    <div className="bg-gradient-to-r from-[#488710] to-[#84cc16] h-full w-full animate-pulse" />
                  </div>
                </div>
              ) : (
                /* STATE 2: REVEALED CONGRATULATIONS STATE (CLEAN, BEAUTIFUL & SIMPLE) */
                <div className="space-y-4 relative z-10 py-1">
                  {/* Prize Icon */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-100 to-amber-100 text-[#488710] rounded-3xl flex items-center justify-center text-5xl sm:text-6xl mx-auto shadow-lg border-2 border-emerald-300">
                    {revealedReward.rewardType === 'coins' ? '🪙' : '🎁'}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-amber-500 uppercase tracking-tight">
                      CONGRATULATIONS!
                    </h2>
                    <p className="text-xs font-black uppercase tracking-wider text-gray-500">YOU WON</p>

                    {revealedReward.rewardType === 'coins' ? (
                      <div className="pt-1 space-y-1">
                        <h3 className="text-3xl sm:text-4xl font-black text-[#386b0c] tracking-tight">
                          +{revealedReward.coinAmount?.toLocaleString()} Coins
                        </h3>
                        <p className="text-xs text-emerald-800 font-bold">
                          Credited directly to your Points balance!
                        </p>
                      </div>
                    ) : (
                      <div className="pt-1 space-y-1">
                        <h3 className="text-3xl sm:text-4xl font-black text-[#386b0c] tracking-tight">
                          {revealedReward.offerPercentage}% OFF
                        </h3>
                        <p className="text-sm font-black text-gray-900 leading-snug">
                          {revealedReward.productName || 'Exclusive Product Offer'}
                        </p>
                        {revealedReward.offerPrice && (
                          <div className="text-xs text-gray-600 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block shadow-2xs">
                            Offer Price: <span className="font-black text-[#386b0c] text-sm">₹{revealedReward.offerPrice}</span>{' '}
                            <span className="line-through text-gray-400 ml-1">₹{revealedReward.originalPrice}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Clean Action Button */}
                  <div className="pt-2">
                    {revealedReward.rewardType === 'product_offer' ? (
                      <Link
                        to={revealedReward.productId ? `/product/${revealedReward.productId}` : '/shop'}
                        onClick={() => setOpeningGift(null)}
                        className="w-full bg-[#488710] hover:bg-[#386b0c] text-white font-black py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider hover:scale-102 active:scale-98"
                      >
                        <span>Claim Offer &amp; Shop Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => setOpeningGift(null)}
                        className="w-full bg-[#488710] hover:bg-[#386b0c] text-white font-black py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer uppercase tracking-wider hover:scale-102 active:scale-98"
                      >
                        AWESOME! CONTINUE
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

