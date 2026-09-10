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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await fetch(`${API_URL}/catch-game/my-gifts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUnopenedGifts(data.unopenedGifts || []);
          setOpenedGifts(data.openedGifts || []);
        }
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
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
        const userId = customerUser?.id || (customerUser as any)?._id || '';

        const res = await fetch(`${API_URL}/catch-game/open-gift/${gift._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': userId,
          },
        });

        const data = await res.json();
        if (res.ok && data.success && data.gift) {
          setRevealedReward(data.gift);
          addToast('🎉 Gift Opened!', data.message || 'Reward revealed!', 'success');
          await fetchMyGifts();
          await fetchCustomerPoints();
          if (onGiftOpened) onGiftOpened();
        } else {
          addToast('Error', data.message || 'Failed to open gift box', 'error');
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
      <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 shadow-2xs space-y-3">
        <Gift className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="text-base font-black text-gray-800">Sign In to View Your Gifts</h3>
        <p className="text-xs text-gray-500">Collect gift boxes in Catch the Gift and open them to win points and discounts!</p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 bg-[#488710] hover:bg-[#386b0c] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-md transition-all"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const totalGiftsCount = unopenedGifts.length + openedGifts.length;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-6">
      
      {/* Page Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#488710] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs">
          <Gift className="w-4 h-4 fill-[#488710]" />
          <span>My Gifts</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          You have {unopenedGifts.length} Unopened Gift Box{unopenedGifts.length !== 1 ? 'es' : ''}
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Click an unopened gift box to reveal your exact reward configured by Admin!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('unopened')}
            className={`px-5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'unopened'
                ? 'bg-[#488710] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎁 Unopened ({unopenedGifts.length})
          </button>
          <button
            onClick={() => setActiveTab('opened')}
            className={`px-5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'opened'
                ? 'bg-[#488710] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✨ Opened ({openedGifts.length})
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
          <div className="py-12 text-center space-y-3 bg-[#f8faf6] rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-[#eef8ea] text-[#488710] rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner">
              🎁
            </div>
            <h4 className="text-sm font-black text-gray-900">No Unopened Gift Boxes</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Play <span className="font-bold text-[#488710]">Catch the Gift</span> to catch gift boxes and save them here!
            </p>
            <Link
              to="/catch-the-gift"
              className="inline-flex items-center gap-1.5 bg-[#488710] hover:bg-[#386b0c] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-md transition-all hover:scale-105"
            >
              <span>Play Catch the Gift</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* UNOPENED GIFT BOXES GRID */
          <div className="space-y-4">
            <p className="text-center text-xs font-black text-[#488710] tracking-wide uppercase">
              👇 Click a gift box to open 👇
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {unopenedGifts.map((gift) => (
                <div
                  key={gift._id}
                  onClick={() => handleOpenGiftClick(gift)}
                  className="bg-gradient-to-b from-amber-50 via-yellow-50/80 to-emerald-50/90 border-2 border-amber-300/80 rounded-3xl p-5 text-center space-y-3 relative hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col items-center justify-between cursor-pointer"
                >
                  <div className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    <span>Gift Box #{gift.boxNumber || 1}</span>
                  </div>

                  <div className="my-2 group-hover:scale-110 transition-transform duration-300">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-md border-2 border-amber-200 flex items-center justify-center text-5xl sm:text-6xl mx-auto group-hover:rotate-6 transition-transform">
                      🎁
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenGiftClick(gift);
                    }}
                    className="w-full bg-gradient-to-r from-[#488710] to-[#386b0c] hover:from-[#386b0c] hover:to-[#2c5309] text-white font-black py-2.5 rounded-xl text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
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
          <div className="py-12 text-center text-gray-400 space-y-2 bg-gray-50 rounded-3xl">
            <Clock className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No Opened Gifts Yet</p>
            <p className="text-[11px] text-gray-400">Open your gift boxes to view your reward history!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {openedGifts.map((gift) => (
              <div
                key={gift._id}
                className="bg-gray-50 border border-gray-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs opacity-95"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
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
                        <h4 className="text-sm font-black text-gray-900 truncate">
                          {gift.offerPercentage}% OFF – {gift.productName || 'Product Offer'}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                          <span className="line-through">₹{gift.originalPrice}</span>
                          <span className="font-bold text-[#488710]">₹{gift.offerPrice}</span>
                        </div>
                      </div>
                    )}
                    <span className="text-[9px] text-gray-400 block mt-1">
                      Opened {gift.openedAt ? new Date(gift.openedAt).toLocaleDateString() : 'Recently'} • <span className="font-bold text-emerald-600">Claimed ✅</span>
                    </span>
                  </div>
                </div>

                {gift.rewardType === 'product_offer' && (
                  <Link
                    to={gift.productId ? `/product/${gift.productId}` : '/shop'}
                    className="bg-[#488710] hover:bg-[#386b0c] text-white px-3.5 py-2 rounded-full text-xs font-extrabold shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
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

      {/* GIFT OPENING MODAL ANIMATION & POPPER / REVEAL STATE */}
      {openingGift && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center border border-gray-100 relative animate-scale-up overflow-hidden">
            
            {/* Confetti / Popper Animated Floating Particles */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                <div className="absolute top-2 left-4 text-2xl animate-bounce">🎉</div>
                <div className="absolute top-6 right-6 text-3xl animate-ping">✨</div>
                <div className="absolute bottom-10 left-8 text-2xl animate-pulse">🎊</div>
                <div className="absolute bottom-6 right-10 text-3xl animate-bounce">💥</div>
                <div className="absolute top-12 left-1/2 -translate-x-1/2 text-4xl animate-spin">🥳</div>
              </div>
            )}

            {/* Close Button if revealed */}
            {revealedReward && (
              <button
                onClick={() => setOpeningGift(null)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-30"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {!revealedReward ? (
              /* SHAKING UNBOXING ANIMATION STATE */
              <div className="py-6 space-y-6 relative z-10">
                <div className="relative inline-block animate-bounce">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 rounded-3xl shadow-2xl flex items-center justify-center text-7xl mx-auto border-4 border-amber-200 animate-pulse">
                    🎁
                  </div>
                  <Sparkles className="w-8 h-8 text-amber-300 absolute -top-3 -right-3 animate-spin" />
                  <PartyPopper className="w-8 h-8 text-emerald-400 absolute -bottom-3 -left-3 animate-ping" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900">Unboxing Gift Box #{openingGift.boxNumber || 1}...</h3>
                  <p className="text-xs text-gray-500 font-medium">Opening your reward, please hold on!</p>
                </div>
              </div>
            ) : (
              /* REVEALED REWARD STATE (CONGRATULATIONS REVEAL) */
              <div className="py-2 space-y-5 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-amber-100 text-[#488710] rounded-3xl flex items-center justify-center text-6xl mx-auto shadow-inner border-2 border-emerald-200">
                  {revealedReward.rewardType === 'coins' ? '🪙' : '🎁'}
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tight flex items-center justify-center gap-1.5">
                    <span>🎉 CONGRATULATIONS!</span>
                  </h2>
                  <p className="text-sm font-extrabold text-gray-700">YOU WON</p>

                  {revealedReward.rewardType === 'coins' ? (
                    <div className="pt-2">
                      <h3 className="text-3xl font-black text-[#488710]">
                        {revealedReward.coinAmount?.toLocaleString()} Coins
                      </h3>
                      <p className="text-xs text-emerald-700 font-bold mt-1">
                        Credited directly to your Points balance!
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 space-y-1">
                      <h3 className="text-3xl font-black text-[#488710]">
                        {revealedReward.offerPercentage}% OFF
                      </h3>
                      <p className="text-sm font-black text-gray-900">
                        {revealedReward.productName || 'Exclusive Product Offer'}
                      </p>
                      {revealedReward.offerPrice && (
                        <p className="text-xs text-gray-500 pt-1">
                          Offer Price: <span className="font-extrabold text-gray-900">₹{revealedReward.offerPrice}</span> <span className="line-through text-gray-400">₹{revealedReward.originalPrice}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {revealedReward.rewardType === 'product_offer' ? (
                    <Link
                      to={revealedReward.productId ? `/product/${revealedReward.productId}` : '/shop'}
                      onClick={() => setOpeningGift(null)}
                      className="w-full bg-[#488710] hover:bg-[#386b0c] text-white font-black py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <span>Claim Offer &amp; Shop Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setOpeningGift(null)}
                      className="w-full bg-[#488710] hover:bg-[#386b0c] text-white font-black py-3 rounded-2xl text-xs shadow-md transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Awesome! Continue
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

