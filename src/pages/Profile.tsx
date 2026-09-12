import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Heart,
  Gamepad2,
  Ticket,
  Store,
  LogOut,
  Pencil,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  Coins,
  X,
  MoreVertical,
  MapPin,
  ShieldCheck,
  RotateCcw,
  FileText,
  HelpCircle,
  Clock,
  Headphones,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Button } from '../components/Button';
import chokkuLogo from '../assets/img/chokku.png';

export const Profile: React.FC = () => {
  const { user, isAuthenticated, customerPoints, fetchCustomerPoints, updateProfile, logout, orders } = useAuth();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();

  // Fetch points on mount
  useEffect(() => {
    fetchCustomerPoints();
  }, []);

  const [activeModal, setActiveModal] = useState<
    'none' | 'privacy' | 'returnPolicy' | 'terms' | 'support' | 'payments'
  >('none');

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-gray-500 text-sm mt-1">
          Sign in to view your profile, manage addresses, and check order status.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button variant="primary">Sign In Now</Button>
        </Link>
      </div>
    );
  }

  const displayName = user.username || user.name || 'Customer';
  const displayEmail = user.email || '';
  const displayPhone = user.phone || '+91 576567564564';
  const initialLetter = displayName.charAt(0).toUpperCase();

  const totalSpent = orders.reduce(
    (sum, ord) => sum + (ord.status !== 'Cancelled' ? ord.totalAmount : 0),
    0
  );
  const rewardPoints = Math.floor(totalSpent * 10);
  const gamesPlayed = 0;
  const availableCoupons = orders.length > 0 ? 1 : 0;

  return (
    <div className="bg-[#f7faf5] min-h-screen py-3 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans pb-24 lg:pb-8">
      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">

        {/* 1. TOP USER PROFILE CARD */}
        <div className="bg-[#f0f9e8] rounded-3xl p-4 sm:p-5 border border-emerald-100/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Left: Avatar + Details */}
          <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            {/* Avatar Circle with Edit Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#488710] text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md ring-4 ring-white">
                {initialLetter}
              </div>
              <button
                onClick={() => navigate('/edit-profile')}
                className="w-6 h-6 bg-white border border-[#488710]/20 rounded-full flex items-center justify-center text-[#488710] absolute -bottom-0.5 -right-0.5 shadow-2xs hover:bg-[#f0f9e8] transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <Pencil className="w-3 h-3 text-[#488710]" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                  {displayName}
                </h1>
                <span className="bg-emerald-100/90 text-[#386b0c] text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                  Verified Customer <CheckCircle2 className="w-3 h-3 fill-[#488710] text-white" />
                </span>
              </div>

              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{displayEmail}</span>
              </p>

              <p className="text-xs text-[#488710] font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#488710] shrink-0" />
                <span>{displayPhone}</span>
              </p>
            </div>
          </div>

          {/* Right: Action Buttons (Orders & Logout) */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-100">
            <Link to="/orders" className="flex-1 sm:flex-initial">
              <button className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-xl px-3.5 py-2 text-xs font-extrabold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Orders ({orders.length})</span>
              </button>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex-1 sm:flex-initial bg-[#e11d48] hover:bg-rose-700 text-white rounded-xl px-3.5 py-2 text-xs font-extrabold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 2. METRICS STATS BAR */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-100 shadow-2xs grid grid-cols-5 divide-x divide-gray-100 text-center">
          {/* 1. Total Game Points */}
          <Link to="/points" className="flex flex-col items-center justify-center px-1 hover:opacity-80 transition-opacity cursor-pointer group" title="View & Convert Game Points">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
            <span className="text-sm sm:text-base font-black text-gray-900 block leading-tight">
              {customerPoints}
            </span>
            <span className="text-[9px] sm:text-[11px] text-[#488710] font-bold block truncate max-w-full underline">
              Game PTS
            </span>
          </Link>

          {/* 2. Games Played */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 text-purple-500 border border-purple-100 flex items-center justify-center mb-1">
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
            <span className="text-sm sm:text-base font-black text-gray-900 block leading-tight">
              {gamesPlayed}
            </span>
            <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
              Games Played
            </span>
          </div>

          {/* 3. Orders Placed */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] flex items-center justify-center mb-1">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
            <span className="text-sm sm:text-base font-black text-gray-900 block leading-tight">
              {orders.length}
            </span>
            <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
              Orders Placed
            </span>
          </div>

          {/* 4. Coupons */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center mb-1">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
            <span className="text-sm sm:text-base font-black text-gray-900 block leading-tight">
              {availableCoupons}
            </span>
            <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
              Coupons
            </span>
          </div>

          {/* 5. Wishlist Items */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-pink-50 text-rose-500 border border-pink-100 flex items-center justify-center mb-1">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
            </div>
            <span className="text-sm sm:text-base font-black text-gray-900 block leading-tight">
              {wishlistIds.length > 0 ? wishlistIds.length : 1}
            </span>
            <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
              Wishlist Items
            </span>
          </div>
        </div>

        {/* 3. INTERACTIVE NAVIGATION CARDS LIST */}
        <div className="space-y-2.5 sm:space-y-3">
          {/* ROW 1: My Orders */}
          <div
            onClick={() => navigate('/orders')}
            className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 hover:border-[#d2ea9d] shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                  My Orders
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                  Track, view and reorder your recent purchases.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-2.5 py-1 text-center hidden xs:block">
                <p className="text-[9px] text-gray-400 font-semibold leading-none">Last Order</p>
                <p className="text-[11px] font-bold text-gray-700 mt-0.5 leading-tight">
                  {orders.length > 0 ? orders[0].date : 'No orders yet'}
                </p>
                <span className="text-[9px] font-extrabold text-gray-400 block mt-0.5">
                  {orders.length > 0 ? orders[0].status : 'None'}
                </span>
              </div>
              <div className="w-10 h-8 bg-amber-100 rounded-xl border border-amber-200 shadow-2xs hidden sm:flex items-center justify-center text-xs transform rotate-6">
                📦
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 group-hover:border-[#488710] group-hover:bg-[#f0f9e8] flex items-center justify-center text-gray-400 group-hover:text-[#488710] transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ROW 2: Rewards & Points */}
          <div
            onClick={() => navigate('/play-and-win')}
            className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 hover:border-amber-200 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                  Rewards &amp; Points
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                  Check your points balance and redeem exciting rewards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-2.5 py-1 text-center hidden xs:block">
                <p className="text-[9px] text-gray-400 font-semibold leading-none">Available Points</p>
                <p className="text-[11px] font-black text-[#488710] mt-0.5">{rewardPoints} pts</p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-tr from-amber-300 to-yellow-400 rounded-full border border-amber-200 shadow-2xs hidden sm:flex items-center justify-center text-sm">
                🏆
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 group-hover:border-[#488710] group-hover:bg-[#f0f9e8] flex items-center justify-center text-gray-400 group-hover:text-[#488710] transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ROW 3: Play & Earn */}
          <div
            onClick={() => navigate('/play-and-win')}
            className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 hover:border-purple-200 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                  Play &amp; Earn
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                  Play fun games and earn reward points.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-2.5 py-1 text-center hidden xs:block">
                <p className="text-[9px] text-gray-400 font-semibold leading-none">Games Played</p>
                <p className="text-[11px] font-black text-gray-800 mt-0.5">{gamesPlayed}</p>
              </div>
              <div className="w-10 h-7 bg-purple-600 text-white rounded-xl shadow-2xs hidden sm:flex items-center justify-center text-xs transform -rotate-6">
                🎮
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 group-hover:border-[#488710] group-hover:bg-[#f0f9e8] flex items-center justify-center text-gray-400 group-hover:text-[#488710] transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ROW 4: My Wishlist */}
          <div
            onClick={() => navigate('/shop')}
            className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 hover:border-pink-200 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-pink-50 text-rose-500 border border-pink-200 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                  My Wishlist
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                  Your saved items will appear here.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-2.5 py-1 text-center hidden xs:block">
                <p className="text-[9px] text-gray-400 font-semibold leading-none">Saved Items</p>
                <p className="text-[11px] font-black text-rose-500 mt-0.5">
                  {wishlistIds.length > 0 ? wishlistIds.length : 1} Items
                </p>
              </div>
              <div className="w-9 h-9 bg-pink-100 border border-pink-200 rounded-xl shadow-2xs hidden sm:flex items-center justify-center text-xs">
                🛍️
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 group-hover:border-[#488710] group-hover:bg-[#f0f9e8] flex items-center justify-center text-gray-400 group-hover:text-[#488710] transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ROW 5: Shop */}
          <div
            onClick={() => navigate('/shop')}
            className="bg-white rounded-3xl p-3.5 sm:p-4 border border-gray-100 hover:border-emerald-200 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                  Shop
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
                  Explore products and discover new arrivals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden xs:block">
                <span className="bg-white hover:bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] text-[11px] font-extrabold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  <ShoppingBag className="w-3 h-3" />
                  <span>Start Shopping</span>
                </span>
              </div>
              <div className="w-10 h-7 bg-[#488710] text-white rounded-xl shadow-2xs hidden sm:flex items-center justify-center text-xs transform rotate-6">
                🛍️
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-200 group-hover:border-[#488710] group-hover:bg-[#f0f9e8] flex items-center justify-center text-gray-400 group-hover:text-[#488710] transition-all">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. ACCOUNT & SUPPORT SECTION (Matching Screenshot) */}
        <div className="pt-2">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider px-2 mb-2">
            ACCOUNT &amp; SUPPORT
          </h3>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs divide-y divide-gray-100 overflow-hidden">
            {/* 1. Edit Profile */}
            <div
              onClick={() => navigate('/edit-profile')}
              className="p-3.5 sm:p-4 hover:bg-[#f0f9e8]/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#488710] flex items-center justify-center shrink-0 border border-emerald-100">
                  <Pencil className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                    Edit Profile
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    Update your personal details
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#488710] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 2. Addresses */}
            <div
              onClick={() => navigate('/addresses')}
              className="p-3.5 sm:p-4 hover:bg-[#f0f9e8]/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#488710] flex items-center justify-center shrink-0 border border-emerald-100">
                  <MapPin className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                    Addresses
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    Manage your addresses
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#488710] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 3. Payment Methods */}
            <div
              onClick={() => setActiveModal('payments')}
              className="p-3.5 sm:p-4 hover:bg-[#f0f9e8]/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#488710] flex items-center justify-center shrink-0 border border-emerald-100">
                  <CreditCard className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                    Payment Methods
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    Manage your saved payment methods
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#488710] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 4. Privacy Policy */}
            <div
              onClick={() => setActiveModal('privacy')}
              className="p-3.5 sm:p-4 hover:bg-[#f0f9e8]/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#488710] flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                    Privacy Policy
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    Read our privacy policy
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#488710] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>

            {/* 5. Return Policy */}
            <div
              onClick={() => setActiveModal('returnPolicy')}
              className="p-3.5 sm:p-4 hover:bg-[#f0f9e8]/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#488710] flex items-center justify-center shrink-0 border border-emerald-100">
                  <RotateCcw className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#488710] transition-colors truncate">
                    Return Policy
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    Read our return policy
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#488710] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>
        </div>

      </div>



      {/* 6. SETTINGS MODALS (Address, Privacy, Return Policy, Terms, Support) */}



      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-3 relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <ShieldCheck className="w-5 h-5 text-[#488710]" />
              <h3 className="text-lg font-extrabold text-gray-900">Privacy Policy</h3>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                At <strong>Chokku Store</strong>, we prioritize the protection and confidentiality of your personal information.
              </p>
              <div className="bg-[#f0f9e8] p-3 rounded-2xl border border-emerald-100 text-gray-800 space-y-1">
                <p className="font-extrabold text-[#488710]">🔐 Data Encryption Guarantee</p>
                <p className="text-[11px]">All transactions, personal details, and address records are encrypted end-to-end with 256-bit SSL protocols.</p>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                <li>We do not sell or rent customer data to third-party advertisers.</li>
                <li>Your phone number and email are strictly used for order updates and verification.</li>
                <li>Payment records are processed via PCI-DSS compliant payment gateways.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-2.5 text-xs font-extrabold text-white bg-[#488710] hover:bg-[#386b0c] rounded-xl transition-colors shadow-md cursor-pointer"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Policy Modal */}
      {activeModal === 'returnPolicy' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-3 relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <RotateCcw className="w-5 h-5 text-[#488710]" />
              <h3 className="text-lg font-extrabold text-gray-900">Return &amp; Refund Policy</h3>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                We offer a hassle-free <strong>7-Day Easy Return &amp; Exchange Guarantee</strong> on all Chokku Store products!
              </p>
              <div className="bg-[#f0f9e8] p-3 rounded-2xl border border-emerald-100 text-gray-800 space-y-1">
                <p className="font-extrabold text-[#488710]">📦 Free Pickup on Damaged Goods</p>
                <p className="text-[11px]">If you receive a defective or wrong item, our courier partner will pick it up from your doorstep at zero extra cost.</p>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                <li>Return requests must be initiated within 7 days of delivery.</li>
                <li>Refunds are processed back to your original payment method within 24-48 hours of quality check.</li>
                <li>Unused items with original tags and packaging intact qualify for 100% full refund.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-2.5 text-xs font-extrabold text-white bg-[#488710] hover:bg-[#386b0c] rounded-xl transition-colors shadow-md cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-3 relative animate-fade-in max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <FileText className="w-5 h-5 text-[#488710]" />
              <h3 className="text-lg font-extrabold text-gray-900">Terms &amp; Conditions</h3>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                Welcome to Chokku Store. By accessing or using our services, you agree to comply with our terms and guidelines:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-700">
                <li><strong>Account Safety:</strong> You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li><strong>Reward Points &amp; Coupons:</strong> Game rewards and discount vouchers are non-transferable and subject to validity periods.</li>
                <li><strong>Product Availability:</strong> Items are subject to stock availability and pricing updates.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-2.5 text-xs font-extrabold text-white bg-[#488710] hover:bg-[#386b0c] rounded-xl transition-colors shadow-md cursor-pointer"
              >
                Accept &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative animate-fade-in">
            <button
              onClick={() => setActiveModal('none')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <Headphones className="w-5 h-5 text-[#488710]" />
              <h3 className="text-lg font-extrabold text-gray-900">Help &amp; Support</h3>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <p className="text-gray-500 font-medium">
                Need help with an order, payment, or game rewards? Our dedicated support team is available 6 days a week!
              </p>

              <div className="bg-[#f0f9e8] p-3.5 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#488710]" />
                  <span className="font-extrabold text-gray-900">+91 98765 43210</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#488710]" />
                  <span className="font-bold text-gray-800">support@chokku.store</span>
                </div>

                <div className="flex items-center gap-2.5 text-gray-500 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Mon – Sat: 9:00 AM – 7:00 PM</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={() => setActiveModal('none')}
                className="w-full py-2.5 text-xs font-extrabold text-white bg-[#488710] hover:bg-[#386b0c] rounded-xl transition-colors shadow-md cursor-pointer"
              >
                Close Support
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
