import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Trophy,
  Sparkles,
  Zap,
  Target,
  Award,
  ChevronRight,
  ChevronLeft,
  Lock,
  ShoppingBag,
  Percent,
  Check,
  Copy,
  X,
  Play,
  Users,
  Bot,
  ShieldAlert,
  Coins,
  RefreshCw,
  Flame,
  Clock,
  ShieldCheck,
  Swords,
  Bell,
  MoreHorizontal,
  Gamepad2,
  Crown,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { safeFetch } from '../utils/api';
import { socket } from '../socket';
import playmobile from '../assets/img/playmobile.png';
import gameboy from '../assets/img/gameboy.png';
import spinwin from '../assets/img/spinwin.png';

// Web Audio API Synthesizer (100% reliable sound effects)
class CarromSoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClack(intensity: number = 0.5) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      const clamped = Math.min(1, Math.max(0.1, intensity));
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + clamped * 600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(clamped * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  playCushion() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.06);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {}
  }

  playPocket() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 660, 880].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const delay = idx * 0.04;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
      });
    } catch {}
  }

  playQueen() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const delay = idx * 0.07;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.26);
      });
    } catch {}
  }

  playFoul() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {}
  }

  playVictory() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const delay = i * 0.09;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.36);
      });
    } catch {}
  }
}

const soundManager = new CarromSoundManager();

// Board & Piece Physics Interfaces
interface Piece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  type: 'white' | 'black' | 'queen' | 'striker';
  isPocketed: boolean;
  scale: number;
  opacity: number;
}

interface PocketAnimation {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  scale: number;
}

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

interface PlayerProfile {
  id: string;
  name: string;
  avatar?: string;
  color: 'white' | 'black';
  role: 'player1' | 'player2';
  isAi?: boolean;
}

// Dimensions & Constants
const BOARD_SIZE = 600;
const FRAME_BORDER = 44;
const PLAY_MIN = FRAME_BORDER;
const PLAY_MAX = BOARD_SIZE - FRAME_BORDER;
const POCKET_RADIUS = 28;

const POCKETS = [
  { x: PLAY_MIN + 18, y: PLAY_MIN + 18 },
  { x: PLAY_MAX - 18, y: PLAY_MIN + 18 },
  { x: PLAY_MIN + 18, y: PLAY_MAX - 18 },
  { x: PLAY_MAX - 18, y: PLAY_MAX - 18 },
];

const PLAYER_BASELINE_Y = 492;
const OPPONENT_BASELINE_Y = 108;
const BASELINE_MIN_X = 145;
const BASELINE_MAX_X = 455;
const STRIKER_RADIUS = 20;
const COIN_RADIUS = 14;

// Available Match Tiers
const MATCH_TIERS = [50, 100, 500, 1000, 5000];

interface TierConfig {
  points: number;
  title: string;
  badge: string;
  arenaName: string;
  cardBgGradient: string;
  borderColor: string;
  borderColorActive: string;
  glowColor: string;
  coinGlow: string;
  btnClass: string;
}

const TIER_CONFIGS: TierConfig[] = [
  {
    points: 50,
    title: 'Bronze Arena',
    badge: 'STARTER MATCH',
    arenaName: 'BRONZE ARENA',
    cardBgGradient: 'linear-gradient(180deg, #04284d 0%, #031c36 55%, #020f1e 100%)',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    borderColorActive: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    coinGlow: 'rgba(56, 189, 248, 0.65)',
    btnClass: 'bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.55)]',
  },
  {
    points: 100,
    title: 'Silver Arena',
    badge: 'MOST POPULAR',
    arenaName: 'SILVER ARENA',
    cardBgGradient: 'linear-gradient(180deg, #033b21 0%, #022615 55%, #01140b 100%)',
    borderColor: 'rgba(52, 211, 153, 0.45)',
    borderColorActive: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    coinGlow: 'rgba(52, 211, 153, 0.65)',
    btnClass: 'bg-gradient-to-r from-lime-500 via-emerald-400 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-white shadow-[0_0_18px_rgba(74,222,128,0.55)]',
  },
  {
    points: 500,
    title: 'Gold Arena',
    badge: 'PRO LEAGUE ⚡',
    arenaName: 'GOLD ARENA',
    cardBgGradient: 'linear-gradient(180deg, #3d2404 0%, #261602 55%, #120a01 100%)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
    borderColorActive: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    coinGlow: 'rgba(251, 191, 36, 0.65)',
    btnClass: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 shadow-[0_0_18px_rgba(251,191,36,0.55)]',
  },
  {
    points: 1000,
    title: 'Ruby Arena',
    badge: 'CHAMPIONS CUP 🏆',
    arenaName: 'RUBY ARENA',
    cardBgGradient: 'linear-gradient(180deg, #400914 0%, #29050c 55%, #140205 100%)',
    borderColor: 'rgba(244, 63, 94, 0.45)',
    borderColorActive: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    coinGlow: 'rgba(244, 63, 94, 0.65)',
    btnClass: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 text-white shadow-[0_0_18px_rgba(244,63,94,0.55)]',
  },
  {
    points: 5000,
    title: 'Diamond Arena',
    badge: 'LEGENDS ARENA 👑',
    arenaName: 'MASTER ARENA',
    cardBgGradient: 'linear-gradient(180deg, #2e094f 0%, #1c0433 55%, #0d011a 100%)',
    borderColor: 'rgba(168, 85, 247, 0.45)',
    borderColorActive: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    coinGlow: 'rgba(168, 85, 247, 0.65)',
    btnClass: 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.55)]',
  },
];

// Stacked 3D Carrom Coins Graphic (White puck, Black puck, and Center Queen with radiant bloom)
const CarromCoinsStacked: React.FC<{ glowColor: string }> = ({ glowColor }) => (
  <div className="relative w-28 h-16 flex items-center justify-center my-1 select-none">
    {/* Ambient Glow */}
    <div
      className="absolute inset-0 rounded-full blur-xl pointer-events-none opacity-60"
      style={{ background: glowColor }}
    />

    <svg viewBox="0 0 120 70" className="w-full h-full relative z-10 overflow-visible drop-shadow-lg">
      <defs>
        {/* White Coin Gradients */}
        <linearGradient id="whiteCoinBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f3ede2" />
          <stop offset="100%" stopColor="#c7b9a5" />
        </linearGradient>
        <radialGradient id="whiteCoinTop" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f7f3ec" />
          <stop offset="100%" stopColor="#d4c7b2" />
        </radialGradient>

        {/* Black Coin Gradients */}
        <linearGradient id="blackCoinBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="60%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>
        <radialGradient id="blackCoinTop" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="65%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#090a0f" />
        </radialGradient>

        {/* Queen Red Coin Gradients */}
        <linearGradient id="queenCoinBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <radialGradient id="queenCoinTop" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="65%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      {/* Shadow under all coins */}
      <ellipse cx="60" cy="56" rx="46" ry="10" fill="rgba(0,0,0,0.5)" filter="blur(4px)" />

      {/* 1. Left Piece: White Carrom Puck */}
      <g transform="translate(18, 14)">
        <path d="M 0,16 C 0,23 32,23 32,16 L 32,22 C 32,29 0,29 0,22 Z" fill="url(#whiteCoinBody)" />
        <ellipse cx="16" cy="16" rx="16" ry="8" fill="url(#whiteCoinTop)" stroke="#bfae95" strokeWidth="0.8" />
        <ellipse cx="16" cy="16" rx="9" ry="4.5" fill="none" stroke="#bfae95" strokeWidth="0.8" strokeDasharray="3,1" />
        <circle cx="16" cy="16" r="1.5" fill="#bfae95" />
      </g>

      {/* 2. Right Piece: Black Carrom Puck */}
      <g transform="translate(70, 16)">
        <path d="M 0,16 C 0,23 32,23 32,16 L 32,22 C 32,29 0,29 0,22 Z" fill="url(#blackCoinBody)" />
        <ellipse cx="16" cy="16" rx="16" ry="8" fill="url(#blackCoinTop)" stroke="#6b7280" strokeWidth="0.8" />
        <ellipse cx="16" cy="16" rx="9" ry="4.5" fill="none" stroke="#6b7280" strokeWidth="0.8" strokeDasharray="3,1" />
        <circle cx="16" cy="16" r="1.5" fill="#6b7280" />
      </g>

      {/* 3. Center Piece: Red Queen Puck (Slightly raised & overlapping) */}
      <g transform="translate(44, 4)">
        <path d="M 0,17 C 0,25 34,25 34,17 L 34,24 C 34,32 0,32 0,24 Z" fill="url(#queenCoinBody)" />
        <ellipse cx="17" cy="17" rx="17" ry="9" fill="url(#queenCoinTop)" stroke="#fbbf24" strokeWidth="1" />
        <ellipse cx="17" cy="17" rx="11" ry="5.8" fill="none" stroke="#fbbf24" strokeWidth="1" />
        <ellipse cx="17" cy="17" rx="5" ry="2.6" fill="#fbbf24" opacity="0.9" />
        <circle cx="17" cy="17" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  </div>
);

// 3D Isometric Mini Carrom Board for Hero Banner
const Mini3DCarromBoard: React.FC = () => (
  <div className="relative w-28 h-24 sm:w-32 sm:h-28 flex items-center justify-center select-none pointer-events-none">
    <svg viewBox="0 0 140 110" className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
      <defs>
        <linearGradient id="boardFrame" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a250e" />
          <stop offset="50%" stopColor="#2e1608" />
          <stop offset="100%" stopColor="#140903" />
        </linearGradient>
        <radialGradient id="boardSurface" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf7e7" />
          <stop offset="80%" stopColor="#f4ebd0" />
          <stop offset="100%" stopColor="#dfcfab" />
        </radialGradient>
      </defs>

      <g transform="translate(10, 10)">
        {/* Under shadow */}
        <polygon points="15,45 75,10 135,45 75,80" fill="rgba(0,0,0,0.6)" transform="translate(0, 10)" filter="blur(5px)" />

        {/* Board Edge / Thickness */}
        <polygon points="15,45 75,80 75,87 15,52" fill="#1f0d04" />
        <polygon points="75,80 135,45 135,52 75,87" fill="#120702" />

        {/* Board Outer Top Frame */}
        <polygon points="15,45 75,10 135,45 75,80" fill="url(#boardFrame)" stroke="#663412" strokeWidth="1" />

        {/* Inner Playing Surface */}
        <polygon points="25,45 75,17 125,45 75,73" fill="url(#boardSurface)" stroke="#4a2e16" strokeWidth="0.8" />

        {/* 4 Corner Pockets */}
        <ellipse cx="27" cy="45" rx="4.5" ry="2.5" fill="#0f0f0f" stroke="#c2883f" strokeWidth="0.8" />
        <ellipse cx="75" cy="18" rx="4.5" ry="2.5" fill="#0f0f0f" stroke="#c2883f" strokeWidth="0.8" />
        <ellipse cx="123" cy="45" rx="4.5" ry="2.5" fill="#0f0f0f" stroke="#c2883f" strokeWidth="0.8" />
        <ellipse cx="75" cy="72" rx="4.5" ry="2.5" fill="#0f0f0f" stroke="#c2883f" strokeWidth="0.8" />

        {/* Center Ring & Concentric Circles */}
        <ellipse cx="75" cy="45" rx="14" ry="7.5" fill="none" stroke="#374151" strokeWidth="0.8" />
        <ellipse cx="75" cy="45" rx="7" ry="3.8" fill="none" stroke="#dc2626" strokeWidth="0.8" />

        {/* Carrom Coins in Center */}
        <ellipse cx="71" cy="43" rx="3.5" ry="1.8" fill="#ffffff" stroke="#c7b9a5" strokeWidth="0.5" />
        <ellipse cx="79" cy="43" rx="3.5" ry="1.8" fill="#1f2937" stroke="#4b5563" strokeWidth="0.5" />
        <ellipse cx="75" cy="48" rx="3.5" ry="1.8" fill="#ffffff" stroke="#c7b9a5" strokeWidth="0.5" />
        <ellipse cx="69" cy="47" rx="3.5" ry="1.8" fill="#1f2937" stroke="#4b5563" strokeWidth="0.5" />
        <ellipse cx="81" cy="47" rx="3.5" ry="1.8" fill="#ffffff" stroke="#c7b9a5" strokeWidth="0.5" />
        <ellipse cx="75" cy="44.5" rx="3.8" ry="2" fill="#dc2626" stroke="#fbbf24" strokeWidth="0.6" />
      </g>
    </svg>
  </div>
);

export const Carroms: React.FC = () => {
  const { addToast } = useToast();
  const { customerUser, customerPoints, fetchCustomerPoints } = useAuth();
  const navigate = useNavigate();

  // Screen state: 'check' | 'tier_select' | 'matchmaking' | 'vs_ready' | 'playing' | 'results'
  const [screen, setScreen] = useState<'check' | 'tier_select' | 'matchmaking' | 'vs_ready' | 'playing' | 'results'>('check');

  // Points & Eligibility state
  const [availablePoints, setAvailablePoints] = useState<number>(customerPoints || 0);
  const [isEligible, setIsEligible] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<number>(100);
  const [currentMatchId, setCurrentMatchId] = useState<string>('');

  // Matchmaking state
  const [matchmakingTime, setMatchmakingTime] = useState<number>(0);
  const [gameMode, setGameMode] = useState<'MULTIPLAYER' | 'AI'>('AI');
  const [matchRoom, setMatchRoom] = useState<string>('');

  // Players
  const [playerUser, setPlayerUser] = useState<PlayerProfile>({
    id: customerUser?.id || (customerUser as any)?._id || 'user_1',
    name: customerUser?.name || customerUser?.username || 'You',
    avatar: customerUser?.avatarUrl || '',
    color: 'white',
    role: 'player1',
  });

  const [opponent, setOpponent] = useState<PlayerProfile>({
    id: 'ai_bot',
    name: 'Chokku AI Bot',
    color: 'black',
    role: 'player2',
    isAi: true,
  });

  // Game Core States
  const [currentTurn, setCurrentTurn] = useState<'player1' | 'player2'>('player1');
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(15);
  const [p1PucksLeft, setP1PucksLeft] = useState<number>(4);
  const [p2PucksLeft, setP2PucksLeft] = useState<number>(4);
  const [queenPocketedBy, setQueenPocketedBy] = useState<'player1' | 'player2' | null>(null);
  const [strikerBaselineX, setStrikerBaselineX] = useState<number>(300);
  const [opponentBaselineX, setOpponentBaselineX] = useState<number>(300);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [matchResult, setMatchResult] = useState<'WON' | 'LOST' | null>(null);
  const [earnedCoupon, setEarnedCoupon] = useState<CouponItem | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const handleExitClick = () => {
    if (screen === 'playing') {
      setShowExitConfirm(true);
    } else {
      navigate('/play-and-win');
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (screen === 'playing' && gameMode === 'MULTIPLAYER' && matchRoom) {
      socket.emit('carrom:leave_match', { matchRoom });
    }
    navigate('/play-and-win');
  };

  // Drag & Aim States
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [aimCurrent, setAimCurrent] = useState<{ x: number; y: number } | null>(null);
  const [dragPower, setDragPower] = useState<number>(0);
  const [isPhysicsActive, setIsPhysicsActive] = useState<boolean>(false);

  // Carousel ref & active index
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(1);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 295;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollToTierIndex = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 295;
      carouselRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
      setActiveCarouselIndex(index);
    }
  };

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const cardWidth = 285;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveCarouselIndex(Math.max(0, Math.min(TIER_CONFIGS.length - 1, index)));
    }
  };

  // Canvas & Physics Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const piecesRef = useRef<Piece[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const floatingTextsRef = useRef<PocketAnimation[]>([]);
  const isDraggingStrikerDirectlyRef = useRef<boolean>(false);
  const turnTimerRef = useRef<any>(null);
  const aiActionTimeoutRef = useRef<any>(null);

  // Fetch / verify eligibility on mount or when customer changes
  const verifyEligibility = useCallback(async () => {
    if (!customerUser) {
      setAvailablePoints(0);
      setIsEligible(false);
      setScreen('check');
      return;
    }

    try {
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser.id || (customerUser as any)._id || '';

      const res = await safeFetch('/carrom-game/eligibility', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-id': userId,
        },
      });

      if (res.ok && res.data?.success) {
        const pts = Number(res.data.availablePoints) || 0;
        setAvailablePoints(pts);
        const eligible = pts >= 100;
        setIsEligible(eligible);
        if (eligible) {
          setScreen('tier_select');
        } else {
          setScreen('check');
        }
      } else {
        // Fallback to customerPoints from AuthContext
        const pts = customerPoints || 0;
        setAvailablePoints(pts);
        const eligible = pts >= 100;
        setIsEligible(eligible);
        if (eligible) setScreen('tier_select');
        else setScreen('check');
      }
    } catch {
      const pts = customerPoints || 0;
      setAvailablePoints(pts);
      setIsEligible(pts >= 100);
      setScreen(pts >= 100 ? 'tier_select' : 'check');
    }
  }, [customerUser, customerPoints]);

  useEffect(() => {
    verifyEligibility();
  }, [verifyEligibility]);

  // Center 100 PTS card when entering tier_select screen
  useEffect(() => {
    if (screen === 'tier_select') {
      const timer = setTimeout(() => {
        if (carouselRef.current) {
          carouselRef.current.scrollTo({
            left: 100,
            behavior: 'smooth',
          });
          setActiveCarouselIndex(1);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Audio toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
  };

  // Setup Disc Pool Pieces (4 White, 4 Black, 1 Red Queen in center)
  const setupPieces = useCallback(() => {
    const pieces: Piece[] = [];
    let id = 1;

    // Striker (Starts on player baseline at y = 492)
    pieces.push({
      id: id++,
      x: strikerBaselineX,
      y: PLAYER_BASELINE_Y,
      vx: 0,
      vy: 0,
      radius: STRIKER_RADIUS,
      mass: 3.4,
      type: 'striker',
      isPocketed: false,
      scale: 1,
      opacity: 1,
    });

    // Center Queen (Red)
    pieces.push({
      id: id++,
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      radius: COIN_RADIUS,
      mass: 1.0,
      type: 'queen',
      isPocketed: false,
      scale: 1,
      opacity: 1,
    });

    // 4 White pucks (Player 1) & 4 Black pucks (Player 2) tightly packed in circle
    const dist = COIN_RADIUS * 2 + 1; // 29px
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45 * Math.PI) / 180;
      const type = i % 2 === 0 ? 'white' : 'black';
      pieces.push({
        id: id++,
        x: 300 + Math.cos(angle) * dist,
        y: 300 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: COIN_RADIUS,
        mass: 1.0,
        type,
        isPocketed: false,
        scale: 1,
        opacity: 1,
      });
    }

    piecesRef.current = pieces;
    floatingTextsRef.current = [];
    setP1PucksLeft(4);
    setP2PucksLeft(4);
    setQueenPocketedBy(null);
  }, [strikerBaselineX]);

  // Spawn floating score / notification badge
  const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
    floatingTextsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      opacity: 1,
      scale: 1,
    });
  };

  // Convert canvas mouse/touch coordinates to board virtual coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Matchmaking: Start search
  const handleStartMatchmaking = async (tierOverride?: number) => {
    const tierToUse = tierOverride !== undefined ? tierOverride : selectedTier;
    setSelectedTier(tierToUse);

    if (availablePoints < 100) {
      addToast('Points Insufficient', 'You need at least 100 points to play Carroms.', 'warning');
      return;
    }

    if (availablePoints < tierToUse) {
      addToast('Tier Unavailable', `You have ${availablePoints} points. Need ${tierToUse} points to play this tier.`, 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const res = await safeFetch('/carrom-game/join-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({ entryFee: tierToUse }),
      });

      if (!res.ok || !res.data?.success) {
        addToast('Match Entry Failed', res.data?.message || 'Could not validate entry fee.', 'error');
        return;
      }

      setCurrentMatchId(res.data.matchId);
      setScreen('matchmaking');
      setMatchmakingTime(0);

      // Emit find_match event to Socket.io
      socket.emit('carrom:find_match', {
        entryFee: tierToUse,
        userId: customerUser?.id || (customerUser as any)?._id,
        userName: customerUser?.name || customerUser?.username || 'You',
        userAvatar: customerUser?.avatarUrl || '',
        matchId: res.data.matchId,
      });
    } catch {
      addToast('Network Error', 'Could not connect to matchmaking server.', 'error');
    }
  };

  // Matchmaking Cancel
  const handleCancelMatchmaking = () => {
    socket.emit('carrom:cancel_match');
    setScreen('tier_select');
  };

  // Start with AI Bot directly
  const handlePlayWithBot = () => {
    socket.emit('carrom:cancel_match');
    setGameMode('AI');
    const botNames = ['Chokku Master Bot', 'Pro Carrom Bot', 'Grandmaster Arjun', 'Kavya AI'];
    const chosenName = botNames[Math.floor(Math.random() * botNames.length)];

    setPlayerUser({
      id: customerUser?.id || (customerUser as any)?._id || 'user_1',
      name: customerUser?.name || customerUser?.username || 'You',
      avatar: customerUser?.avatarUrl || '',
      color: 'white',
      role: 'player1',
    });

    setOpponent({
      id: 'ai_bot',
      name: chosenName,
      color: 'black',
      role: 'player2',
      isAi: true,
    });

    setScreen('vs_ready');
  };

  // Matchmaking Timer & Socket Listeners
  useEffect(() => {
    if (screen !== 'matchmaking') return;

    const timer = setInterval(() => {
      setMatchmakingTime((prev) => {
        // If after 6 seconds no player found, fallback to AI
        if (prev >= 6) {
          clearInterval(timer);
          handlePlayWithBot();
          return 6;
        }
        return prev + 1;
      });
    }, 1000);

    // Listen for live multiplayer match from Socket.io
    const onMatchFound = (data: any) => {
      clearInterval(timer);
      setGameMode('MULTIPLAYER');
      setMatchRoom(data.matchRoom);

      const isP1 = data.yourRole === 'player1';
      setPlayerUser({
        id: isP1 ? data.player1.userId : data.player2.userId,
        name: isP1 ? data.player1.name : data.player2.name,
        avatar: isP1 ? data.player1.avatar : data.player2.avatar,
        color: data.yourColor,
        role: data.yourRole,
      });

      const oppData = isP1 ? data.player2 : data.player1;
      setOpponent({
        id: oppData.userId,
        name: oppData.name,
        avatar: oppData.avatar,
        color: isP1 ? 'black' : 'white',
        role: isP1 ? 'player2' : 'player1',
        isAi: false,
      });

      setScreen('vs_ready');
      soundManager.playVictory();
    };

    socket.on('carrom:match_found', onMatchFound);

    return () => {
      clearInterval(timer);
      socket.off('carrom:match_found', onMatchFound);
    };
  }, [screen]);

  // VS Screen countdown before starting match
  useEffect(() => {
    if (screen !== 'vs_ready') return;
    setupPieces();
    setCurrentTurn('player1');
    const to = setTimeout(() => {
      setScreen('playing');
    }, 2800);
    return () => clearTimeout(to);
  }, [screen, setupPieces]);

  // Handle Match Over & Settle Points with Backend
  const handleMatchFinish = async (winnerRole: 'player1' | 'player2') => {
    const isUserWinner = playerUser.role === winnerRole;
    setMatchResult(isUserWinner ? 'WON' : 'LOST');
    setScreen('results');

    if (isUserWinner) {
      soundManager.playVictory();
      // Generate coupon
      const code = selectedTier >= 500 ? `CARROM${selectedTier}` : 'CARROM100';
      const discount = selectedTier >= 500 ? '₹150 OFF' : '₹50 OFF';
      const newCoupon: CouponItem = {
        id: `c-crm-${Date.now()}`,
        code,
        discount,
        title: 'Carrom Match Champion Voucher',
        desc: `Won by triumphing in a ${selectedTier} PTS match!`,
        expiry: 'Valid for 7 days',
        color: 'from-amber-500 to-orange-600',
        badge: 'MATCH WINNER',
      };
      setEarnedCoupon(newCoupon);

      try {
        const saved = localStorage.getItem('chokku_user_coupons');
        const list: CouponItem[] = saved ? JSON.parse(saved) : [];
        list.unshift(newCoupon);
        localStorage.setItem('chokku_user_coupons', JSON.stringify(list));
      } catch (e) {
        console.error(e);
      }
    } else {
      soundManager.playFoul();
    }

    // Call Backend API to Settle Points
    if (customerUser) {
      try {
        const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
        const userId = customerUser.id || (customerUser as any)?._id || '';

        const res = await safeFetch('/carrom-game/complete-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-user-id': userId,
          },
          body: JSON.stringify({
            matchId: currentMatchId,
            entryFee: selectedTier,
            result: isUserWinner ? 'WON' : 'LOST',
            opponentName: opponent.name,
            gameMode,
            coinsPocketed: 4 - (isUserWinner ? (playerUser.color === 'white' ? p1PucksLeft : p2PucksLeft) : 0),
            queenPocketed: queenPocketedBy === playerUser.role,
          }),
        });

        if (res.ok && res.data?.success) {
          setAvailablePoints(res.data.availablePoints);
          fetchCustomerPoints(); // Sync global auth points
          if (isUserWinner) {
            addToast('Match Won!', `+${selectedTier * 2} Points Credited (+${selectedTier} Net Profit)!`, 'success');
          } else {
            addToast('Match Ended', `-${selectedTier} Points Deducted.`, 'info');
          }
        }
      } catch (err) {
        console.error('Error settling match points:', err);
      }
    }
  };

  // Turn Switcher Helper
  const switchTurn = (nextTurn: 'player1' | 'player2') => {
    setCurrentTurn(nextTurn);
    setTurnTimeLeft(15);

    // Reset striker back to active player's baseline
    const striker = piecesRef.current.find((p) => p.type === 'striker');
    if (striker) {
      striker.isPocketed = false;
      striker.vx = 0;
      striker.vy = 0;
      if (nextTurn === 'player1') {
        striker.x = strikerBaselineX;
        striker.y = PLAYER_BASELINE_Y;
      } else {
        striker.x = opponentBaselineX;
        striker.y = OPPONENT_BASELINE_Y;
      }
    }
  };

  // Sync striker baseline slider
  const handleBaselineChange = (newX: number) => {
    if (currentTurn !== playerUser.role || isPhysicsActive) return;
    setStrikerBaselineX(newX);
    const striker = piecesRef.current.find((p) => p.type === 'striker');
    if (striker && !striker.isPocketed) {
      striker.x = newX;
      striker.y = PLAYER_BASELINE_Y;
    }

    if (gameMode === 'MULTIPLAYER' && matchRoom) {
      socket.emit('carrom:striker_move', { matchRoom, strikerX: newX });
    }
  };

  // Turn countdown timer
  useEffect(() => {
    if (screen !== 'playing' || isPhysicsActive) return;

    turnTimerRef.current = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout! Forfeit turn
          addToast('Turn Time Expired', 'Turn passed to opponent!', 'warning');
          switchTurn(currentTurn === 'player1' ? 'player2' : 'player1');
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(turnTimerRef.current);
  }, [screen, currentTurn, isPhysicsActive]);

  // AI / Bot Automatic Turn Execution
  useEffect(() => {
    if (screen !== 'playing' || isPhysicsActive || currentTurn !== opponent.role || !opponent.isAi) return;

    aiActionTimeoutRef.current = setTimeout(() => {
      const pieces = piecesRef.current;
      const targetType = opponent.color; // 'black' pucks
      const availableTargets = pieces.filter((p) => p.type === targetType && !p.isPocketed);

      // If no targets, fallback to queen or any coin
      const chosenTarget = availableTargets[0] || pieces.find((p) => !p.isPocketed && p.type !== 'striker');
      if (!chosenTarget) return;

      // Choose nearest pocket to target
      let bestPocket = POCKETS[0];
      let bestDist = Infinity;
      for (const pocket of POCKETS) {
        const d = Math.hypot(pocket.x - chosenTarget.x, pocket.y - chosenTarget.y);
        if (d < bestDist) {
          bestDist = d;
          bestPocket = pocket;
        }
      }

      // Vector from pocket through target to place striker
      const dirPocketX = chosenTarget.x - bestPocket.x;
      const dirPocketY = chosenTarget.y - bestPocket.y;
      const magPocket = Math.hypot(dirPocketX, dirPocketY) || 1;

      // Desired baseline X position
      const idealX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, chosenTarget.x + (dirPocketX / magPocket) * 40));
      setOpponentBaselineX(idealX);

      const striker = pieces.find((p) => p.type === 'striker');
      if (!striker) return;
      striker.x = idealX;
      striker.y = OPPONENT_BASELINE_Y;

      // Direction vector towards target with tiny human-like variance (±1.5 deg)
      const aimDx = chosenTarget.x - striker.x + (Math.random() - 0.5) * 6;
      const aimDy = chosenTarget.y - striker.y + (Math.random() - 0.5) * 6;
      const aimDist = Math.hypot(aimDx, aimDy) || 1;
      const speed = Math.min(18, 12 + Math.random() * 5);

      setTimeout(() => {
        striker.vx = (aimDx / aimDist) * speed;
        striker.vy = (aimDy / aimDist) * speed;
        soundManager.playClack(0.7);
        setIsPhysicsActive(true);
      }, 700);
    }, 1000);

    return () => clearTimeout(aiActionTimeoutRef.current);
  }, [screen, currentTurn, isPhysicsActive, opponent]);

  // Pointer Aim & Fire Handlers (for Human Player)
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (screen !== 'playing' || currentTurn !== playerUser.role || isPhysicsActive) return;
    const coords = getCanvasCoords(e);
    const striker = piecesRef.current.find((p) => p.type === 'striker');
    if (!striker || striker.isPocketed) return;

    if (Math.hypot(coords.x - striker.x, coords.y - striker.y) < STRIKER_RADIUS * 1.8) {
      isDraggingStrikerDirectlyRef.current = true;
    }

    setIsAiming(true);
    setAimCurrent(coords);
    setDragPower(0);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isAiming || screen !== 'playing' || currentTurn !== playerUser.role || isPhysicsActive) return;
    const coords = getCanvasCoords(e);

    if (isDraggingStrikerDirectlyRef.current) {
      const clampedX = Math.max(BASELINE_MIN_X, Math.min(BASELINE_MAX_X, coords.x));
      handleBaselineChange(clampedX);
      return;
    }

    setAimCurrent(coords);
    const striker = piecesRef.current.find((p) => p.type === 'striker');
    if (striker) {
      const dx = coords.x - striker.x;
      const dy = coords.y - striker.y;
      const dist = Math.hypot(dx, dy);
      const power = Math.min(100, Math.round((dist / 140) * 100));
      setDragPower(power);

      if (gameMode === 'MULTIPLAYER' && matchRoom) {
        socket.emit('carrom:aim', { matchRoom, aimAngle: Math.atan2(dy, dx), power, aimCurrent: coords });
      }
    }
  };

  const handlePointerUp = () => {
    if (isDraggingStrikerDirectlyRef.current) {
      isDraggingStrikerDirectlyRef.current = false;
      setIsAiming(false);
      setAimCurrent(null);
      return;
    }

    if (!isAiming || screen !== 'playing' || currentTurn !== playerUser.role || isPhysicsActive) return;
    setIsAiming(false);

    const striker = piecesRef.current.find((p) => p.type === 'striker');
    if (!striker || !aimCurrent || dragPower < 6) {
      setAimCurrent(null);
      setDragPower(0);
      return;
    }

    // Slingshot release
    const dx = striker.x - aimCurrent.x;
    const dy = striker.y - aimCurrent.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      const speed = Math.min(22, (dragPower / 100) * 22);
      striker.vx = (dx / dist) * speed;
      striker.vy = (dy / dist) * speed;
      soundManager.playClack(Math.min(1, speed / 15));
      setIsPhysicsActive(true);

      if (gameMode === 'MULTIPLAYER' && matchRoom) {
        socket.emit('carrom:shoot', { matchRoom, vx: striker.vx, vy: striker.vy, power: dragPower, strikerX: striker.x });
      }
    }

    setAimCurrent(null);
    setDragPower(0);
  };

  // Socket multiplayer listeners for opponent moves
  useEffect(() => {
    if (gameMode !== 'MULTIPLAYER' || !matchRoom) return;

    const onOpponentMove = (data: any) => {
      if (typeof data.strikerX === 'number') {
        setOpponentBaselineX(data.strikerX);
        const striker = piecesRef.current.find((p) => p.type === 'striker');
        if (striker && currentTurn !== playerUser.role) {
          striker.x = data.strikerX;
          striker.y = OPPONENT_BASELINE_Y;
        }
      }
    };

    const onOpponentShoot = (data: any) => {
      const striker = piecesRef.current.find((p) => p.type === 'striker');
      if (striker) {
        striker.x = data.strikerX || opponentBaselineX;
        striker.y = OPPONENT_BASELINE_Y;
        striker.vx = data.vx;
        striker.vy = data.vy;
        soundManager.playClack(0.7);
        setIsPhysicsActive(true);
      }
    };

    const onOpponentLeft = () => {
      addToast('Opponent Forfeit', 'Opponent disconnected. You win by default!', 'success');
      handleMatchFinish(playerUser.role);
    };

    socket.on('carrom:opponent_striker_move', onOpponentMove);
    socket.on('carrom:opponent_shoot', onOpponentShoot);
    socket.on('carrom:opponent_left', onOpponentLeft);

    return () => {
      socket.off('carrom:opponent_striker_move', onOpponentMove);
      socket.off('carrom:opponent_shoot', onOpponentShoot);
      socket.off('carrom:opponent_left', onOpponentLeft);
    };
  }, [gameMode, matchRoom, currentTurn, playerUser, opponentBaselineX]);

  // Main 60 FPS Physics Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pocketEventsThisShot = {
      whites: 0,
      blacks: 0,
      queen: false,
      striker: false,
    };

    const updatePhysics = () => {
      const pieces = piecesRef.current;
      const SUB_STEPS = 4;
      const FRICTION = 0.984;

      for (let step = 0; step < SUB_STEPS; step++) {
        // 1. Move & Decelerate
        for (let i = 0; i < pieces.length; i++) {
          const p = pieces[i];
          if (p.isPocketed) continue;

          p.x += p.vx / SUB_STEPS;
          p.y += p.vy / SUB_STEPS;

          p.vx *= Math.pow(FRICTION, 1 / SUB_STEPS);
          p.vy *= Math.pow(FRICTION, 1 / SUB_STEPS);

          if (Math.hypot(p.vx, p.vy) < 0.04) {
            p.vx = 0;
            p.vy = 0;
          }

          // 2. Cushion Boundary Bounce
          const minX = PLAY_MIN + p.radius;
          const maxX = PLAY_MAX - p.radius;
          const minY = PLAY_MIN + p.radius;
          const maxY = PLAY_MAX - p.radius;

          if (p.x < minX) {
            p.x = minX;
            p.vx = -p.vx * 0.88;
            if (Math.abs(p.vx) > 0.5) soundManager.playCushion();
          } else if (p.x > maxX) {
            p.x = maxX;
            p.vx = -p.vx * 0.88;
            if (Math.abs(p.vx) > 0.5) soundManager.playCushion();
          }

          if (p.y < minY) {
            p.y = minY;
            p.vy = -p.vy * 0.88;
            if (Math.abs(p.vy) > 0.5) soundManager.playCushion();
          } else if (p.y > maxY) {
            p.y = maxY;
            p.vy = -p.vy * 0.88;
            if (Math.abs(p.vy) > 0.5) soundManager.playCushion();
          }

          // 3. Pocket Capture
          for (const pocket of POCKETS) {
            const distToPocket = Math.hypot(p.x - pocket.x, p.y - pocket.y);
            if (distToPocket < POCKET_RADIUS) {
              p.isPocketed = true;
              p.vx = 0;
              p.vy = 0;

              if (p.type === 'white') {
                pocketEventsThisShot.whites++;
                soundManager.playPocket();
                spawnFloatingText(pocket.x, pocket.y, '⚪ WHITE POCKETED!', '#10b981');
              } else if (p.type === 'black') {
                pocketEventsThisShot.blacks++;
                soundManager.playPocket();
                spawnFloatingText(pocket.x, pocket.y, '⚫ BLACK POCKETED!', '#0284c7');
              } else if (p.type === 'queen') {
                pocketEventsThisShot.queen = true;
                soundManager.playQueen();
                spawnFloatingText(pocket.x, pocket.y, '👑 QUEEN POCKETED!', '#f59e0b');
              } else if (p.type === 'striker') {
                pocketEventsThisShot.striker = true;
                soundManager.playFoul();
                spawnFloatingText(pocket.x, pocket.y, '⚠️ FOUL! STRIKER!', '#ef4444');
              }
              break;
            }
          }
        }

        // 4. Elastic Collisions Between Pieces
        for (let i = 0; i < pieces.length; i++) {
          const p1 = pieces[i];
          if (p1.isPocketed) continue;

          for (let j = i + 1; j < pieces.length; j++) {
            const p2 = pieces[j];
            if (p2.isPocketed) continue;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = p1.radius + p2.radius;

            if (dist < minDist && dist > 0.001) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              const totalMass = p1.mass + p2.mass;
              p1.x -= nx * overlap * (p2.mass / totalMass);
              p1.y -= ny * overlap * (p2.mass / totalMass);
              p2.x += nx * overlap * (p1.mass / totalMass);
              p2.y += ny * overlap * (p1.mass / totalMass);

              const rvx = p2.vx - p1.vx;
              const rvy = p2.vy - p1.vy;
              const velAlongNormal = rvx * nx + rvy * ny;

              if (velAlongNormal < 0) {
                const impulse = (-(1 + 0.92) * velAlongNormal) / (1 / p1.mass + 1 / p2.mass);
                p1.vx -= (impulse / p1.mass) * nx;
                p1.vy -= (impulse / p1.mass) * ny;
                p2.vx += (impulse / p2.mass) * nx;
                p2.vy += (impulse / p2.mass) * ny;

                if (Math.abs(impulse) > 0.2) {
                  soundManager.playClack(Math.min(1, Math.abs(impulse) / 4));
                }
              }
            }
          }
        }
      }

      // Check if all pieces stopped moving
      if (isPhysicsActive) {
        const stillMoving = pieces.some((p) => !p.isPocketed && Math.hypot(p.vx, p.vy) > 0.05);

        if (!stillMoving) {
          setIsPhysicsActive(false);

          // Update remaining puck counts
          const whiteLeft = pieces.filter((p) => p.type === 'white' && !p.isPocketed).length;
          const blackLeft = pieces.filter((p) => p.type === 'black' && !p.isPocketed).length;
          setP1PucksLeft(whiteLeft);
          setP2PucksLeft(blackLeft);

          if (pocketEventsThisShot.queen) {
            setQueenPocketedBy(currentTurn);
          }

          // Check if either player won!
          // Player 1 wins if 0 white pucks left. Player 2 wins if 0 black pucks left.
          if (whiteLeft === 0) {
            handleMatchFinish('player1');
            return;
          }
          if (blackLeft === 0) {
            handleMatchFinish('player2');
            return;
          }

          // Turn rules (Carrom Disc Pool):
          // Current player retains turn if they pocketed at least one of their assigned pucks or the Queen, and did NOT foul!
          const activeColor = currentTurn === 'player1' ? 'white' : 'black';
          const pocketedOwn = activeColor === 'white' ? pocketEventsThisShot.whites > 0 : pocketEventsThisShot.blacks > 0;
          const pocketedQueen = pocketEventsThisShot.queen;
          const hadFoul = pocketEventsThisShot.striker;

          pocketEventsThisShot = { whites: 0, blacks: 0, queen: false, striker: false };

          if (!hadFoul && (pocketedOwn || pocketedQueen)) {
            // Extra Turn!
            addToast('Extra Turn!', 'You pocketed your puck! Take another shot!', 'success');
            setTurnTimeLeft(15);
            // Reposition striker on baseline
            const striker = pieces.find((p) => p.type === 'striker');
            if (striker) {
              striker.isPocketed = false;
              striker.vx = 0;
              striker.vy = 0;
              striker.y = currentTurn === 'player1' ? PLAYER_BASELINE_Y : OPPONENT_BASELINE_Y;
              striker.x = currentTurn === 'player1' ? strikerBaselineX : opponentBaselineX;
            }
          } else {
            // Turn passes to opponent
            const nextTurn = currentTurn === 'player1' ? 'player2' : 'player1';
            switchTurn(nextTurn);
          }
        }
      }
    };

    // Render Canvas
    const render = () => {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // 1. Outer Rosewood Frame
      const frameGrad = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
      frameGrad.addColorStop(0, '#2d1303');
      frameGrad.addColorStop(0.5, '#4d2008');
      frameGrad.addColorStop(1, '#1e0c02');
      ctx.fillStyle = frameGrad;
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      ctx.strokeStyle = '#7c3f13';
      ctx.lineWidth = 4;
      ctx.strokeRect(FRAME_BORDER - 4, FRAME_BORDER - 4, BOARD_SIZE - (FRAME_BORDER - 4) * 2, BOARD_SIZE - (FRAME_BORDER - 4) * 2);

      // 2. Birch Wood Playing Surface
      const surfaceGrad = ctx.createRadialGradient(300, 300, 40, 300, 300, 360);
      surfaceGrad.addColorStop(0, '#fef9e8');
      surfaceGrad.addColorStop(0.7, '#f7edd0');
      surfaceGrad.addColorStop(1, '#ebdcb4');
      ctx.fillStyle = surfaceGrad;
      ctx.fillRect(PLAY_MIN, PLAY_MIN, PLAY_MAX - PLAY_MIN, PLAY_MAX - PLAY_MIN);

      // 3. Corner Pockets
      for (const pocket of POCKETS) {
        const pocketGrad = ctx.createRadialGradient(pocket.x, pocket.y, 4, pocket.x, pocket.y, POCKET_RADIUS);
        pocketGrad.addColorStop(0, '#0a0a0a');
        pocketGrad.addColorStop(0.85, '#1e1e1e');
        pocketGrad.addColorStop(1, '#3b2010');
        ctx.fillStyle = pocketGrad;
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c2883f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Board Markings
      ctx.save();
      // Center Ring
      ctx.strokeStyle = '#a62626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(300, 300, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(300, 300, 58, 0, Math.PI * 2);
      ctx.stroke();

      // Baselines
      const drawBaseline = (x1: number, y1: number, x2: number, y2: number, circleColor: string) => {
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((pt) => {
          ctx.fillStyle = circleColor;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      };

      // Player Bottom Baseline
      drawBaseline(BASELINE_MIN_X, PLAYER_BASELINE_Y, BASELINE_MAX_X, PLAYER_BASELINE_Y, '#10b981');
      // Opponent Top Baseline
      drawBaseline(BASELINE_MIN_X, OPPONENT_BASELINE_Y, BASELINE_MAX_X, OPPONENT_BASELINE_Y, '#ef4444');

      ctx.restore();

      // 5. Render Pieces
      const pieces = piecesRef.current;
      for (const p of pieces) {
        if (p.isPocketed) continue;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;

        if (p.type === 'striker') {
          const strikerGrad = ctx.createRadialGradient(p.x - 5, p.y - 5, 2, p.x, p.y, p.radius);
          strikerGrad.addColorStop(0, '#ffffff');
          strikerGrad.addColorStop(0.7, '#e2e8f0');
          strikerGrad.addColorStop(1, '#94a3b8');
          ctx.fillStyle = strikerGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius - 2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = currentTurn === 'player1' ? '#10b981' : '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'queen') {
          const queenGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.radius);
          queenGrad.addColorStop(0, '#f87171');
          queenGrad.addColorStop(0.65, '#dc2626');
          queenGrad.addColorStop(1, '#7f1d1d');
          ctx.fillStyle = queenGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius - 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'white') {
          // White Puck (Player 1)
          const whiteGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.radius);
          whiteGrad.addColorStop(0, '#ffffff');
          whiteGrad.addColorStop(0.7, '#fef3c7');
          whiteGrad.addColorStop(1, '#d97706');
          ctx.fillStyle = whiteGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius - 3.5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'black') {
          // Black Puck (Player 2)
          const blackGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, p.radius);
          blackGrad.addColorStop(0, '#4b5563');
          blackGrad.addColorStop(0.75, '#1f2937');
          blackGrad.addColorStop(1, '#090a0f');
          ctx.fillStyle = blackGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius - 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 6. Aiming Trajectory Guide (Human Player)
      if (screen === 'playing' && currentTurn === playerUser.role && isAiming && aimCurrent) {
        const striker = pieces.find((p) => p.type === 'striker');
        if (striker && dragPower > 2) {
          const dx = striker.x - aimCurrent.x;
          const dy = striker.y - aimCurrent.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 5) {
            const dirX = dx / dist;
            const dirY = dy / dist;

            ctx.save();
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = dragPower > 70 ? '#ef4444' : dragPower > 40 ? '#f59e0b' : '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(striker.x, striker.y);
            const lineLen = Math.min(260, dist * 2);
            ctx.lineTo(striker.x + dirX * lineLen, striker.y + dirY * lineLen);
            ctx.stroke();

            // Pull-back indicator
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(striker.x, striker.y);
            ctx.lineTo(aimCurrent.x, aimCurrent.y);
            ctx.stroke();

            ctx.restore();
          }
        }
      }

      // 7. Floating Texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const item = floatingTextsRef.current[i];
        ctx.save();
        ctx.font = 'bold 16px "Josefin Sans", sans-serif';
        ctx.fillStyle = item.color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = item.opacity;
        ctx.textAlign = 'center';
        ctx.fillText(item.text, item.x, item.y);
        ctx.restore();

        item.y -= 1.2;
        item.opacity -= 0.02;
        if (item.opacity <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }
    };

    const loop = () => {
      updatePhysics();
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [screen, isPhysicsActive, currentTurn, isAiming, aimCurrent, dragPower, playerUser, strikerBaselineX, opponentBaselineX]);

  // Copy coupon code
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    addToast('Coupon Copied!', `Code ${code} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#020b17] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#052649] via-[#021021] to-[#01060d] text-white font-sans antialiased overflow-hidden select-none flex flex-col justify-between z-40">
      
      {/* ======================================================== */}
      {/* IN-GAME APP HEADER (CHOKKU STORE & CARROMS)             */}
      {/* ======================================================== */}
      <header className="w-full bg-[#051324]/95 backdrop-blur-md border-b border-sky-500/20 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 z-30 shadow-md">
        {/* Left: Back Arrow + Logo + Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExitClick}
            className="p-1 rounded-full text-white hover:text-sky-300 hover:bg-white/10 transition-all cursor-pointer"
            title="Back to Play & Win"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-1">
            <span className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1">
              <span>Chokku</span>
              <span className="text-[#a3e635]">Store</span>
              <ShoppingBag className="w-3.5 h-3.5 text-[#a3e635]" />
            </span>
          </div>

          <div className="h-4 w-px bg-sky-500/30" />

          {/* Pill Badge: Carroms */}
          <div className="flex items-center gap-1.5 bg-[#0a233f] text-sky-300 border border-sky-400/40 px-2.5 sm:px-3 py-1 rounded-full text-xs font-black shadow-[0_0_10px_rgba(56,189,248,0.25)]">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <span>Carroms</span>
          </div>
        </div>

        {/* Center: In-Game Status if match is active or ready */}
        {screen === 'playing' ? (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500/20 to-emerald-500/20 border border-sky-400/40 px-3 py-1 rounded-full text-amber-300 font-black text-xs shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>POOL: {(selectedTier * 2).toLocaleString()} PTS</span>
          </div>
        ) : screen === 'matchmaking' ? (
          <div className="hidden xs:flex items-center gap-1.5 text-xs font-black text-sky-300 tracking-wider">
            <Swords className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>SEARCHING OPPONENT</span>
          </div>
        ) : null}

        {/* Right: Notifications Bell & More Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
              soundEnabled
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30'
                : 'bg-white/10 text-gray-400 border-white/15 hover:bg-white/20'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notification Bell with green dot */}
          <button
            onClick={() => addToast('Chokku Carroms Arena', 'Welcome to the Carrom Arena! Select stakes & challenge players!', 'info')}
            className="relative p-1.5 rounded-full text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#a3e635] shadow-[0_0_6px_#a3e635]" />
          </button>

          {/* Rules / More Menu */}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="p-1.5 rounded-full text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Game Rules"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* SCREEN 1: POINTS INSUFFICIENT NOTIFICATION (< 100 PTS)   */}
      {/* ======================================================== */}
      {screen === 'check' && (
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center items-center px-4 py-4 overflow-y-auto no-scrollbar">
          <div className="w-full bg-[#07192e]/95 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-500/30 text-center space-y-5 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-10 h-10 text-amber-400" />
            </div>

            <div className="space-y-2">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                POINTS REQUIRED
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                100 Points Minimum Required
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/70 font-medium max-w-xs mx-auto leading-relaxed">
                You need at least <strong className="text-[#a3e635]">100 points</strong> to play Carroms. Win more points by playing other games!
              </p>
            </div>

            {/* Current Balance Card */}
            <div className="bg-[#021324]/80 rounded-2xl p-4 max-w-xs mx-auto border border-sky-500/20 flex items-center justify-around">
              <div>
                <p className="text-[10px] font-bold text-sky-300/80 uppercase">Your Points</p>
                <p className="text-xl sm:text-2xl font-black text-white">{availablePoints} PTS</p>
              </div>
              <div className="h-8 w-px bg-sky-500/20" />
              <div>
                <p className="text-[10px] font-bold text-sky-300/80 uppercase">Points Needed</p>
                <p className="text-xl sm:text-2xl font-black text-rose-400">
                  {Math.max(0, 100 - availablePoints)} PTS
                </p>
              </div>
            </div>

            {/* Earn More Points Fast */}
            <div className="space-y-2.5 pt-1">
              <p className="text-[10px] font-black uppercase text-sky-200/60 tracking-wider">
                Earn Points in Play &amp; Win
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                <Link
                  to="/spin-and-win"
                  className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-sky-500/20 transition-all flex items-center gap-2.5 group"
                >
                  <img src={spinwin} alt="Spin Wheel" className="w-10 h-10 object-contain shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-sky-200 truncate">Lucky Spin Wheel</h4>
                    <p className="text-[10px] text-gray-300">Win up to 500 PTS daily</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform ml-auto shrink-0" />
                </Link>

                <Link
                  to="/catch-the-gift"
                  className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-sky-500/20 transition-all flex items-center gap-2.5 group"
                >
                  <img src={gameboy} alt="Catch Gift" className="w-10 h-10 object-contain shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-black text-xs text-sky-200 truncate">Catch the Gift</h4>
                    <p className="text-[10px] text-gray-300">Earn points in 25s</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform ml-auto shrink-0" />
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/play-and-win"
                className="inline-flex items-center gap-2 text-xs font-black text-[#a3e635] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Play &amp; Win Hub</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: MATCH ENTRY & POINT SELECTION (REDESIGNED UI)  */}
      {/* ======================================================== */}
      {screen === 'tier_select' && (
        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-between px-3 py-1 sm:py-2 overflow-y-auto no-scrollbar">
          
          {/* 1. HERO BANNER: MONKEY MASCOT + CHOKKU CARROMS + 3D CARROM BOARD */}
          <div className="relative w-full flex items-center justify-between px-2 pt-0.5 pb-1 shrink-0">
            {/* Left: Monkey Mascot */}
            <div className="relative w-24 sm:w-28 h-20 sm:h-24 flex items-center justify-center shrink-0">
              <img
                src={playmobile}
                alt="Chokku Monkey Mascot"
                className="w-full h-full object-contain object-left drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Center: Chokku Carroms Typography with celebration rays */}
            <div className="text-center px-1 flex flex-col items-center justify-center my-auto">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide leading-none drop-shadow-md">
                Chokku
              </h1>
              <div className="relative inline-block mt-0.5">
                <h2 className="text-2xl sm:text-3xl font-black text-[#a3e635] tracking-wide leading-tight drop-shadow-[0_0_14px_rgba(163,230,53,0.6)]">
                  Carroms
                </h2>
                <span className="absolute -top-1 -right-4 text-yellow-300 font-bold text-xs select-none">
                  \ | /
                </span>
              </div>
            </div>

            {/* Right: 3D Isometric Mini Carrom Board */}
            <div className="shrink-0 flex items-center justify-end">
              <Mini3DCarromBoard />
            </div>
          </div>

          {/* 2. PLAYER PROFILE & AVAILABLE POINTS CARD */}
          <div className="bg-[#07192e]/90 backdrop-blur-md rounded-2xl sm:rounded-full px-3.5 py-2 sm:px-4 border border-sky-500/40 shadow-[0_0_18px_rgba(14,165,233,0.25)] flex items-center justify-between shrink-0 my-1">
            <div className="flex items-center gap-3 min-w-0">
              {/* Lime-green Initial Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#a3e635] text-[#06182e] font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                {playerUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-sm text-white truncate max-w-[130px] sm:max-w-[200px]">
                    {playerUser.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    <Crown className="w-2.5 h-2.5 text-amber-300" /> Player
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-sky-300/80 font-bold mt-0.5 cursor-pointer hover:text-sky-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Carroms Arena Ladder</span>
                  <ChevronRight className="w-3 h-3 text-sky-400" />
                </div>
              </div>
            </div>

            {/* Points on the right */}
            <div className="flex items-center gap-2.5 text-right shrink-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-[#a3e635] shadow-inner">
                <Coins className="w-5 h-5 text-[#a3e635]" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-sky-200/80">AVAILABLE POINTS</p>
                <p className="text-xl sm:text-2xl font-black text-white leading-none mt-0.5">
                  {availablePoints.toLocaleString()} PTS
                </p>
              </div>
            </div>
          </div>

          {/* 3. SECTION HEADING & CAROUSEL CONTROLS */}
          <div className="flex items-center justify-between gap-2 pt-1 pb-1 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-[#a3e635] shadow-[0_0_12px_rgba(163,230,53,0.3)] shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                  Select Match <span className="text-[#a3e635]">Points</span>
                </h2>
                <p className="text-[11px] text-sky-200/60 font-medium">
                  Choose match mode, winner takes the prize pool
                </p>
              </div>
            </div>

            {/* Left / Right Nav Arrows */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-8 h-8 rounded-full bg-[#07192e] hover:bg-sky-900/60 text-sky-300 border border-sky-400/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.25)]"
                aria-label="Previous Match Option"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-8 h-8 rounded-full bg-[#07192e] hover:bg-sky-900/60 text-sky-300 border border-sky-400/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.25)]"
                aria-label="Next Match Option"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4. HORIZONTAL CAROUSEL SLIDER */}
          <div className="relative shrink-0 my-auto py-1">
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar py-2 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TIER_CONFIGS.map((tier) => {
                const canAfford = availablePoints >= tier.points;
                const isSelected = selectedTier === tier.points;

                return (
                  <div
                    key={tier.points}
                    onClick={() => setSelectedTier(tier.points)}
                    className={`w-[265px] sm:w-[295px] h-[370px] sm:h-[390px] shrink-0 snap-center rounded-3xl p-4 sm:p-5 border-2 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 select-none cursor-pointer group ${
                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                    style={{
                      background: tier.cardBgGradient,
                      borderColor: isSelected ? tier.borderColorActive : tier.borderColor,
                      boxShadow: `0 0 25px ${tier.glowColor}`,
                    }}
                  >
                    {/* Top Row: Capsule Badge + Arena Name */}
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white text-slate-900 shadow-md">
                        {tier.badge}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-sky-200/80">
                        {tier.arenaName}
                      </span>
                    </div>

                    {/* Center: Stacked 3D Carrom Coins Graphic */}
                    <div className="relative z-10 flex flex-col items-center my-0.5">
                      <CarromCoinsStacked glowColor={tier.coinGlow} />

                      <p className="text-[10px] font-black uppercase tracking-widest text-sky-200/90 mt-1">
                        MATCH STAKE
                      </p>
                      <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mt-1">
                        {tier.points.toLocaleString()}
                      </h3>

                      {/* Points Divider Line */}
                      <div className="flex items-center gap-2 w-3/4 my-1 opacity-70">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
                        <span className="text-[10px] font-bold text-sky-200 uppercase tracking-widest">
                          POINTS
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
                      </div>
                    </div>

                    {/* Winner Prize Pool Inner Card */}
                    <div className="bg-[#021324]/85 backdrop-blur-md rounded-2xl p-2.5 border border-sky-400/20 text-center relative z-10 space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>WINNER PRIZE POOL</span>
                      </p>
                      <p className="text-xl font-black text-white tracking-tight leading-tight">
                        {(tier.points * 2).toLocaleString()} PTS
                      </p>
                      <p className="text-[10px] font-bold text-[#a3e635]">
                        Net Profit +{tier.points.toLocaleString()} PTS
                      </p>
                    </div>

                    {/* Play Now Button */}
                    <div className="relative z-10 pt-1">
                      {canAfford ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartMatchmaking(tier.points);
                          }}
                          className={`w-full ${tier.btnClass} font-black py-3 px-4 rounded-full text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>PLAY NOW ({tier.points.toLocaleString()} PTS)</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-white/10 text-white/40 font-bold py-2.5 px-4 rounded-full text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed border border-white/10"
                        >
                          <Lock className="w-3 h-3" />
                          <span>NEED {tier.points.toLocaleString()} PTS</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. CAROUSEL INDICATOR DOTS */}
          <div className="flex items-center justify-center gap-2 py-1 shrink-0">
            {TIER_CONFIGS.map((t, i) => (
              <button
                key={t.points}
                onClick={() => scrollToTierIndex(i)}
                className={`transition-all rounded-full cursor-pointer ${
                  activeCarouselIndex === i
                    ? 'w-7 h-2 bg-[#a3e635] shadow-[0_0_10px_#a3e635]'
                    : 'w-2 h-2 bg-slate-700 hover:bg-sky-400/50'
                }`}
                aria-label={`Go to ${t.points} Points Card`}
              />
            ))}
          </div>

          {/* 6. BOTTOM PRACTICE BANNER ("Want to warm up?") */}
          <div className="w-full bg-[#07192e]/90 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-sky-400/40 shadow-[0_0_18px_rgba(56,189,248,0.25)] flex items-center justify-between shrink-0 my-0.5">
            <div className="flex items-center gap-3 min-w-0">
              {/* Monkey Mascot Peeking */}
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-emerald-500/10 border border-emerald-400/20">
                <img
                  src={playmobile}
                  alt="Chokku Monkey"
                  className="w-10 h-10 object-contain drop-shadow-md"
                />
              </div>

              <div className="h-7 w-px bg-sky-500/20 shrink-0" />

              <div className="min-w-0">
                <p className="font-black text-xs text-white">
                  Want to warm up?
                </p>
                <p className="font-bold text-[11px] text-[#a3e635] truncate">
                  Play Free Practice Against AI Bot
                </p>
              </div>
            </div>

            <button
              onClick={handlePlayWithBot}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-transform active:scale-90 cursor-pointer shrink-0 ml-2"
              title="Practice Against AI Bot"
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3: MATCHMAKING SCREEN (Pulsing Radar / Searching) */}
      {/* ======================================================== */}
      {screen === 'matchmaking' && (
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center items-center px-4 py-4 overflow-y-auto no-scrollbar">
          <div className="w-full bg-[#07192e]/95 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-500/40 text-center space-y-6 relative overflow-hidden animate-scale-up">
            {/* Sonar Radar */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
              <div className="absolute inset-3 rounded-full border-2 border-sky-400/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-sky-500/20 backdrop-blur-md flex items-center justify-center border border-sky-400/50 shadow-inner">
                <Swords className="w-7 h-7 text-cyan-300 animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-slate-950 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                SEARCHING OPPONENT
              </span>
              <h2 className="text-xl font-black text-white">
                Finding Player with {selectedTier} Points...
              </h2>
              <p className="text-xs text-sky-200/70 font-medium">
                Searching real-time multiplayer lobbies ({matchmakingTime}s)
              </p>
            </div>

            {/* Match VS Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-sky-400/20 text-center">
                <div className="w-11 h-11 rounded-full bg-[#a3e635] text-[#06182e] font-black text-base flex items-center justify-center mx-auto mb-1 shadow-md">
                  {playerUser.name.charAt(0)}
                </div>
                <p className="font-black text-xs text-white truncate">{playerUser.name}</p>
                <span className="text-[10px] text-[#a3e635] font-bold">READY</span>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                <div className="w-11 h-11 rounded-full bg-white/15 text-cyan-300 font-black text-base flex items-center justify-center mx-auto mb-1 animate-pulse">
                  ?
                </div>
                <p className="font-black text-xs text-sky-200">Searching...</p>
                <span className="text-[10px] text-sky-300/80 font-bold">Connecting</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handlePlayWithBot}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-2.5 rounded-full text-xs shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Bot className="w-4 h-4" />
                <span>Play with AI Bot Now</span>
              </button>

              <button
                onClick={handleCancelMatchmaking}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-full text-xs transition-colors cursor-pointer"
              >
                Cancel Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 4: VS READY SCREEN (Countdown Showdown)          */}
      {/* ======================================================== */}
      {screen === 'vs_ready' && (
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center items-center px-4 py-4">
          <div className="w-full bg-gradient-to-b from-[#071d36] via-[#092647] to-[#041221] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-500/40 text-center space-y-6 animate-scale-up">
            <span className="bg-[#a3e635] text-slate-950 font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-[0_0_12px_rgba(163,230,53,0.5)]">
              MATCH FOUND!
            </span>

            {/* VS Box */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <div className="text-center space-y-1">
                <div className="w-16 h-16 rounded-full bg-[#a3e635] text-[#06182e] font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white mx-auto">
                  {playerUser.name.charAt(0)}
                </div>
                <p className="font-black text-xs text-white truncate max-w-[90px]">{playerUser.name}</p>
                <span className="text-[10px] font-bold text-[#a3e635] bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  ⚪ White
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] shrink-0">
                VS
              </div>

              <div className="text-center space-y-1">
                <div className="w-16 h-16 rounded-full bg-sky-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white mx-auto">
                  {opponent.name.charAt(0)}
                </div>
                <p className="font-black text-xs text-white truncate max-w-[90px]">{opponent.name}</p>
                <span className="text-[10px] font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-full">
                  ⚫ Black
                </span>
              </div>
            </div>

            <div className="bg-[#021324]/80 rounded-2xl p-3 border border-sky-400/30">
              <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">PRIZE POOL</p>
              <p className="text-xl font-black text-[#a3e635]">🏆 {selectedTier * 2} Points</p>
            </div>

            <p className="text-xs font-bold text-sky-300/80 animate-pulse">
              Match starting in seconds...
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 5: LIVE CARROM DISC POOL GAMEPLAY                */}
      {/* ======================================================== */}
      {screen === 'playing' && (
        <div className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-between items-center px-2 py-1.5 sm:py-2 overflow-hidden select-none">
          
          {/* 1. OPPONENT BAR (TOP) */}
          <div className="w-full bg-[#07192e]/90 backdrop-blur-md rounded-2xl px-3 py-2 border border-sky-500/30 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 border-2 border-sky-400/50 shadow-md">
                {opponent.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-white truncate max-w-[130px] sm:max-w-[180px]">
                    {opponent.name}
                  </span>
                  {opponent.isAi && (
                    <span className="text-[9px] font-black bg-sky-500/30 text-sky-300 border border-sky-400/40 px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                      AI BOT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-300 font-bold">
                  <span>Pucks:</span>
                  <span className="font-black text-sky-400">⚫ {p2PucksLeft} remaining</span>
                </div>
              </div>
            </div>

            {currentTurn === opponent.role ? (
              <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full text-xs font-black animate-pulse shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{turnTimeLeft}s</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                WAITING
              </div>
            )}
          </div>

          {/* 2. TURN PROMPT BANNER */}
          <div className="w-full flex items-center justify-between px-2 py-1 shrink-0">
            <div className="flex items-center gap-1.5">
              {currentTurn === playerUser.role ? (
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-[#a3e635] border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                  <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-ping inline-block" />
                  YOUR TURN • AIM &amp; STRIKE
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                  OPPONENT IS AIMING...
                </span>
              )}
            </div>

            {dragPower > 0 && currentTurn === playerUser.role && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-sky-400/30">
                <span className="text-[10px] font-black text-amber-300">POWER</span>
                <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      dragPower > 70 ? 'bg-rose-500' : dragPower > 40 ? 'bg-amber-400' : 'bg-[#a3e635]'
                    }`}
                    style={{ width: `${dragPower}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-white">{dragPower}%</span>
              </div>
            )}
          </div>

          {/* 3. CARROM BOARD CANVAS CONTAINER */}
          <div className="relative flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden">
            <div
              className="relative aspect-square rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.85)] border-4 border-[#2b1607] touch-none select-none"
              style={{
                maxHeight: 'min(520px, calc(100dvh - 235px))',
                maxWidth: 'min(520px, calc(100vw - 16px))',
                width: 'min(520px, calc(100dvh - 235px), calc(100vw - 16px))',
                height: 'min(520px, calc(100dvh - 235px), calc(100vw - 16px))',
              }}
            >
              <canvas
                ref={canvasRef}
                width={BOARD_SIZE}
                height={BOARD_SIZE}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="w-full h-full cursor-crosshair block"
                style={{ touchAction: 'none' }}
              />

              {/* In-canvas Guidance Overlay */}
              {currentTurn === playerUser.role && !isPhysicsActive && dragPower === 0 && (
                <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
                  <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-white/10">
                    👆 Drag striker backwards to aim &amp; release
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4. BASELINE SLIDER */}
          <div className="w-full bg-[#07192e]/90 backdrop-blur-md rounded-2xl px-3 py-2 border border-sky-500/30 my-1 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-sky-200/90 mb-1">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-[#a3e635]" />
                <span>Position Striker</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400">
                {currentTurn === playerUser.role && !isPhysicsActive ? 'Drag horizontally' : 'Locked'}
              </span>
            </div>

            <input
              type="range"
              min={BASELINE_MIN_X}
              max={BASELINE_MAX_X}
              value={strikerBaselineX}
              onChange={(e) => handleBaselineChange(Number(e.target.value))}
              disabled={currentTurn !== playerUser.role || isPhysicsActive}
              className="w-full h-2.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#a3e635] disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>

          {/* 5. PLAYER BAR (BOTTOM) */}
          <div className="w-full bg-[#07192e]/90 backdrop-blur-md rounded-2xl px-3 py-2 border border-emerald-500/40 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#a3e635] text-[#06182e] font-black text-xs flex items-center justify-center shrink-0 border-2 border-emerald-400 shadow-md">
                {playerUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-white truncate max-w-[130px] sm:max-w-[180px]">
                    {playerUser.name}
                  </span>
                  <span className="text-[9px] font-black bg-emerald-500/30 text-[#a3e635] border border-emerald-400/40 px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                    YOU
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-300 font-bold">
                  <span>Your Pucks:</span>
                  <span className="font-black text-[#a3e635]">⚪ {p1PucksLeft} remaining</span>
                </div>
              </div>
            </div>

            {currentTurn === playerUser.role ? (
              <div className="flex items-center gap-1 bg-emerald-500/20 text-[#a3e635] border border-emerald-400/40 px-2.5 py-1 rounded-full text-xs font-black animate-pulse shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{turnTimeLeft}s</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">
                WAITING
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 6: RESULTS & REWARD SCREEN                       */}
      {/* ======================================================== */}
      {screen === 'results' && (
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center items-center px-4 py-4 overflow-y-auto no-scrollbar">
          <div className="w-full bg-[#07192e]/95 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-sky-500/40 text-center space-y-4 animate-scale-up">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md border ${
              matchResult === 'WON'
                ? 'bg-amber-500/20 text-amber-400 border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-white/10 text-gray-400 border-white/20'
            }`}>
              <Trophy className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                matchResult === 'WON'
                  ? 'bg-emerald-500/20 text-[#a3e635] border-emerald-500/40'
                  : 'bg-white/10 text-gray-300 border-white/20'
              }`}>
                {matchResult === 'WON' ? 'MATCH VICTORY!' : 'MATCH DEFEAT'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {matchResult === 'WON' ? `You Won ${selectedTier * 2} Points!` : 'Better Luck Next Time!'}
              </h2>
              <p className="text-xs text-sky-100/70 font-medium">
                {matchResult === 'WON'
                  ? `Net Profit: +${selectedTier} Points credited to your account!`
                  : `-${selectedTier} Points deducted according to match stake.`}
              </p>
            </div>

            {/* Match Stats */}
            <div className="bg-[#021324]/80 rounded-2xl p-3 border border-sky-500/20 grid grid-cols-2 gap-3 text-left text-xs">
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase">Match Stake</p>
                <p className="text-base font-black text-white">{selectedTier} PTS</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase">Points Balance</p>
                <p className="text-base font-black text-[#a3e635]">{availablePoints} PTS</p>
              </div>
            </div>

            {/* Champion Voucher */}
            {earnedCoupon && (
              <div className="bg-gradient-to-br from-sky-600 to-blue-700 text-white rounded-2xl p-3.5 shadow-md space-y-1.5 text-left border border-sky-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded-full">
                    CHAMPION VOUCHER
                  </span>
                  <span className="text-xs font-black">{earnedCoupon.discount}</span>
                </div>
                <h4 className="font-extrabold text-xs">{earnedCoupon.title}</h4>
                <p className="text-[10px] text-sky-100/80">{earnedCoupon.desc}</p>
                
                <div className="flex items-center justify-between bg-black/30 rounded-xl p-2 mt-1">
                  <span className="font-mono font-bold text-xs tracking-wider">{earnedCoupon.code}</span>
                  <button
                    onClick={() => handleCopyCoupon(earnedCoupon.code)}
                    className="bg-white hover:bg-sky-100 text-sky-950 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCoupon === earnedCoupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
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
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setScreen('tier_select')}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3 rounded-full text-xs shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY ANOTHER MATCH</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to="/play-and-win"
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-extrabold py-2 rounded-full text-xs text-center border border-white/15 transition-colors"
                >
                  All Games
                </Link>

                <Link
                  to="/shop"
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-[#a3e635] font-extrabold py-2 rounded-full text-xs text-center border border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Store</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FORFEIT / EXIT CONFIRMATION MODAL --- */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#07192e] text-white rounded-3xl max-w-sm w-full p-5 border border-sky-500/40 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Forfeit &amp; Leave Match?</h3>
              <p className="text-xs text-sky-100/70">
                Leaving now will forfeit this match. Your <strong className="text-amber-400">{selectedTier} PTS</strong> stake will not be refunded.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full bg-[#a3e635] hover:bg-lime-400 text-[#06182e] font-black py-2.5 rounded-full text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                Stay &amp; Play
              </button>
              <button
                onClick={handleConfirmExit}
                className="w-full bg-white/10 hover:bg-rose-600/80 text-white hover:text-white font-bold py-2 rounded-full text-xs cursor-pointer transition-all border border-white/15"
              >
                Forfeit &amp; Exit to Play &amp; Win
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RULES & HOW TO PLAY MODAL --- */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#07192e] text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-sky-500/40 animate-scale-up">
            <div className="bg-gradient-to-r from-sky-700 to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-sky-600/40">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-300" />
                <h3 className="font-black text-base sm:text-lg">Carroms Disc Pool Rules</h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs text-sky-100/90 leading-relaxed max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">1</span>
                <div>
                  <p className="font-black text-white">Assigned Pucks</p>
                  <p className="text-sky-100/70 mt-0.5">Player 1 pockets <strong className="text-[#a3e635]">White Pucks</strong>. Player 2 pockets <strong className="text-sky-400">Black Pucks</strong>. First player to pocket all assigned pucks wins!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">2</span>
                <div>
                  <p className="font-black text-white">Extra Turns</p>
                  <p className="text-sky-100/70 mt-0.5">If you pocket your own puck or the Red Queen, you get an <strong className="text-amber-300">Extra Shot</strong>! If you miss or foul, turn passes to opponent.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-xs">3</span>
                <div>
                  <p className="font-black text-white">Points &amp; Stakes</p>
                  <p className="text-sky-100/70 mt-0.5">Select from 50, 100, 500, 1,000 or 5,000 Points. Winner takes the full <strong className="text-amber-300">2x Prize Pool</strong>!</p>
                </div>
              </div>

              <button
                onClick={() => setShowHowToPlay(false)}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black py-3 rounded-full text-xs shadow-md cursor-pointer transition-all active:scale-95"
              >
                GOT IT, LET'S PLAY!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
