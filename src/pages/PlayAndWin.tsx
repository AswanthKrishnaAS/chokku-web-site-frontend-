import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Gamepad2,
  Gift,
  Percent,
  Star,
  ChevronRight,
  Sparkles,
  X,
  Copy,
  Check,
  Play,
  Flame,
  Award,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import playbgm from '../assets/img/playbgm.png';
import playmobile from '../assets/img/playmobile.png';
import gameboy from '../assets/img/gameboy.png';
import spinwin from '../assets/img/spinwin.png';
import notificationSound from '../assets/notification.mp3';

interface CouponItem {
  id: string;
  code: string;
  discount: string;
  title: string;
  desc: string;
  expiry: string;
  color: string;
  badge?: string;
}

export const PlayAndWin: React.FC = () => {
  const { addToast } = useToast();
  const [activeGameModal, setActiveGameModal] = useState<'coupons' | null>(null);

  // Saved coupons state
  const [myCoupons, setMyCoupons] = useState<CouponItem[]>([
    {
      id: 'c1',
      code: 'CHOKKU100',
      discount: '₹100 OFF',
      title: 'Welcome Arcade Voucher',
      desc: 'Applicable on any order above ₹499',
      expiry: 'Valid for 7 days',
      color: 'from-emerald-500 to-teal-600',
      badge: 'NEW'
    },
    {
      id: 'c2',
      code: 'PLAY15',
      discount: '15% OFF',
      title: 'Arcade Gamer Special',
      desc: 'Extra 15% discount on top categories',
      expiry: 'Valid for 14 days',
      color: 'from-sky-500 to-blue-600',
      badge: 'ACTIVE'
    },
    {
      id: 'c3',
      code: 'FREESHIP',
      discount: 'FREE DELIVERY',
      title: 'Free Shipping Pass',
      desc: 'Zero shipping fee on your next purchase',
      expiry: 'Valid for 30 days',
      color: 'from-purple-500 to-indigo-600',
      badge: 'ACTIVE'
    }
  ]);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load saved coupons from localStorage
  useEffect(() => {
    try {
      const savedCoupons = localStorage.getItem('chokku_user_coupons');
      if (savedCoupons) {
        setMyCoupons(JSON.parse(savedCoupons));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Hide mobile bottom navigation bar when modal is active
  useEffect(() => {
    if (activeGameModal) {
      document.body.classList.add('hide-bottom-nav');
    } else {
      document.body.classList.remove('hide-bottom-nav');
    }
    return () => {
      document.body.classList.remove('hide-bottom-nav');
    };
  }, [activeGameModal]);

  const saveCoupons = (newCoupons: CouponItem[]) => {
    setMyCoupons(newCoupons);
    try {
      localStorage.setItem('chokku_user_coupons', JSON.stringify(newCoupons));
    } catch (e) {
      console.error(e);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio(notificationSound);
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch {}
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('Coupon Copied!', `Code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };



  const openGameModal = (game: 'coupons') => {
    setActiveGameModal(game);
  };

  return (
    <div className="min-h-screen bg-[#f7faf5] font-sans antialiased text-gray-800 py-3 sm:py-6 px-3 sm:px-6 lg:px-8 pb-24 lg:pb-12">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* 1. HERO BANNER CARD WITH SEAMLESS ALIGNED BACKGROUND IMAGES */}
        <div className="bg-gradient-to-br from-[#f2f9ec] via-[#f7fcf2] to-[#ebf6df] rounded-3xl p-4 sm:p-6 border border-emerald-100/90 shadow-2xs relative overflow-hidden min-h-[200px] sm:min-h-[210px]">
          
          {/* Mobile Background Image Aligned Top (playmobile.png) */}
          <div
            style={{ backgroundImage: `url(${playmobile})`, backgroundPosition: 'right top' }}
            className="block sm:hidden absolute top-0 right-0 bottom-0 left-0 bg-contain bg-no-repeat pointer-events-none z-0 opacity-40"
          />

          {/* Desktop Background Image Aligned (playbgm.png) */}
          <div
            style={{ backgroundImage: `url(${playbgm})` }}
            className="hidden sm:block absolute top-0 right-0 bottom-0 w-[52%] bg-contain bg-right bg-no-repeat pointer-events-none z-0"
          />

          {/* Top Return Link & Coupons Button */}
          <div className="relative z-10 flex items-center justify-between mb-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#488710] font-extrabold text-[11px] bg-white/95 px-3 py-1.5 rounded-full shadow-2xs hover:bg-white transition-all border border-gray-200/80 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Store</span>
            </Link>

            <button
              onClick={() => openGameModal('coupons')}
              className="inline-flex items-center gap-1.5 text-rose-700 hover:text-rose-800 font-extrabold text-[11px] bg-white/95 px-3.5 py-1.5 rounded-full shadow-2xs hover:bg-white transition-all border border-rose-200 cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>My Coupons ({myCoupons.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center relative z-10">
            {/* Left Content */}
            <div className="sm:col-span-7 space-y-2 sm:space-y-2.5 w-full">
              
              {/* Gamepad Controller + Brand Title */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <span className="text-[#488710] font-black text-lg sm:text-xl tracking-tight">
                  CHOKKU
                </span>
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#0084d1] tracking-tight leading-none">
                  PLAY &amp; WIN
                </h1>
                <span className="text-2xl sm:text-4xl font-black text-[#488710] tracking-tight leading-none block mt-0.5">
                  ARCADE
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* 3. SECTION HEADER */}
        <div className="pt-2">
          <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight">
            Play Games &amp; Earn Rewards
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            The more you play, the more you win!
          </p>
        </div>

        {/* 4. GAME CARDS GRID (2 Featured Games) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

          {/* CARD 1: Catch the Gift */}
          <div className="bg-white rounded-3xl border border-gray-100 hover:border-emerald-200 p-4 sm:p-5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer active:scale-98">
            <div className="w-full h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-[#ebf7de] via-[#f4faee] to-[#dcf0c5] flex items-center justify-center relative border border-emerald-200/80 p-3 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#488710_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none" />
              <div className="w-32 h-32 rounded-full bg-white/70 blur-xl absolute pointer-events-none" />
              <img
                src={gameboy}
                alt="Catch the Gift Monkey"
                className="h-54 sm:h-44 max-h-[175px] w-auto object-contain drop-shadow-xl transform group-hover:scale-108 group-hover:-rotate-2 transition-transform duration-300 relative z-10"
              />
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">Catch the Gift</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                Catch falling gifts in 30 seconds and earn points!
              </p>
            </div>

            <Link
              to="/catch-the-gift"
              className="w-full bg-[#f0f9e8] hover:bg-[#488710] text-[#386b0c] hover:text-white font-extrabold rounded-full py-2.5 px-4 text-xs flex items-center justify-between border border-[#d2ea9d] transition-all shadow-2xs active:scale-95"
            >
              <span>Play Now</span>
              <div className="w-6 h-6 rounded-full bg-[#488710] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#488710] transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </Link>
          </div>

          {/* CARD 2: Lucky Spin Wheel */}
          <div className="bg-white rounded-3xl border border-gray-100 hover:border-sky-200 p-4 sm:p-5 shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer active:scale-98">
            <div className="w-full h-44 sm:h-52 rounded-2xl bg-gradient-to-br from-[#ebf5fe] via-[#f3f9ff] to-[#d8ecfc] flex items-center justify-center relative border border-sky-200/80 p-3 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:14px_14px] opacity-15 pointer-events-none" />
              <div className="w-32 h-32 rounded-full bg-white/70 blur-xl absolute pointer-events-none" />
              <img
                src={spinwin}
                alt="Lucky Spin Wheel Monkey"
                className="h-36 sm:h-44 max-h-[175px] w-auto object-contain drop-shadow-xl transform group-hover:scale-108 group-hover:rotate-2 transition-transform duration-300 relative z-10"
              />
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">Lucky Spin Wheel</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                Spin the wheel once daily &amp; win exciting rewards!
              </p>
            </div>

            <Link
              to="/spin-and-win"
              className="w-full bg-sky-50 hover:bg-sky-500 text-sky-700 hover:text-white font-extrabold rounded-full py-2.5 px-4 text-xs flex items-center justify-between border border-sky-100 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>Spin Now</span>
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:bg-white group-hover:text-sky-500 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </Link>
          </div>




        </div>

      </div>

      {/* --- INTERACTIVE GAME MODALS --- */}





      {/* 5. MY COUPONS MODAL */}
      {activeGameModal === 'coupons' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scale-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Percent className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">My Earned Coupons</h3>
              </div>
              <button
                onClick={() => setActiveGameModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {myCoupons.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group hover:border-rose-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center font-black text-sm text-center shrink-0 shadow-md p-1 leading-tight`}>
                      {c.discount}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">{c.title}</h4>
                        {c.badge && (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">{c.expiry}</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0">
                    <span className="font-mono font-bold text-xs bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-800">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY CODE</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-center">
                <Link
                  to="/shop"
                  onClick={() => setActiveGameModal(null)}
                  className="inline-flex items-center gap-2 bg-[#488710] hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-full text-xs shadow-md transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>USE COUPONS IN STORE NOW</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
