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
  ChevronRight,
  Disc,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { safeFetch } from '../utils/api';

interface ConversionHistoryItem {
  _id?: string;
  pointsConverted: number;
  rupeesEarned: number;
  convertedAt: string;
  status: string;
}

export interface WalletTransactionItem {
  id: string;
  type: 'SPIN_AND_WIN' | 'CATCH_THE_GIFT' | 'CONVERSION' | 'PURCHASE_REDEEM' | string;
  title: string;
  prize?: string;
  amount: number;
  pointsDeducted?: number;
  unit: 'POINTS' | 'RUPEES';
  description: string;
  date: string;
  status: string;
}

export const Points: React.FC = () => {
  const { customerUser, isAuthenticated, customerPoints, fetchCustomerPoints, customerWalletBalance } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [conversions, setConversions] = useState<ConversionHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
  const [totalSpinCoins, setTotalSpinCoins] = useState<number>(0);
  const [totalCatchPoints, setTotalCatchPoints] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SPIN_AND_WIN' | 'CATCH_THE_GIFT' | 'CONVERSION' | 'PURCHASE_REDEEM'>('ALL');
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

  // Fetch detailed conversion data and wallet transactions from API
  const loadPointsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await safeFetch('/catch-game/my-points', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok && res.isJson && res.data?.success) {
        setConversions(res.data.conversions || []);
        setTransactions(res.data.transactions || []);
        setWalletBalance(res.data.walletBalance || 0);
        setTotalSpinCoins(res.data.totalSpinCoins || 0);
        setTotalCatchPoints(res.data.totalCatchPoints || 0);
        fetchCustomerPoints();
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
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await safeFetch('/catch-game/convert-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok && res.isJson && res.data?.success) {
        addToast('🎉 Conversion Successful!', res.data.message || `Converted ${pointsToConvert.toLocaleString()} points to ₹${rupeesValue}`, 'success');
        setShowConfirmModal(false);
        await loadPointsData();
        await fetchCustomerPoints();
      } else {
        addToast('Conversion Failed', res.data?.message || res.error || 'Unable to convert points right now', 'error');
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

        {/* 2. TOP 3 METRIC CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4">
          
          {/* Card 1: AVAILABLE STORE CASH */}
          <div className="bg-gradient-to-b from-[#024430] via-[#046145] to-[#067252] rounded-3xl p-3.5 sm:p-5 text-white shadow-md relative flex flex-col items-center text-center justify-between min-h-[175px] sm:min-h-[190px]">
            {/* Top Floating Badge Circle */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center -mt-8 sm:-mt-9 shadow-inner border border-white/30">
              <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-white font-black text-sm shadow-xs">
                <Wallet className="w-4 h-4 text-slate-900" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-0.5 mt-1">
              <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-200 tracking-wider block">
                AVAILABLE STORE CASH
              </span>
              <p className="text-[9px] sm:text-[11px] text-white/90 font-medium leading-tight max-w-[130px] mx-auto">
                Ready to redeem on orders
              </p>
            </div>

            {/* Big Value */}
            <div className="my-1">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tight">
                ₹{walletBalance}
              </h2>
            </div>

            {/* Bottom Tag Pill */}
            <div className="bg-black/25 text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-xl w-full flex items-center justify-center gap-1.5 truncate">
              <span>💳 Min. ₹30 redeemable at Checkout</span>
            </div>
          </div>

          {/* Card 2: AVAILABLE POINTS */}
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
                AVAILABLE POINTS
              </span>
              <p className="text-[9px] sm:text-[11px] text-white/90 font-medium leading-tight max-w-[130px] mx-auto">
                Total points earned
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
              <span>
                🎮 Spin &amp; Win (🪙{totalSpinCoins.toLocaleString()}) + Catch Game (🎁{totalCatchPoints.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Card 3: CONVERTIBLE VALUE */}
          <div className="bg-gradient-to-b from-[#ffa300] via-[#ff8800] to-[#f07400] rounded-3xl p-3.5 sm:p-5 text-white shadow-md relative flex flex-col items-center text-center justify-between min-h-[175px] sm:min-h-[190px]">
            {/* Top Floating Badge Circle */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center -mt-8 sm:-mt-9 shadow-inner border border-white/30">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
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
              <span>📄 Unified wallet for all game rewards</span>
            </div>
          </div>

        </div>

        {/* 2B. POINTS CONVERSION RATE & REDEMPTION HIGHLIGHT BANNER */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#488710] flex items-center justify-center text-lg font-black shrink-0 border border-emerald-100">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <span className="text-xs sm:text-sm font-black text-gray-900">
                  Unified Conversion Rate:
                </span>
                <span className="text-xs sm:text-sm font-black text-[#488710] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  1,000 Points = ₹1 Store Cash
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Coins won in Spin &amp; Win and Catch the Gift combine into one wallet. Convert to Store Cash here, then redeem at Checkout (Min. ₹30 threshold).
              </p>
            </div>
          </div>
          <Link
            to="/shop"
            className="bg-[#488710] hover:bg-[#386b0c] text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95"
          >
            <span>Redeem in Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
                  Convert your accumulated game coins into store cash instantly!
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
                You need at least 1,000 Points to convert into Store Cash.<br className="hidden sm:inline" /> Play Spin &amp; Win or Catch the Gift to earn more points!
              </span>
            </div>
          )}

        </div>

        {/* 4. UNIFIED WALLET & TRANSACTION HISTORY CONTAINER CARD */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100/90 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#5db300] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">
                  Wallet &amp; Transaction History
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                  Complete audit log of Spin &amp; Win coins, game scores, and cash conversions
                </p>
              </div>
            </div>

            <span className="bg-[#e8f8e0] text-[#386b0c] text-[10px] sm:text-xs font-black px-3 py-1 rounded-full border border-[#d2f0c0] self-start sm:self-auto">
              {transactions.length} Total Records
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setActiveFilter('SPIN_AND_WIN')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeFilter === 'SPIN_AND_WIN'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
              }`}
            >
              <span>🪙 Spin &amp; Win</span>
              <span>({transactions.filter((t) => t.type === 'SPIN_AND_WIN').length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('CATCH_THE_GIFT')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeFilter === 'CATCH_THE_GIFT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
              }`}
            >
              <span>🎁 Catch Game</span>
              <span>({transactions.filter((t) => t.type === 'CATCH_THE_GIFT').length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('CONVERSION')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeFilter === 'CONVERSION'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60'
              }`}
            >
              <span>💳 Conversions</span>
              <span>({transactions.filter((t) => t.type === 'CONVERSION').length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('PURCHASE_REDEEM')}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeFilter === 'PURCHASE_REDEEM'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60'
              }`}
            >
              <span>🛍️ Store Cash Spent</span>
              <span>({transactions.filter((t) => t.type === 'PURCHASE_REDEEM').length})</span>
            </button>
          </div>

          {/* Transactions List */}
          {transactions.filter((t) => activeFilter === 'ALL' || t.type === activeFilter).length === 0 ? (
            <div className="py-8 text-center text-gray-400 space-y-2">
              <div className="w-16 h-16 bg-[#eef8ea] text-[#5db300] rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
                🪙
              </div>
              <h4 className="text-sm font-black text-gray-900 pt-1">No Activity in this Category</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Play Spin &amp; Win or Catch the Gift to collect coins and earn store cash!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-1">
              {transactions
                .filter((t) => activeFilter === 'ALL' || t.type === activeFilter)
                .map((tx) => {
                  const isSpin = tx.type === 'SPIN_AND_WIN';
                  const isCatch = tx.type === 'CATCH_THE_GIFT';
                  const isConversion = tx.type === 'CONVERSION';
                  const isRedeem = tx.type === 'PURCHASE_REDEEM';

                  return (
                    <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                      {/* Left Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-black shadow-2xs ${
                            isSpin
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                              : isCatch
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                              : isConversion
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                              : 'bg-gradient-to-br from-rose-500 to-rose-700 text-white'
                          }`}
                        >
                          {isSpin ? (
                            <Disc className="w-4 h-4 text-white" />
                          ) : isCatch ? (
                            <Gift className="w-4 h-4 text-white" />
                          ) : isConversion ? (
                            <RefreshCw className="w-4 h-4 text-white" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-white" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">
                              {tx.title}
                            </p>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isSpin
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : isCatch
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : isConversion
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : 'bg-rose-100 text-rose-900 border border-rose-200'
                              }`}
                            >
                              {isSpin
                                ? 'Spin & Win'
                                : isCatch
                                ? 'Catch Game'
                                : isConversion
                                ? 'Conversion'
                                : 'Redeemed'}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 truncate leading-snug">
                            {tx.description || tx.prize}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {tx.date ? new Date(tx.date).toLocaleString() : 'Recent'}
                          </p>
                        </div>
                      </div>

                      {/* Right Amount & Status */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black block ${
                            isRedeem
                              ? 'text-rose-600 font-mono'
                              : isConversion
                              ? 'text-emerald-700 font-mono'
                              : isSpin
                              ? 'text-amber-600 font-mono'
                              : 'text-[#488710] font-mono'
                          }`}
                        >
                          {isRedeem
                            ? `-₹${Math.abs(tx.amount)}`
                            : isConversion
                            ? `+₹${tx.amount} Cash`
                            : `+${tx.amount.toLocaleString()} Coins`}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {tx.status || 'COMPLETED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

        </div>

        {/* 5. "WANT MORE POINTS?" PROMO BANNER CARD WITH DUAL GAME LINKS */}
        <div className="bg-gradient-to-r from-[#033c3a] via-[#054a48] to-[#075956] rounded-3xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          {/* Subtle Glow Background Overlay */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Left Graphic & Text Group */}
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto text-center sm:text-left justify-center sm:justify-start">
            <div className="relative shrink-0 flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16">
              <span className="text-2xl sm:text-3xl filter drop-shadow-md">🎮</span>
              <span className="text-xl sm:text-2xl absolute -top-1 -right-1 filter drop-shadow-md">🎡</span>
              <span className="text-xs absolute -bottom-1 -left-1">🪙</span>
            </div>

            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Want to earn more coins &amp; store cash?
              </h3>
              <p className="text-[10px] sm:text-xs text-emerald-100/90 font-medium leading-snug">
                Spin the Lucky Wheel or play Catch the Gift to collect coins!
              </p>
            </div>
          </div>

          {/* Right Dual Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
            <Link
              to="/spin-and-win"
              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 px-3.5 py-2 rounded-full text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
            >
              <span>🪙 Spin &amp; Win</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </Link>

            <Link
              to="/play-and-win"
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 text-[#054a48] px-3.5 py-2 rounded-full text-xs font-black shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 border border-emerald-100 cursor-pointer"
            >
              <span>🎁 Catch Game</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#054a48] stroke-[3]" />
            </Link>
          </div>
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
