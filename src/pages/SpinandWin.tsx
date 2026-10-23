import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Disc,
  Sparkles,
  Trophy,
  PartyPopper,
  Volume2,
  VolumeX,
  RotateCw,
  Gift,
  Tag,
  Copy,
  Check,
  Percent,
  Coins,
  ShoppingBag,
  Clock,
  Award,
  Zap,
  HelpCircle,
  X,
  Share2,
  ChevronRight,
  Flame,
  Star
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../utils/api';
import spinwin from '../assets/img/spinwin.png';
import playbgm from '../assets/img/playbgm.png';
import playmobile from '../assets/img/playmobile.png';
import notificationSound from '../assets/notification.mp3';

interface WheelSlice {
  id: string;
  label: string;
  subLabel: string;
  code: string;
  type: 'coupon' | 'points' | 'jackpot';
  value: string;
  points?: number;
  color: string;
  textColor: string;
  icon: string;
  badge?: string;
}

interface SavedCoupon {
  id: string;
  code: string;
  discount: string;
  title: string;
  desc: string;
  expiry: string;
  color: string;
  badge?: string;
  createdAt?: number;
}

const WHEEL_SLICES: WheelSlice[] = [
  {
    id: 's1',
    label: '10% OFF',
    subLabel: 'Min order ₹399',
    code: 'SPIN10OFF',
    type: 'coupon',
    value: '10% OFF',
    color: '#059669', // Emerald
    textColor: '#ffffff',
    icon: '%',
    badge: 'POPULAR'
  },
  {
    id: 's2',
    label: '₹100 OFF',
    subLabel: 'On orders above ₹499',
    code: 'SPIN100RS',
    type: 'coupon',
    value: '₹100 FLAT',
    color: '#0284c7', // Ocean Blue
    textColor: '#ffffff',
    icon: '₹',
    badge: 'HOT'
  },
  {
    id: 's3',
    label: '500 PTS',
    subLabel: 'Direct Store Points',
    code: 'SPIN500PTS',
    type: 'points',
    value: '+500 Points',
    points: 500,
    color: '#d97706', // Amber Gold
    textColor: '#ffffff',
    icon: '★',
    badge: 'COINS'
  },
  {
    id: 's4',
    label: '20% OFF',
    subLabel: 'Max discount ₹200',
    code: 'SPIN20OFF',
    type: 'coupon',
    value: '20% OFF',
    color: '#7c3aed', // Purple Violet
    textColor: '#ffffff',
    icon: '%',
    badge: 'MEGA'
  },
  {
    id: 's5',
    label: 'FREE SHIP',
    subLabel: 'Zero delivery charge',
    code: 'SPINFREESHIP',
    type: 'coupon',
    value: 'FREE SHIPPING',
    color: '#0891b2', // Cyan
    textColor: '#ffffff',
    icon: '🚚',
    badge: 'FAST'
  },
  {
    id: 's6',
    label: '₹250 OFF',
    subLabel: 'On orders above ₹999',
    code: 'SPIN250RS',
    type: 'coupon',
    value: '₹250 FLAT',
    color: '#e11d48', // Rose Red
    textColor: '#ffffff',
    icon: '₹',
    badge: 'SPECIAL'
  },
  {
    id: 's7',
    label: '15% OFF',
    subLabel: 'Arcade Special Voucher',
    code: 'SPIN15OFF',
    type: 'coupon',
    value: '15% OFF',
    color: '#4f46e5', // Indigo
    textColor: '#ffffff',
    icon: '%',
    badge: 'SAVINGS'
  },
  {
    id: 's8',
    label: 'JACKPOT ₹500',
    subLabel: 'Grand Store Voucher',
    code: 'JACKPOT500',
    type: 'jackpot',
    value: '₹500 GRAND',
    color: '#ea580c', // Electric Orange / Gold
    textColor: '#ffffff',
    icon: '👑',
    badge: 'JACKPOT'
  }
];

export const SpinandWin: React.FC = () => {
  const { addToast } = useToast();
  const { customerUser, customerPoints, fetchCustomerPoints } = useAuth();
  const navigate = useNavigate();

  // Audio State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('chokku_spin_sound') !== 'false';
  });

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [pointerRecoil, setPointerRecoil] = useState(false);
  const [wonPrize, setWonPrize] = useState<WheelSlice | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Rewards list modal
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [myCoupons, setMyCoupons] = useState<SavedCoupon[]>([]);

  // Daily Spin Cooldown Tracking
  const [lastSpinTime, setLastSpinTime] = useState<number>(0);
  const [countdownText, setCountdownText] = useState<string>('');
  const [isDailyFreeSpinAvailable, setIsDailyFreeSpinAvailable] = useState<boolean>(true);
  const [spinsCountToday, setSpinsCountToday] = useState<number>(0);

  // Canvas Confetti ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioTickIntervalRef = useRef<number | null>(null);

  // Load saved coupons from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chokku_user_coupons');
      if (saved) {
        setMyCoupons(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error reading saved coupons:', e);
    }
  }, []);

  // Save sound setting
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('chokku_spin_sound', nextVal.toString());
  };

  // Cooldown check for daily free spin
  const userIdKey = customerUser?.id || (customerUser as any)?._id || 'guest_user';
  useEffect(() => {
    const checkCooldown = () => {
      try {
        const stored = localStorage.getItem(`chokku_spin_last_${userIdKey}`);
        if (stored) {
          const timestamp = parseInt(stored, 10);
          setLastSpinTime(timestamp);
          const diffMs = Date.now() - timestamp;
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (diffMs < twentyFourHours) {
            setIsDailyFreeSpinAvailable(false);
            const remaining = twentyFourHours - diffMs;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            setCountdownText(
              `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
          } else {
            setIsDailyFreeSpinAvailable(true);
            setCountdownText('');
          }
        } else {
          setIsDailyFreeSpinAvailable(true);
          setCountdownText('');
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [userIdKey]);

  // Web Audio Mechanical Tick Sound
  const playTickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {}
  }, [soundEnabled]);

  // Winning Fanfare Audio
  const playFanfareSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // 1. Play base notification audio
      const audio = new Audio(notificationSound);
      audio.volume = 0.8;
      audio.play().catch(() => {});

      // 2. Synthesize celebratory arpeggio chime
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    } catch {}
  }, [soundEnabled]);

  // High-Energy Full-Screen Party Popper Cannon Blast
  const triggerPartyPopperBlast = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const colors = [
      '#f59e0b', // Radiant Gold
      '#10b981', // Emerald Green
      '#0284c7', // Ocean Blue
      '#ec4899', // Hot Pink
      '#8b5cf6', // Violet
      '#e11d48', // Ruby Rose
      '#facc15', // Sunflower Yellow
      '#06b6d4', // Cyan
      '#ffffff', // Crisp White
    ];

    interface CannonParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      w: number;
      h: number;
      color: string;
      wobble: number;
      wobbleSpeed: number;
      rotation: number;
      rotationSpeed: number;
      shape: 'rect' | 'circle';
      opacity: number;
    }

    const particles: CannonParticle[] = [];
    const count = 180;

    // Cannon origins: Bottom Left, Bottom Right, and Center
    const leftX = width * 0.12;
    const leftY = height * 0.92;
    const rightX = width * 0.88;
    const rightY = height * 0.92;
    const centerX = width * 0.5;
    const centerY = height * 0.65;

    for (let i = 0; i < count; i++) {
      let ox: number;
      let oy: number;
      let angle: number;
      let speed: number;

      if (i < 70) {
        // Cannon 1: Left popper shoots upward-right into the screen
        ox = leftX;
        oy = leftY;
        angle = (Math.PI / 180) * (-75 + (Math.random() - 0.5) * 55);
        speed = 16 + Math.random() * 16;
      } else if (i < 140) {
        // Cannon 2: Right popper shoots upward-left into the screen
        ox = rightX;
        oy = rightY;
        angle = (Math.PI / 180) * (-105 + (Math.random() - 0.5) * 55);
        speed = 16 + Math.random() * 16;
      } else {
        // Cannon 3: Center fountain starburst
        ox = centerX;
        oy = centerY;
        angle = (Math.PI / 180) * (-90 + (Math.random() - 0.5) * 110);
        speed = 11 + Math.random() * 14;
      }

      particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 6,
        h: Math.random() > 0.3 ? 10 + Math.random() * 9 : 6 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.08 + Math.random() * 0.12,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 16,
        shape: Math.random() > 0.28 ? 'rect' : 'circle',
        opacity: 1,
      });
    }

    let animationId: number;
    let frame = 0;
    const maxFrames = 190; // ~3.5s smooth blast & decay

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      let alive = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Air resistance & gravity
        p.vx *= 0.958;
        p.vy *= 0.958;
        p.vy += 0.38;
        p.x += p.vx;
        p.y += p.vy;

        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        if (frame > 95) {
          p.opacity = Math.max(0, 1 - (frame - 95) / (maxFrames - 95));
        }

        if (p.opacity > 0.01 && p.y < height + 60) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);

          // 3D paper tumbling flip
          const flipScale = Math.cos(p.wobble);
          ctx.scale(flipScale, 1);

          ctx.fillStyle = p.color;

          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }

          ctx.restore();
        }
      }

      if (alive && frame < maxFrames) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationId = requestAnimationFrame(render);
  }, []);

  // Trigger party popper blast when win modal opens
  useEffect(() => {
    if (showWinModal) {
      triggerPartyPopperBlast();
    }
  }, [showWinModal, triggerPartyPopperBlast]);

  // Handle Wheel Spin
  const spinTheWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWonPrize(null);
    setShowWinModal(false);

    // Pick random winning slice with slight weighting for excitement
    const randomIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    const sliceCount = WHEEL_SLICES.length;
    const sliceAngle = 360 / sliceCount; // 45 deg

    // The center of slice index `randomIndex` is at: (randomIndex * 45 + 22.5) clockwise from 12 o'clock.
    // To align this center exactly with 12 o'clock pointer:
    const targetAngleMod = (360 - (randomIndex * sliceAngle + sliceAngle / 2)) % 360;
    const currentAngleMod = ((wheelRotation % 360) + 360) % 360;
    const extraToReachTarget = (targetAngleMod - currentAngleMod + 360) % 360;

    // Minimum 6 full rotations (2160 deg) for suspenseful, grand spinning animation
    const fullSpins = 360 * 6;
    const nextTotalRotation = wheelRotation + fullSpins + extraToReachTarget;

    setWheelRotation(nextTotalRotation);

    // Sound ticks simulation during the 4.8s deceleration
    let tickCount = 0;
    const totalTicks = 28;
    const tickIntervals = [
      60, 60, 60, 70, 70, 80, 85, 90, 100, 110, 125, 140, 160, 185, 215, 250, 290, 340, 400, 470, 560, 670, 790
    ];

    let currentTickIdx = 0;
    const scheduleNextTick = () => {
      if (currentTickIdx >= tickIntervals.length) return;
      playTickSound();
      setPointerRecoil((prev) => !prev);
      const delay = tickIntervals[currentTickIdx];
      currentTickIdx++;
      audioTickIntervalRef.current = window.setTimeout(scheduleNextTick, delay);
    };

    scheduleNextTick();

    // Settle time: 4.8 seconds
    setTimeout(async () => {
      setIsSpinning(false);
      const prize = WHEEL_SLICES[randomIndex];
      setWonPrize(prize);
      setShowWinModal(true);
      setSpinsCountToday((prev) => prev + 1);

      // Play winning sounds
      playFanfareSound();

      // Record cooldown timestamp for daily spin
      const now = Date.now();
      localStorage.setItem(`chokku_spin_last_${userIdKey}`, now.toString());
      setLastSpinTime(now);

      // 1. If prize is a Coupon / Voucher
      const newCoupon: SavedCoupon = {
        id: `c-spin-${Date.now()}`,
        code: prize.code,
        discount: prize.value,
        title: prize.label === 'JACKPOT ₹500' ? '🎉 GRAND JACKPOT WINNER' : 'Lucky Wheel Reward',
        desc: prize.subLabel,
        expiry: 'Valid for 7 days',
        color:
          prize.type === 'jackpot'
            ? 'from-amber-500 to-orange-600'
            : prize.type === 'points'
            ? 'from-amber-400 to-yellow-600'
            : 'from-sky-500 to-indigo-600',
        badge: prize.badge || 'LUCKY WIN',
        createdAt: now
      };

      const updatedCoupons = [newCoupon, ...myCoupons];
      setMyCoupons(updatedCoupons);
      try {
        localStorage.setItem('chokku_user_coupons', JSON.stringify(updatedCoupons));
      } catch (err) {
        console.error('Failed saving coupon to localStorage:', err);
      }

      // 2. If prize gives Store Points (e.g. 500 PTS)
      if (prize.type === 'points' && prize.points) {
        addToast('★ POINTS CREDITED!', `+${prize.points} points added to your Chokku balance!`, 'success');

        // Submit points to backend server if customer is logged in
        try {
          const token =
            localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
          const userId = customerUser?.id || (customerUser as any)?._id || '';

          if (token && userId) {
            await safeFetch('/catch-game/score', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-user-id': userId
              },
              body: JSON.stringify({
                score: prize.points,
                coinsCollected: Math.floor(prize.points / 10),
                giftsCollected: 1
              })
            });
            fetchCustomerPoints();
          }
        } catch (apiErr) {
          console.warn('Could not sync points with server:', apiErr);
        }
      }
      // Points or coupon rewards saved directly to state and database
      // The dedicated Celebration Winner Modal with party-popper blast handles victory celebration
    }, 4800);
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('Coupon Copied!', `Code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Helper for generating SVG pie arcs
  const radius = 215;
  const cx = 250;
  const cy = 250;
  const sliceCount = WHEEL_SLICES.length;
  const anglePerSlice = 360 / sliceCount;

  return (
    <div className="min-h-screen bg-[#f8faf6] font-sans antialiased text-gray-800 pb-28 lg:pb-16 select-none relative overflow-x-hidden">

      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-4 sm:space-y-6">
        
        {/* ============================================================ */}
        {/* 1. TOP NAVIGATION / CONTROLS BAR */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-100 shadow-2xs flex items-center justify-between gap-2">
          
          {/* Back to Arcade */}
          <Link
            to="/play-and-win"
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all cursor-pointer border border-gray-200/80 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#488710]" />
            <span>Arcade Hub</span>
          </Link>

          {/* Right Action Badges: Points, My Coupons & Sound Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Customer Points Balance */}
            <Link
              to="/points"
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-xs sm:text-sm px-3 py-2 rounded-full transition-colors cursor-pointer"
              title="View your Chokku reward points"
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
              <span>{customerPoints || 0}</span>
              <span className="text-[10px] text-amber-700 uppercase font-black hidden xs:inline">PTS</span>
            </Link>

            {/* My Coupons Modal Opener */}
            <button
              onClick={() => setShowCouponsModal(true)}
              className="relative inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-extrabold text-xs sm:text-sm px-3 py-2 rounded-full transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
              <span className="hidden xs:inline">Coupons</span>
              {myCoupons.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center -mr-1">
                  {myCoupons.length}
                </span>
              )}
            </button>

            {/* Sound On/Off Button */}
            <button
              onClick={toggleSound}
              className="p-2 sm:px-3 sm:py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs transition-colors border border-gray-200/80 cursor-pointer flex items-center gap-1"
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#488710]" />
                  <span className="hidden md:inline text-xs">Sound</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-rose-500" />
                  <span className="hidden md:inline text-xs">Muted</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. HERO BANNER WITH MASCOT & BRANDING */}
        {/* ============================================================ */}
        <div className="bg-gradient-to-br from-[#ebf5fe] via-[#f2f8fd] to-[#dff0fc] rounded-3xl p-4 sm:p-6 border border-sky-100 shadow-2xs relative overflow-hidden">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          {/* Desktop Background Banner Accent */}
          <div
            style={{ backgroundImage: `url(${playbgm})` }}
            className="hidden sm:block absolute top-0 right-0 bottom-0 w-[45%] bg-contain bg-right bg-no-repeat pointer-events-none opacity-30 z-0"
          />

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center relative z-10">
            <div className="sm:col-span-8 space-y-2">
              
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Disc className="w-4 h-4 animate-spin [animation-duration:8s]" />
                </div>
                <span className="text-sky-700 font-black text-sm tracking-wide uppercase">
                  CHOKKU ARCADE • DAILY REWARDS
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight flex flex-wrap items-center gap-2">
                  <span className="text-[#0284c7]">LUCKY SPIN</span>
                  <span className="text-[#488710]">&amp; WIN</span>
                  <span className="text-xs bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                    FREE DAILY
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1.5 max-w-lg leading-relaxed">
                  Spin the lucky wheel every day to unlock guaranteed discount vouchers, free shipping, and bonus Chokku store cash!
                </p>
              </div>

              {/* Status Pill */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                {isDailyFreeSpinAvailable ? (
                  <div className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>1 FREE DAILY SPIN READY</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[11px] font-black px-3 py-1 rounded-full border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>NEXT FREE SPIN IN: {countdownText}</span>
                  </div>
                )}
                <span className="text-[11px] text-gray-500 font-semibold">
                  • 100% Guaranteed Reward Every Spin
                </span>
              </div>

            </div>

            {/* Mascot Image on Right */}
            <div className="sm:col-span-4 flex justify-center sm:justify-end">
              <div className="relative">
                <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-white/70 blur-xl absolute inset-0 pointer-events-none" />
                <img
                  src={spinwin}
                  alt="Lucky Spin Wheel Mascot"
                  className="h-28 sm:h-36 w-auto object-contain drop-shadow-xl relative z-10 transform hover:scale-105 transition-transform"
                />
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. MAIN INTERACTIVE WHEEL ARENA */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
          
          {/* Subtle Ambient Glow Behind Wheel */}
          <div className="w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-tr from-sky-200/40 via-emerald-100/30 to-amber-100/40 blur-3xl absolute pointer-events-none" />

          {/* Top Pointer Indicator with 3D Recoil Animation */}
          <div className="relative z-30 mb-[-18px] sm:mb-[-22px]">
            <div
              className={`transition-transform duration-150 ${
                pointerRecoil ? 'scale-110 -rotate-3' : 'scale-100 rotate-0'
              }`}
            >
              {/* Golden Pointer Needle */}
              <div
                style={{
                  clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))'
                }}
                className="w-8 sm:w-10 h-9 sm:h-11 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-2 border-white relative"
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/80" />
              </div>
            </div>
          </div>

          {/* Wheel Graphic Container */}
          <div className="relative w-[310px] h-[310px] xs:w-[340px] xs:h-[340px] sm:w-[420px] sm:h-[420px] p-2 flex items-center justify-center z-10">
            
            {/* Outer LED Lights Rim Ring */}
            <div className="absolute inset-0 rounded-full border-[10px] sm:border-[12px] border-slate-900 shadow-2xl flex items-center justify-center bg-slate-900">
              
              {/* 24 Flashing LED Dots around Rim */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={i}
                    style={{
                      transform: `rotate(${angle}deg) translate(0, -${142}px)`
                    }}
                    className={`absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors duration-300 ${
                      isSpinning
                        ? isEven
                          ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-white shadow-[0_0_8px_#ffffff]'
                        : isEven
                        ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                        : 'bg-emerald-300 shadow-[0_0_4px_#10b981]'
                    }`}
                  />
                );
              })}

            </div>

            {/* Rotating SVG Wheel Element */}
            <div
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 4.8s cubic-bezier(0.12, 0.88, 0.22, 1)' : 'none'
              }}
              className="w-full h-full rounded-full relative overflow-hidden flex items-center justify-center"
            >
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full filter drop-shadow-md"
              >
                <defs>
                  {/* Subtle radial shading for 3D depth */}
                  <radialGradient id="sliceGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                  </radialGradient>
                  
                  {/* Center Hub Metal Gradient */}
                  <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>

                {/* Slices Arc Path Rendering */}
                {WHEEL_SLICES.map((slice, idx) => {
                  const startAngle = idx * anglePerSlice - 90;
                  const endAngle = (idx + 1) * anglePerSlice - 90;
                  const midAngle = startAngle + anglePerSlice / 2;

                  const toRad = (deg: number) => (deg * Math.PI) / 180;
                  const x1 = cx + radius * Math.cos(toRad(startAngle));
                  const y1 = cy + radius * Math.sin(toRad(startAngle));
                  const x2 = cx + radius * Math.cos(toRad(endAngle));
                  const y2 = cy + radius * Math.sin(toRad(endAngle));

                  const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

                  return (
                    <g key={slice.id}>
                      {/* Wedge Slice */}
                      <path
                        d={pathD}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />
                      
                      {/* Depth overlay */}
                      <path
                        d={pathD}
                        fill="url(#sliceGlow)"
                      />

                      {/* Text & Icon rotated along radius */}
                      <g
                        transform={`rotate(${midAngle + 90}, ${cx}, ${cy}) translate(${cx}, ${cy - radius * 0.65})`}
                      >
                        {/* Icon */}
                        <text
                          x="0"
                          y="-16"
                          fill="#ffffff"
                          fontSize="18"
                          fontWeight="900"
                          textAnchor="middle"
                          filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))"
                        >
                          {slice.icon}
                        </text>

                        {/* Main Label */}
                        <text
                          x="0"
                          y="6"
                          fill="#ffffff"
                          fontSize="16"
                          fontWeight="900"
                          letterSpacing="0.5"
                          textAnchor="middle"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                        >
                          {slice.label}
                        </text>

                        {/* Sub badge */}
                        <text
                          x="0"
                          y="24"
                          fill="#fef08a"
                          fontSize="10"
                          fontWeight="800"
                          textAnchor="middle"
                          letterSpacing="0.2"
                          opacity="0.95"
                          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
                        >
                          {slice.badge}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Outer Ring Accent */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  opacity="0.8"
                />

                {/* Golden Center Cap / Hub */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="45"
                  fill="#1e293b"
                  stroke="url(#hubGrad)"
                  strokeWidth="6"
                  filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="30"
                  fill="url(#hubGrad)"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r="24"
                  fill="#0f172a"
                />
              </svg>
            </div>

            {/* Central Pin Emblem */}
            <div className="absolute w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 flex items-center justify-center z-20 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

          </div>

          {/* Controls Below Wheel */}
          <div className="w-full max-w-sm mt-6 sm:mt-8 space-y-3 text-center z-20">
            
            {/* Big Spin Action Button */}
            <button
              disabled={isSpinning}
              onClick={spinTheWheel}
              className={`w-full py-4 px-6 rounded-full font-black text-sm sm:text-base tracking-wider uppercase transition-all duration-300 shadow-lg cursor-pointer flex items-center justify-center gap-2.5 border active:scale-95 ${
                isSpinning
                  ? 'bg-slate-700 text-slate-300 border-slate-600 cursor-not-allowed opacity-90'
                  : 'bg-gradient-to-r from-[#0284c7] via-sky-600 to-[#488710] hover:from-sky-700 hover:to-emerald-700 text-white border-sky-300/60 shadow-sky-500/25 hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning
                  ? 'SPINNING THE WHEEL...'
                  : isDailyFreeSpinAvailable
                  ? 'SPIN WHEEL FOR FREE NOW'
                  : 'SPIN AGAIN (BONUS SPIN)'}
              </span>
            </button>

            {/* Helpful Helper text */}
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-center gap-2 pt-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isSpinning
                  ? 'Hold on tight! Decelerating on your lucky prize...'
                  : isDailyFreeSpinAvailable
                  ? 'Tap the button above to claim your free reward!'
                  : `Next official daily free spin resets in: ${countdownText}`}
              </span>
            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. REWARDS SHOWCASE & ODDS CARDS */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#488710]" />
              <span>Wheel Rewards Breakdown</span>
            </h2>
            <span className="text-xs text-gray-500 font-medium">8 Guaranteed Slots</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {WHEEL_SLICES.map((slice) => (
              <div
                key={slice.id}
                className="bg-white rounded-2xl p-3 sm:p-3.5 border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span
                    style={{ backgroundColor: slice.color }}
                    className="w-7 h-7 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-xs"
                  >
                    {slice.icon}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {slice.badge}
                  </span>
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">{slice.label}</h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-snug">
                    {slice.subLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. HOW IT WORKS / RULES SECTION */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-black text-gray-900 text-base sm:text-lg">
              How Lucky Spin &amp; Win Works
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
            <div className="bg-[#f8fbf5] rounded-2xl p-3.5 border border-emerald-100/80 space-y-1">
              <div className="font-extrabold text-[#488710] flex items-center gap-1.5 text-sm">
                <span>1. Free Daily Spin</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                Every Chokku user receives 1 free spin every 24 hours. Spin anytime from mobile or desktop!
              </p>
            </div>

            <div className="bg-[#f0f8fd] rounded-2xl p-3.5 border border-sky-100/80 space-y-1">
              <div className="font-extrabold text-sky-700 flex items-center gap-1.5 text-sm">
                <span>2. Instant Vouchers</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                Won coupons are automatically saved to your wallet. Copy and redeem them at checkout for instant savings!
              </p>
            </div>

            <div className="bg-[#fef9ee] rounded-2xl p-3.5 border border-amber-100/80 space-y-1">
              <div className="font-extrabold text-amber-700 flex items-center gap-1.5 text-sm">
                <span>3. Earn Store Points</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                Hit the 500 PTS wedge to boost your Chokku coin balance, convertible directly into real store currency!
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 6. CELEBRATION WINNER MODAL */}
      {/* ============================================================ */}
      {showWinModal && wonPrize && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-white/20 relative animate-scale-up">
            
            {/* Header with Winner Theme Gradient */}
            <div
              style={{ backgroundColor: wonPrize.color }}
              className="p-6 text-white text-center relative overflow-hidden"
            >
              <button
                onClick={() => setShowWinModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Dual Party Poppers & Trophy Badge */}
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-inner border border-white/30 animate-bounce">
                  <PartyPopper className="w-6 h-6 text-amber-300 drop-shadow animate-popper-pop" />
                </div>
                <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center shadow-inner border border-white/40 animate-bounce [animation-delay:120ms]">
                  <Trophy className="w-8 h-8 text-amber-300 drop-shadow" />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-inner border border-white/30 animate-bounce [animation-delay:240ms]">
                  <PartyPopper className="w-6 h-6 text-amber-300 drop-shadow animate-popper-pop -scale-x-100" />
                </div>
              </div>

              <span className="text-[11px] font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full inline-block">
                🎉 LUCKY SPIN WINNER
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 drop-shadow-md">
                YOU WON {wonPrize.label}!
              </h3>
              <p className="text-xs text-white/90 font-medium mt-1">
                {wonPrize.subLabel}
              </p>
            </div>

            {/* Voucher Body Details */}
            <div className="p-6 space-y-5 text-center">
              
              {/* Voucher Ticket Card */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-4 border-2 border-dashed border-gray-300 relative space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Your Exclusive Coupon Code
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-lg sm:text-xl text-slate-900 bg-white px-4 py-2 rounded-xl border border-gray-200 tracking-wider shadow-inner">
                    {wonPrize.code}
                  </span>
                  <button
                    onClick={() => copyCouponCode(wonPrize.code)}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Copy Code"
                  >
                    {copiedCode === wonPrize.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold">
                  Saved automatically to your "My Coupons" wallet • Valid for 7 days
                </p>

                {/* Quick Party Popper Re-Blast Button */}
                <div className="pt-1">
                  <button
                    onClick={triggerPartyPopperBlast}
                    className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 font-black cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-2xs"
                  >
                    <PartyPopper className="w-3.5 h-3.5 text-amber-600 animate-popper-pop" />
                    <span>Blast Confetti Again 🎉</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  to="/shop"
                  onClick={() => setShowWinModal(false)}
                  className="w-full bg-[#488710] hover:bg-emerald-700 text-white font-black py-3.5 px-6 rounded-full text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>USE VOUCHER IN STORE NOW</span>
                </Link>

                <button
                  onClick={() => setShowWinModal(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-2.5 px-4 rounded-full text-xs transition-colors cursor-pointer"
                >
                  Continue Spinning
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. MY EARNED COUPONS DRAWER / MODAL */}
      {/* ============================================================ */}
      {showCouponsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scale-up">
            
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tag className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">My Won Coupons</h3>
              </div>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 max-h-[65vh] overflow-y-auto">
              {myCoupons.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                    <Tag className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">No Won Coupons Yet</h4>
                  <p className="text-xs text-gray-500">
                    Spin the lucky wheel now to earn your first discount vouchers!
                  </p>
                </div>
              ) : (
                myCoupons.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center font-black text-xs text-center shrink-0 shadow-md p-1 leading-tight`}
                      >
                        {c.discount}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{c.title}</h4>
                          {c.badge && (
                            <span className="text-[9px] font-black bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full uppercase">
                              {c.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">{c.expiry}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-slate-200 pt-2.5 sm:pt-0 shrink-0">
                      <span className="font-mono font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800">
                        {c.code}
                      </span>
                      <button
                        onClick={() => copyCouponCode(c.code)}
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
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}

              {myCoupons.length > 0 && (
                <div className="pt-2 text-center">
                  <Link
                    to="/shop"
                    onClick={() => setShowCouponsModal(false)}
                    className="inline-flex items-center gap-2 bg-[#488710] hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-full text-xs shadow-md transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>USE COUPONS IN STORE NOW</span>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FULL-SCREEN HIGH-ENERGY CELEBRATION PARTY POPPER BLAST (Z-100 on top of all modals) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[100] w-full h-full"
      />

    </div>
  );
};
