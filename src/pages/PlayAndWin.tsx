import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Gamepad2,
  Gift,
  Disc,
  Coins,
  Ticket,
  Percent,
  Star,
  ChevronRight,
  Sparkles,
  Trophy,
  X,
  Copy,
  Check,
  RotateCw,
  Play,
  Flame,
  Award,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { MyGifts } from '../components/MyGifts';
import chokkuLogo from '../assets/img/chokku.png';
import playbgm from '../assets/img/playbgm.png';
import playmobile from '../assets/img/playmobile.png';
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
  const [activeGameModal, setActiveGameModal] = useState<'spin' | 'treasure' | 'scratch' | 'coupons' | null>(null);

  // Coins state
  const [collectedCoins, setCollectedCoins] = useState<string[]>([]);
  
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

  // Load collected coins and coupons from localStorage
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem('chokku_collected_coins');
      if (savedCoins) {
        setCollectedCoins(JSON.parse(savedCoins));
      }
      const savedCoupons = localStorage.getItem('chokku_user_coupons');
      if (savedCoupons) {
        setMyCoupons(JSON.parse(savedCoupons));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

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



  // --- GAME 2: LUCKY SPIN WHEEL STATE & LOGIC ---
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinResult, setSpinResult] = useState<string | null>(null);

  const wheelSlices = [
    { label: '10% OFF', code: 'SPIN10OFF', color: '#10b981' },
    { label: '₹100 OFF', code: 'SPIN100RS', color: '#0284c7' },
    { label: '15% OFF', code: 'SPIN15OFF', color: '#8b5cf6' },
    { label: '500 PTS', code: 'SPIN500PTS', color: '#f59e0b' },
    { label: '20% OFF', code: 'SPIN20OFF', color: '#ec4899' },
    { label: 'FREE SHIP', code: 'SPINFREESHIP', color: '#3b82f6' },
    { label: '25% OFF', code: 'SPIN25OFF', color: '#84cc16' },
    { label: '₹250 OFF', code: 'SPIN250RS', color: '#f43f5e' },
  ];

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);

    const randomIndex = Math.floor(Math.random() * wheelSlices.length);
    const sliceAngle = 360 / wheelSlices.length;
    const targetAngle = 360 * 5 + (wheelSlices.length - randomIndex) * sliceAngle - sliceAngle / 2;

    const newRotation = wheelRotation + targetAngle;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = wheelSlices[randomIndex];
      setSpinResult(prize.label);
      playNotificationSound();

      const newC: CouponItem = {
        id: `c-spin-${Date.now()}`,
        code: prize.code,
        discount: prize.label,
        title: 'Lucky Wheel Winner',
        desc: `Won from Daily Lucky Spin Wheel!`,
        expiry: 'Valid for 7 days',
        color: 'from-sky-500 to-indigo-600',
        badge: 'LUCKY WIN'
      };
      saveCoupons([newC, ...myCoupons]);
      addToast('🎉 CONGRATULATIONS!', `You won ${prize.label}! Coupon code: ${prize.code}`, 'success');
    }, 4500);
  };

  // --- GAME 4: SCRATCH CARD STATE & LOGIC ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratchCleared, setIsScratchCleared] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);

  const initScratchCanvas = () => {
    setIsScratchCleared(false);
    setScratchedPercent(0);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 300;
      canvas.height = 180;

      // Draw metallic foil
      const grad = ctx.createLinearGradient(0, 0, 300, 180);
      grad.addColorStop(0, '#94a3b8');
      grad.addColorStop(0.5, '#cbd5e1');
      grad.addColorStop(1, '#64748b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, 180);

      // Add silver texture text
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCRATCH WITH MOUSE / FINGER', 150, 95);
    }, 100);
  };

  const handleScratchMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratchCleared) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check percent cleared
    if (Math.random() > 0.4 && scratchedPercent < 70) {
      const newP = scratchedPercent + 15;
      setScratchedPercent(newP);
      if (newP >= 60) {
        setIsScratchCleared(true);
        playNotificationSound();
        const newC: CouponItem = {
          id: `c-scratch-${Date.now()}`,
          code: 'SCRATCH25',
          discount: '25% OFF',
          title: 'Scratch Card Winner',
          desc: 'Unlocked 25% discount from Daily Scratch Card!',
          expiry: 'Valid for 7 days',
          color: 'from-purple-500 to-pink-600',
          badge: 'SCRATCH WIN'
        };
        saveCoupons([newC, ...myCoupons]);
        addToast('✨ CARD REVEALED!', 'You won 25% OFF with code SCRATCH25!', 'success');
      }
    }
  };

  // Claim grand treasure prize
  const claimTreasureGrandPrize = () => {
    const newC: CouponItem = {
      id: `c-treasure-${Date.now()}`,
      code: 'TREASURE500',
      discount: '₹500 OFF',
      title: 'Treasure Hunt Master',
      desc: 'Reward for collecting all 5 golden coins across Chokku Store!',
      expiry: 'Valid for 30 days',
      color: 'from-amber-500 to-yellow-600',
      badge: 'GRAND PRIZE'
    };
    saveCoupons([newC, ...myCoupons]);
    addToast('🏆 GRAND PRIZE UNLOCKED!', 'Added ₹500 discount coupon TREASURE500 to your account!', 'success');
  };

  const openGameModal = (game: 'spin' | 'treasure' | 'scratch' | 'coupons') => {
    setActiveGameModal(game);
    if (game === 'scratch') {
      initScratchCanvas();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf5] font-sans antialiased text-gray-800 py-3 sm:py-6 px-3 sm:px-6 lg:px-8 pb-24 lg:pb-12">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* 1. HERO BANNER CARD WITH SEAMLESS ALIGNED BACKGROUND IMAGES */}
        <div className="bg-gradient-to-br from-[#f2f9ec] via-[#f7fcf2] to-[#ebf6df] rounded-3xl p-4 sm:p-6 border border-emerald-100/90 shadow-2xs relative overflow-hidden min-h-[260px] sm:min-h-[220px]">
          
          {/* Mobile Background Image Aligned Top (playmobile.png) */}
          <div
            style={{ backgroundImage: `url(${playmobile})`, backgroundPosition: 'right top' }}
            className="block sm:hidden absolute top-0 right-0 bottom-0 left-0 bg-contain bg-no-repeat pointer-events-none z-0"
          />

          {/* Desktop Background Image Aligned (playbgm.png) */}
          <div
            style={{ backgroundImage: `url(${playbgm})` }}
            className="hidden sm:block absolute top-0 right-0 bottom-0 w-[52%] bg-contain bg-right bg-no-repeat pointer-events-none z-0"
          />

          {/* Top Return Link */}
          <div className="relative z-10">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#488710] font-extrabold text-[11px] bg-white/95 px-3 py-1.5 rounded-full shadow-2xs hover:bg-white transition-all border border-gray-200/80 mb-3 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Store</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center relative z-10">
            {/* Left Content */}
            <div className="sm:col-span-7 space-y-2 sm:space-y-2.5 w-full max-w-[68%] sm:max-w-none">
              
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
                <span className="text-2xl sm:text-4xl font-black text-[#0084d1] tracking-tight leading-none block">
                  ARCADE
                </span>
              </div>

              {/* Green Pill Badge */}
              <div className="inline-block bg-[#488710] text-white font-extrabold text-[10px] sm:text-xs px-3.5 py-1 rounded-full shadow-2xs tracking-wider uppercase">
                PLAY GAMES - EARN POINTS - WIN REWARDS
              </div>

              {/* Subtitle Description */}
              <p className="text-gray-700 font-medium text-xs max-w-xs sm:max-w-sm leading-relaxed">
                Play mini-games, spin the daily lucky wheel, hunt hidden golden coins &amp; earn real discount coupons!
              </p>

            </div>

          </div>
        </div>

        {/* 3. SECTION HEADER */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-[#488710] text-white flex items-center justify-center shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-white text-white" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight">
                Play Games &amp; Earn Rewards
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5 ml-7">
              The more you play, the more you win!
            </p>
          </div>

          <button
            onClick={() => openGameModal('coupons')}
            className="text-xs font-extrabold text-[#488710] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. GAME CARDS GRID (5 Cards matching Reference Image) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">

          {/* CARD 1: Catch the Gift */}
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
            <div className="w-full h-36 rounded-2xl bg-[#f0f9e8] flex items-center justify-center relative border border-emerald-100/60 p-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#386b0c] to-[#488710] p-4 shadow-lg text-white flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Gift className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-sky-400 border border-white shadow-xs flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">Catch the Gift</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                Catch falling gifts in 30 seconds and earn points!
              </p>
            </div>

            <Link
              to="/catch-the-gift"
              className="w-full bg-[#f0f9e8] hover:bg-[#488710] text-[#386b0c] hover:text-white font-extrabold rounded-full py-2 px-3.5 text-xs flex items-center justify-between border border-[#d2ea9d] transition-all"
            >
              <span>Play Now</span>
              <div className="w-6 h-6 rounded-full bg-[#488710] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#488710] transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </Link>
          </div>

          {/* CARD 2: Lucky Spin Wheel */}
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
            <div className="w-full h-36 rounded-2xl bg-sky-50 flex items-center justify-center relative border border-sky-100/60 p-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-cyan-400 p-3 shadow-lg ring-4 ring-white text-white flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-500">
                <Disc className="w-12 h-12 text-white" />
              </div>
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">Lucky Spin Wheel</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                Spin the wheel once daily &amp; win exciting rewards!
              </p>
            </div>

            <button
              onClick={() => openGameModal('spin')}
              className="w-full bg-sky-50 hover:bg-sky-500 text-sky-700 hover:text-white font-extrabold rounded-full py-2 px-3.5 text-xs flex items-center justify-between border border-sky-100 transition-all cursor-pointer"
            >
              <span>Spin Now</span>
              <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center group-hover:bg-white group-hover:text-sky-500 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>

          {/* CARD 3: Treasure Hunt */}
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
            <div className="w-full h-36 rounded-2xl bg-amber-50 flex items-center justify-center relative border border-amber-100/60 p-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-3 shadow-lg text-white flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform">
                <Coins className="w-10 h-10 text-white" />
                <span className="text-[9px] font-black text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full mt-0.5">
                  5 COINS
                </span>
              </div>
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">Treasure Hunt</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                Find hidden golden coins across the store!
              </p>
            </div>

            <button
              onClick={() => openGameModal('treasure')}
              className="w-full bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white font-extrabold rounded-full py-2 px-3.5 text-xs flex items-center justify-between border border-amber-100 transition-all cursor-pointer"
            >
              <span>Start Hunt</span>
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center group-hover:bg-white group-hover:text-amber-500 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>

          {/* CARD 4: Scratch Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
            <div className="w-full h-36 rounded-2xl bg-purple-50 flex items-center justify-center relative border border-purple-100/60 p-4">
              <div className="w-24 h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 p-2 shadow-lg ring-2 ring-white text-white flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform">
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider">SCRATCH &amp; WIN</span>
                <Ticket className="w-5 h-5 text-white mt-0.5" />
              </div>
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">Scratch Card</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                Scratch and reveal your exclusive deal!
              </p>
            </div>

            <button
              onClick={() => openGameModal('scratch')}
              className="w-full bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-extrabold rounded-full py-2 px-3.5 text-xs flex items-center justify-between border border-purple-100 transition-all cursor-pointer"
            >
              <span>Scratch Now</span>
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center group-hover:bg-white group-hover:text-purple-600 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>

          {/* CARD 5: My Coupons */}
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer">
            <div className="w-full h-36 rounded-2xl bg-pink-50 flex items-center justify-center relative border border-pink-100/60 p-4">
              <div className="w-24 h-14 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 p-2 shadow-lg ring-2 ring-white text-white flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Percent className="w-8 h-8 text-white stroke-[2.5]" />
              </div>
            </div>

            <div className="text-center my-3">
              <h3 className="font-black text-gray-900 text-sm sm:text-base">My Coupons</h3>
              <p className="text-gray-500 text-[11px] sm:text-xs font-medium mt-1 leading-snug">
                View all your earned coupons &amp; discount offers!
              </p>
            </div>

            <button
              onClick={() => openGameModal('coupons')}
              className="w-full bg-pink-50 hover:bg-rose-500 text-rose-700 hover:text-white font-extrabold rounded-full py-2 px-3.5 text-xs flex items-center justify-between border border-pink-100 transition-all cursor-pointer"
            >
              <span>View Coupons</span>
              <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center group-hover:bg-white group-hover:text-rose-500 transition-colors">
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </button>
          </div>

        </div>

        {/* MY GIFTS UNBOXING & REWARDS SECTION */}
        <div className="pt-6">
          <MyGifts />
        </div>

      </div>

      {/* --- INTERACTIVE GAME MODALS --- */}

      {/* 2. LUCKY SPIN WHEEL MODAL */}
      {activeGameModal === 'spin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scale-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Disc className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">Daily Lucky Wheel</h3>
              </div>
              <button
                onClick={() => setActiveGameModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-6">
              
              {/* Wheel Graphic Canvas Container */}
              <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                
                {/* Wheel Pointer Arrow at Top */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-7 h-7 bg-amber-400 clip-path-triangle rotate-180 drop-shadow-md border-2 border-white" />

                {/* Spinning Wheel Body */}
                <div
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
                  }}
                  className="w-full h-full rounded-full border-4 border-slate-800 shadow-2xl relative overflow-hidden flex items-center justify-center"
                >
                  {wheelSlices.map((s, idx) => {
                    const angle = 360 / wheelSlices.length;
                    const rotate = idx * angle;
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: s.color,
                          transform: `rotate(${rotate}deg) skewY(-45deg)`,
                          transformOrigin: '0% 0%'
                        }}
                        className="absolute w-1/2 h-1/2 top-0 left-0 border border-white/20 flex items-center justify-center"
                      >
                        <span
                          style={{
                            transform: 'skewY(45deg) rotate(22.5deg) translate(40px, 20px)',
                          }}
                          className="text-[11px] font-black text-white whitespace-nowrap block drop-shadow-md"
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Wheel Center Pin */}
                <div className="absolute w-12 h-12 rounded-full bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-amber-400 font-black text-xs z-20">
                  <Sparkles className="w-5 h-5" />
                </div>

              </div>

              {spinResult && (
                <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 animate-fade-in space-y-1">
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Congratulations!</p>
                  <p className="text-xl font-black text-slate-900">You Won {spinResult}!</p>
                  <p className="text-xs text-slate-500">Coupon saved to your "My Coupons" list!</p>
                </div>
              )}

              <button
                disabled={isSpinning}
                onClick={handleSpinWheel}
                className="w-full bg-[#0284c7] hover:bg-sky-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-full text-sm shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'SPINNING WHEEL...' : 'SPIN THE WHEEL NOW'}</span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* 3. TREASURE HUNT MODAL */}
      {activeGameModal === 'treasure' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scale-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Coins className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">Golden Coin Treasure Hunt</h3>
              </div>
              <button
                onClick={() => setActiveGameModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center space-y-2">
                <p className="text-xs text-amber-800 font-extrabold uppercase tracking-wider">
                  Collection Progress: {collectedCoins.length} / 5 Coins Found
                </p>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(collectedCoins.length / 5) * 100}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  />
                </div>

                <p className="text-xs text-slate-600">
                  Collect all 5 hidden golden coins scattered across the store to unlock ₹500 discount coupon!
                </p>
              </div>

              {/* Coin locations guide */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Store Coin Locations:
                </p>

                <div className="space-y-2 text-xs">
                  {[
                    { id: 'home', title: '1. Home Page Banner', link: '/' },
                    { id: 'shop', title: '2. Shop Product Catalog', link: '/shop' },
                    { id: 'category', title: '3. Category Page', link: '/category/electronics' },
                    { id: 'product', title: '4. Product Details Page', link: '/product/1' },
                    { id: 'cart', title: '5. Shopping Cart Drawer', link: '/cart' },
                  ].map((loc) => {
                    const isFound = collectedCoins.includes(loc.id);
                    return (
                      <div
                        key={loc.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isFound
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{isFound ? '🪙' : '❓'}</span>
                          <span>{loc.title}</span>
                        </div>
                        {isFound ? (
                          <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                            FOUND ✓
                          </span>
                        ) : (
                          <Link
                            to={loc.link}
                            onClick={() => setActiveGameModal(null)}
                            className="text-[10px] font-black text-[#488710] hover:underline"
                          >
                            GO TO PAGE →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {collectedCoins.length === 5 ? (
                <button
                  onClick={claimTreasureGrandPrize}
                  className="w-full bg-[#488710] hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-full text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 animate-bounce"
                >
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>CLAIM ₹500 GRAND PRIZE COUPON</span>
                </button>
              ) : (
                <div className="text-center text-xs text-slate-400 font-semibold">
                  Keep exploring store pages to discover remaining coins!
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 4. SCRATCH CARD MODAL */}
      {activeGameModal === 'scratch' && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scale-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">Daily Scratch Card</h3>
              </div>
              <button
                onClick={() => setActiveGameModal(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-5">
              <p className="text-xs text-slate-500 font-semibold">
                Move your cursor or finger over the card below to scratch and reveal your offer!
              </p>

              {/* Scratch Area Canvas Stack */}
              <div className="relative w-[300px] h-[180px] mx-auto rounded-2xl overflow-hidden shadow-xl border-2 border-purple-300">
                
                {/* Underlying Coupon Reward Graphic */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 text-white flex flex-col items-center justify-center p-4">
                  <Sparkles className="w-8 h-8 text-amber-300 mb-1 animate-pulse" />
                  <p className="text-2xl font-black text-amber-300">25% OFF</p>
                  <p className="text-xs font-bold mt-0.5">Use Code: <span className="bg-white text-purple-950 px-2 py-0.5 rounded-md font-mono">SCRATCH25</span></p>
                  <p className="text-[10px] text-purple-200 mt-1">Valid on any order above ₹999</p>
                </div>

                {/* HTML5 Canvas Silver Scratch Layer */}
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleScratchMove}
                  onTouchMove={handleScratchMove}
                  className="absolute inset-0 cursor-pointer touch-none z-10"
                />

              </div>

              {isScratchCleared ? (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 animate-fade-in space-y-1">
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">🎉 Offer Unlocked!</p>
                  <p className="text-lg font-black text-slate-900">25% OFF Coupon Saved!</p>
                  <button
                    onClick={() => setActiveGameModal('coupons')}
                    className="mt-2 bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2 rounded-full text-xs"
                  >
                    View In My Coupons
                  </button>
                </div>
              ) : (
                <p className="text-xs text-purple-600 font-bold">
                  Scratched: {scratchedPercent}%
                </p>
              )}

            </div>

          </div>
        </div>
      )}

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
