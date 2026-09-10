import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Coins,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Gamepad2,
  RefreshCw,
  Wallet,
  Bell,
  Info,
  Gift,
  FileText,
  Check,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ConversionHistoryItem {
  _id?: string;
  pointsConverted: number;
  rupeesEarned: number;
  convertedAt: string;
  status: string;
}

export const Points: React.FC = () => {
  const { customerUser, isAuthenticated, customerPoints, fetchCustomerPoints } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [conversions, setConversions] = useState<ConversionHistoryItem[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Require login to view points page
  useEffect(() => {
    if (!isAuthenticated || !customerUser) {
      addToast('Login Required', 'Please sign in to view and convert your points', 'warning');
      navigate('/login', { state: { from: '/points' } });
    }
  }, [isAuthenticated, customerUser, navigate]);

  // Fetch detailed conversion data from API
  const loadPointsData = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await fetch(`${API_URL}/catch-game/my-points`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConversions(data.conversions || []);
          setWalletBalance(data.walletBalance || 0);
          fetchCustomerPoints();
        }
      }
    } catch (err) {
      console.warn('Error fetching points data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerUser) {
      loadPointsData();
    }
  }, [customerUser]);

  // Calculate available ₹ value (1,000 Points = ₹1)
  const pointsToConvert = Math.floor(customerPoints / 1000) * 1000;
  const rupeesValue = Math.floor(customerPoints / 1000);
  const canConvert = pointsToConvert >= 1000;

  // Handle Conversion Request
  const handleConversionSubmit = async () => {
    if (!canConvert || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await fetch(`${API_URL}/catch-game/convert-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('🎉 Conversion Successful!', data.message || `Converted ${pointsToConvert.toLocaleString()} points to ₹${rupeesValue}`, 'success');
        setShowConfirmModal(false);
        await loadPointsData();
        await fetchCustomerPoints();
      } else {
        addToast('Conversion Failed', data.message || 'Unable to convert points right now', 'error');
      }
    } catch (err) {
      console.error('Points conversion error:', err);
      addToast('Error', 'Server connection error during conversion', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !customerUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4fbf0] font-sans antialiased text-gray-800 py-3 sm:py-6 px-3 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">

        {/* 1. TOP HEADER NAVIGATION BAR */}
        <div className="flex items-center justify-between py-1">
          {/* Back Button */}
          <Link
            to="/profile"
            className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-800 hover:bg-gray-50 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>

          {/* Title Header */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🪙</span>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Your Game Points</h1>
          </div>

          {/* Spacer to keep title centered */}
          <div className="w-10 h-10 sm:w-11 sm:h-11" />
        </div>

        {/* 2. TOP 2 METRIC CARDS GRID (SIDE BY SIDE ON MOBILE) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
          
          {/* Card 1 (Left): POINTS BALANCE */}
          <div className="bg-gradient-to-b from-[#6ec810] via-[#5db300] to-[#488710] rounded-3xl p-3.5 sm:p-5 text-white shadow-md relative flex flex-col items-center text-center justify-between min-h-[175px] sm:min-h-[190px]">
            {/* Top Floating Badge Circle */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center -mt-8 sm:-mt-9 shadow-inner border border-white/30">
              <div className="w-8 h-8 rounded-full bg-[#75d512] flex items-center justify-center text-white font-black text-sm shadow-xs">
                ✨🪙
              </div>
            </div>

            {/* Content */}
            <div className="space-y-0.5 mt-1">
              <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-100 tracking-wider block">
                POINTS BALANCE
              </span>
              <p className="text-[9px] sm:text-[11px] text-white/90 font-medium leading-tight max-w-[130px] mx-auto">
                Total points available for conversion
              </p>
            </div>

            {/* Big Score */}
            <div className="my-1">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tight flex items-baseline justify-center gap-1">
                <span>{customerPoints.toLocaleString()}</span>
                <span className="text-xs sm:text-sm font-black text-amber-300">PTS</span>
              </h2>
            </div>

            {/* Bottom Tag Pill */}
            <div className="bg-black/20 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-xl w-full flex items-center justify-center gap-1.5 truncate">
              <span>🎁 Earned by playing Catch the Gift</span>
            </div>
          </div>

          {/* Card 2 (Right): CONVERTIBLE VALUE */}
          <div className="bg-gradient-to-b from-[#ffa300] via-[#ff8800] to-[#f07400] rounded-3xl p-3.5 sm:p-5 text-white shadow-md relative flex flex-col items-center text-center justify-between min-h-[175px] sm:min-h-[190px]">
            {/* Top Floating Badge Circle */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center -mt-8 sm:-mt-9 shadow-inner border border-white/30">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-xs">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-0.5 mt-1">
              <span className="text-[10px] sm:text-xs font-black uppercase text-amber-100 tracking-wider block">
                CONVERTIBLE VALUE
              </span>
              <p className="text-[9px] sm:text-[11px] text-white/90 font-medium leading-tight max-w-[130px] mx-auto">
                1,000 Points = ₹1 Store Cash
              </p>
            </div>

            {/* Big Value */}
            <div className="my-1">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tight">
                ₹{rupeesValue}
              </h2>
            </div>

            {/* Bottom Tag Pill */}
            <div className="bg-black/20 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-xl w-full flex items-center justify-center gap-1.5 truncate">
              <span>📄 Ready to convert to Store Cash</span>
            </div>
          </div>

        </div>

        {/* 3. POINTS CONVERSION RULE CONTAINER CARD */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100/90 space-y-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-100/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5db300] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">Points Conversion Rule</h3>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                  Convert your earned points into store cash instantly!
                </p>
              </div>
            </div>

            <span className="bg-[#e8f8e0] text-[#386b0c] text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full border border-[#d2f0c0] shrink-0">
              1,000 PTS = ₹1
            </span>
          </div>

          {/* 4 Conversion Tier Cards (2x2 Grid on Mobile) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            
            {/* Tier 1 */}
            <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1">
              <span className="text-2xl">🎁</span>
              <span className="text-xs font-bold text-gray-800 block">1,000 Points</span>
              <div className="text-xs font-black text-[#488710] flex items-center justify-center gap-1 pt-0.5">
                <span>➔</span>
                <span className="text-sm font-black">₹1</span>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1">
              <span className="text-2xl">🎁</span>
              <span className="text-xs font-bold text-gray-800 block">5,000 Points</span>
              <div className="text-xs font-black text-[#488710] flex items-center justify-center gap-1 pt-0.5">
                <span>➔</span>
                <span className="text-sm font-black">₹5</span>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1">
              <span className="text-2xl">🎁</span>
              <span className="text-xs font-bold text-gray-800 block">10,000 Points</span>
              <div className="text-xs font-black text-[#488710] flex items-center justify-center gap-1 pt-0.5">
                <span>➔</span>
                <span className="text-sm font-black">₹10</span>
              </div>
            </div>

            {/* Tier 4 */}
            <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-2xl p-3 text-center flex flex-col items-center justify-center space-y-1">
              <span className="text-2xl">🎁</span>
              <span className="text-xs font-bold text-gray-800 block">25,000 Points</span>
              <div className="text-xs font-black text-[#488710] flex items-center justify-center gap-1 pt-0.5">
                <span>➔</span>
                <span className="text-sm font-black">₹25</span>
              </div>
            </div>

          </div>

          {/* Action Convert Button Bar */}
          <div>
            {canConvert ? (
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(true)}
                className="w-full bg-[#488710] hover:bg-[#386b0c] text-white rounded-2xl py-3.5 px-4 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <Coins className="w-5 h-5 text-white" />
                <span>Convert {pointsToConvert.toLocaleString()} Points to ₹{rupeesValue}</span>
              </button>
            ) : (
              <div className="bg-[#eef8ea] border border-[#d8f2c8] text-[#386b0c] rounded-2xl p-3 text-center text-xs font-black flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#488710] text-white flex items-center justify-center text-[10px]">
                  ✓
                </div>
                <span>Minimum 1,000 Points Required to Convert</span>
              </div>
            )}
          </div>

          {/* Notice Banner */}
          {!canConvert && (
            <div className="bg-[#fff6ea] border border-[#ffe8cc] text-[#9c5300] rounded-2xl p-3 text-xs font-bold flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#ff9900] text-white flex items-center justify-center font-black shrink-0 text-xs">
                i
              </div>
              <span className="leading-snug">
                You need at least 1,000 Points to make a conversion.<br className="hidden sm:inline" /> Play Catch the Gift to earn points!
              </span>
            </div>
          )}

        </div>

        {/* 4. CONVERSION HISTORY CONTAINER CARD */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100/90 space-y-4">
          
          <div className="flex items-center justify-between border-b border-gray-100/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5db300] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900">Conversion History</h3>
            </div>

            <span className="bg-[#e8f8e0] text-[#386b0c] text-[10px] sm:text-xs font-black px-3 py-1 rounded-full border border-[#d2f0c0]">
              {conversions.length} Converted
            </span>
          </div>

          {conversions.length === 0 ? (
            <div className="py-8 text-center text-gray-400 space-y-2">
              <div className="w-16 h-16 bg-[#eef8ea] text-[#5db300] rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                📦
              </div>
              <h4 className="text-sm font-black text-gray-900 pt-1">No Conversions Yet</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Your points conversion history will appear here once you convert points.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversions.map((conv, idx) => (
                <div key={conv._id || idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#488710] flex items-center justify-center font-black">
                      <Check className="w-4 h-4 text-[#488710]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900">
                        Converted {conv.pointsConverted.toLocaleString()} Points
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {conv.convertedAt ? new Date(conv.convertedAt).toLocaleString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-[#488710] block">
                      +₹{conv.rupeesEarned}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      {conv.status || 'COMPLETED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 5. "WANT MORE POINTS?" PROMO BANNER CARD */}
        <div className="bg-gradient-to-r from-[#033c3a] via-[#054a48] to-[#075956] rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between gap-3 relative overflow-hidden">
          {/* Subtle Glow Background Overlay */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Left Graphic & Text Group */}
          <div className="flex items-center gap-3 min-w-0">
            {/* 3D Game / Gift Emoji Cluster */}
            <div className="relative shrink-0 flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16">
              <span className="text-2xl sm:text-3xl filter drop-shadow-md">🎮</span>
              <span className="text-xl sm:text-2xl absolute -top-1 -right-1 filter drop-shadow-md">🎁</span>
              <span className="text-xs absolute -bottom-1 -left-1">🪙</span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                Want more points?
              </h3>
              <p className="text-[10px] sm:text-xs text-emerald-100/90 font-medium leading-snug">
                Play Catch the Gift and collect amazing rewards!
              </p>
            </div>
          </div>

          {/* Right Play Now Button */}
          <Link
            to="/play-and-win"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-[#054a48] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-black shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 border border-emerald-100 cursor-pointer"
          >
            <span>Play Now</span>
            <ChevronRight className="w-4 h-4 text-[#054a48] stroke-[3]" />
          </Link>
        </div>

      </div>

      {/* CONVERSION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center border border-gray-100 animate-scale-up">
            <div className="w-14 h-14 bg-emerald-100 text-[#488710] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Coins className="w-7 h-7 text-[#488710]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Confirm Points Conversion</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Are you sure you want to convert <span className="font-extrabold text-[#488710] font-mono">{pointsToConvert.toLocaleString()} Points</span> into <span className="font-extrabold text-amber-600 font-mono">₹{rupeesValue} Store Cash</span>?
              </p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-left text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-gray-700">
                <span>Points to Deduct:</span>
                <span className="font-mono text-rose-600">-{pointsToConvert.toLocaleString()} PTS</span>
              </div>
              <div className="flex justify-between font-extrabold text-emerald-800 pt-1 border-t border-emerald-200/60">
                <span>Store Cash Earned:</span>
                <span className="font-mono text-[#488710] text-sm">+₹{rupeesValue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-3 px-4 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isSubmitting}
                onClick={handleConversionSubmit}
                className="flex-1 bg-[#488710] hover:bg-[#386b0c] text-white font-extrabold py-3 px-4 rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Converting...' : 'Confirm Conversion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
