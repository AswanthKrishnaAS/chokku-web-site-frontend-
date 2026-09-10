import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gift,
  Trophy,
  Play,
  RotateCw,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  ShoppingBag,
  Gamepad2,
  Clock,
  Star
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGameSettings } from '../context/GameSettingsContext';
import { MyGifts } from '../components/MyGifts';
import gami1 from '../assets/img/gami1.png';
import gameboy from '../assets/img/gameboy.png';
import gamebgm from '../assets/img/gamebgm.png';

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

interface FallingItem {
  id: number;
  x: number; // Percentage 5% to 90%
  y: number; // Percentage -10% to 105%
  speed: number;
  type: 'standard' | 'gold' | 'gem' | 'bomb';
  points: number;
  icon: string;
  color: string;
}

export const CatchtheGift: React.FC = () => {
  const { addToast } = useToast();
  const { customerUser, fetchCustomerPoints } = useAuth();
  const { catchTheGiftSettings } = useGameSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Admin Dashboard Test Play Mode indicator
  const isTestMode = searchParams.get('testMode') === 'true';

  // REQUIREMENT: Login Protection (Exempt during Admin Test Play Mode)
  useEffect(() => {
    if (!customerUser && !isTestMode) {
      addToast('Login Required', 'Please login to access Catch the Gift and save your game scores!', 'warning');
      navigate('/login', { state: { from: '/catch-the-gift' } });
    }
  }, [customerUser, isTestMode, navigate]);

  // Game Core States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('catch_gift_high_score');
    return saved ? parseInt(saved, 10) : 40;
  });
  const [timeLeft, setTimeLeft] = useState(catchTheGiftSettings.gameDuration || 25);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Basket position state (in percentage 10% to 90%)
  const [basketPos, setBasketPos] = useState(50);
  const [isStationary, setIsStationary] = useState(false);
  const lastMoveTimeRef = useRef<number>(Date.now());
  const [items, setItems] = useState<FallingItem[]>([]);
  const [catchParticles, setCatchParticles] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);

  // Track basket movement to reset stationary timer
  useEffect(() => {
    if (gameState === 'playing') {
      lastMoveTimeRef.current = Date.now();
      setIsStationary(false);
    }
  }, [basketPos, gameState]);

  // Saved coupons state
  const [myCoupons, setMyCoupons] = useState<CouponItem[]>(() => {
    const saved = localStorage.getItem('chokku_my_coupons');
    return saved ? JSON.parse(saved) : [];
  });

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Save high score to localStorage
  useEffect(() => {
    localStorage.setItem('catch_gift_high_score', highScore.toString());
  }, [highScore]);

  // Save coupons to localStorage
  useEffect(() => {
    localStorage.setItem('chokku_my_coupons', JSON.stringify(myCoupons));
  }, [myCoupons]);

  // Web Audio Synthesized Sound Generator
  const playAudio = (type: 'catch' | 'gold' | 'bomb' | 'gameover' | 'start') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'gold') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  };

  // Keyboard controls: Bucket stays fixed until user presses keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setBasketPos((prev) => Math.max(10, prev - 10));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setBasketPos((prev) => Math.min(90, prev + 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start Game
  const startGame = () => {
    playAudio('start');
    setScore(0);
    setTimeLeft(catchTheGiftSettings.gameDuration || 25);
    setCombo(0);
    setMaxCombo(0);
    setItems([]);
    setCatchParticles([]);
    setBasketPos(50);
    lastMoveTimeRef.current = Date.now();
    setIsStationary(false);
    setGameState('playing');
  };

  const basketPosRef = useRef(basketPos);
  useEffect(() => {
    basketPosRef.current = basketPos;
  }, [basketPos]);

  const startTimeRef = useRef<number>(0);
  const durationMsRef = useRef<number>(25000);
  const itemDeckRef = useRef<Array<{ type: 'standard' | 'gold' | 'bomb'; points: number; icon: string; color: string; speed: number }>>([]);

  // Main Game Loop (Real Clock Elapsed-Time Countdown & Scheduled Spawning)
  useEffect(() => {
    let spawnInterval: any;

    if (gameState === 'playing') {
      const durationSec = Math.max(5, catchTheGiftSettings.gameDuration || 25);
      const totalDurationMs = durationSec * 1000;
      
      startTimeRef.current = Date.now();
      durationMsRef.current = totalDurationMs;

      // 1. Build Exact Item Deck from Admin Settings
      const giftCount = Math.max(1, catchTheGiftSettings.giftBoxCount || catchTheGiftSettings.giftCount || 5);
      const coinCount = Math.max(0, catchTheGiftSettings.coinCount !== undefined ? catchTheGiftSettings.coinCount : 10);
      const bombCount = Math.max(0, catchTheGiftSettings.bombCount !== undefined ? catchTheGiftSettings.bombCount : 3);

      const giftSpeed = catchTheGiftSettings.giftSpeed || 1.5;
      const coinSpeed = catchTheGiftSettings.coinSpeed || 2.0;
      const bombSpeed = catchTheGiftSettings.bombSpeed || 2.2;
      const pointsPerCoin = catchTheGiftSettings.pointsPerCoin || 10;
      const pointsLossPerBomb = catchTheGiftSettings.pointsLossPerBomb || 20;

      const deck: Array<{ type: 'standard' | 'gold' | 'bomb'; points: number; icon: string; color: string; speed: number }> = [];

      for (let i = 0; i < giftCount; i++) {
        deck.push({
          type: 'standard',
          points: 10,
          icon: '🎁',
          color: 'from-emerald-400 to-green-600',
          speed: giftSpeed,
        });
      }

      for (let i = 0; i < coinCount; i++) {
        deck.push({
          type: 'gold',
          points: pointsPerCoin,
          icon: '🪙',
          color: 'from-amber-400 to-yellow-500',
          speed: coinSpeed,
        });
      }

      for (let i = 0; i < bombCount; i++) {
        deck.push({
          type: 'bomb',
          points: -pointsLossPerBomb,
          icon: '💣',
          color: 'from-rose-500 to-red-700',
          speed: bombSpeed,
        });
      }

      // Shuffle deck randomly
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      itemDeckRef.current = deck;

      // 2. Schedule Item Spawning evenly over 85% of total duration (leaving buffer at end)
      const activeSpawningMs = Math.max(2000, totalDurationMs - 2500);
      const totalItemsCount = deck.length;
      const spawnIntervalMs = totalItemsCount > 0 ? Math.max(300, Math.floor(activeSpawningMs / totalItemsCount)) : 1000;

      spawnInterval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= activeSpawningMs || itemDeckRef.current.length === 0) {
          clearInterval(spawnInterval);
          return;
        }

        const isStationaryNow = Date.now() - lastMoveTimeRef.current > 1000;
        setIsStationary(isStationaryNow);

        const scheduledItem = itemDeckRef.current.shift();
        if (!scheduledItem) return;

        let type = scheduledItem.type;
        let points = scheduledItem.points;
        let icon = scheduledItem.icon;
        let color = scheduledItem.color;
        let baseSpeed = scheduledItem.speed;

        let randomX = Math.floor(Math.random() * 80) + 10;
        const currentBasketX = basketPosRef.current;

        // RULE: If basket remains in one position for > 1 sec:
        // Non-bomb items must NOT fall on stationary basket position!
        if (isStationaryNow) {
          const isTargetingBasket = Math.abs(randomX - currentBasketX) <= 16;
          if (isTargetingBasket && type !== 'bomb') {
            type = 'bomb';
            points = -pointsLossPerBomb;
            icon = '💣';
            color = 'from-rose-500 to-red-700';
            baseSpeed = bombSpeed;
          }
        }

        const randomSpeed = Math.max(0.5, baseSpeed * (0.95 + Math.random() * 0.1));

        const newItem: FallingItem = {
          id: Date.now() + Math.random(),
          x: randomX,
          y: -10,
          speed: randomSpeed,
          type,
          points,
          icon,
          color,
        };

        setItems((prev) => [...prev.slice(-25), newItem]);
      }, spawnIntervalMs);

      // 3. Real-Time Frame Loop: Computes exact Date.now() clock elapsed time
      const updatePositions = () => {
        const now = Date.now();
        const elapsedMs = now - startTimeRef.current;
        const remainingSec = Math.max(0, Math.ceil((durationMsRef.current - elapsedMs) / 1000));
        
        setTimeLeft(remainingSec);

        // STRICT CUTOFF: Exactly when real elapsed time reaches gameDuration, stop everything!
        if (elapsedMs >= durationMsRef.current) {
          clearInterval(spawnInterval);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          endGame();
          return;
        }

        const isStationaryNow = now - lastMoveTimeRef.current > 1000;
        setIsStationary(isStationaryNow);

        const currentBasketX = basketPosRef.current;

        setItems((prevItems) => {
          const nextItems: FallingItem[] = [];

          prevItems.forEach((item) => {
            const nextY = item.y + item.speed;

            let itemToProcess = item;
            const isInBasketColumn = Math.abs(item.x - currentBasketX) <= 16;

            if (isStationaryNow && isInBasketColumn && item.type !== 'bomb') {
              itemToProcess = {
                ...item,
                type: 'bomb',
                points: -(catchTheGiftSettings.pointsLossPerBomb || 20),
                icon: '💣',
                color: 'from-rose-500 to-red-700',
              };
            }

            // Collision check with basket
            const isInBasketY = nextY >= 70 && nextY <= 95;
            const isInBasketX = Math.abs(itemToProcess.x - currentBasketX) <= 16;

            if (isInBasketY && isInBasketX) {
              triggerCatch(itemToProcess.id, itemToProcess.x, itemToProcess.y, itemToProcess.points, itemToProcess.type);
            } else if (nextY < 100) {
              nextItems.push({ ...itemToProcess, y: nextY });
            } else {
              if (itemToProcess.type !== 'bomb') {
                setCombo(0);
              }
            }
          });

          return nextItems;
        });

        animFrameRef.current = requestAnimationFrame(updatePositions);
      };

      animFrameRef.current = requestAnimationFrame(updatePositions);
    }

    return () => {
      if (spawnInterval) clearInterval(spawnInterval);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState]);

  const itemStatsRef = useRef({ gifts: 0, coins: 0, specialGifts: 0, bombs: 0 });

  // Handle Catching an Item
  const triggerCatch = (id: number, x: number, y: number, points: number, type: string) => {
    if (type === 'bomb') {
      itemStatsRef.current.bombs += 1;
      playAudio('bomb');
      setCombo(0);
      const pointsLoss = Math.abs(catchTheGiftSettings.pointsLossPerBomb !== undefined ? catchTheGiftSettings.pointsLossPerBomb : 20);
      setScore((prev) => Math.max(0, prev - pointsLoss));
      addParticle(x, y, `-${pointsLoss} PTS!`, 'text-rose-400 font-extrabold');
    } else {
      let earnedPts = points;
      if (type === 'gold') {
        itemStatsRef.current.coins += 1;
        playAudio('gold');
        earnedPts = catchTheGiftSettings.pointsPerCoin !== undefined ? catchTheGiftSettings.pointsPerCoin : 10;
      } else {
        itemStatsRef.current.gifts += 1;
        playAudio('catch');
        earnedPts = 10;
      }

      setCombo((prevCombo) => {
        const nextCombo = prevCombo + 1;
        setMaxCombo((prevMax) => Math.max(prevMax, nextCombo));

        const multiplier = nextCombo >= 5 ? 2 : 1;
        const totalPoints = earnedPts * multiplier;

        setScore((prevScore) => {
          const newScore = prevScore + totalPoints;
          setHighScore((prevHigh) => Math.max(prevHigh, newScore));
          return newScore;
        });

        const label = multiplier > 1 ? `+${totalPoints} (${multiplier}x Combo!)` : `+${totalPoints}`;
        addParticle(x, y, label, type === 'gold' ? 'text-amber-300' : 'text-emerald-300');

        return nextCombo;
      });
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Direct Tap on falling item
  const handleItemTap = (e: React.MouseEvent | React.TouchEvent, item: FallingItem) => {
    e.stopPropagation();
    triggerCatch(item.id, item.x, item.y, item.points, item.type);
  };

  // Add Floating Text Particle
  const addParticle = (x: number, y: number, text: string, color: string) => {
    const pId = Date.now() + Math.random();
    setCatchParticles((prev) => [...prev, { id: pId, x, y, text, color }]);
    setTimeout(() => {
      setCatchParticles((prev) => prev.filter((p) => p.id !== pId));
    }, 800);
  };

  // Submit Authenticated Customer Score to Backend MongoDB (Skipped in Admin Test Mode)
  const submitScoreToBackend = async (finalScore: number) => {
    if (isTestMode) {
      console.log('🧪 Admin Test Mode: Game score submission skipped.');
      addToast('🧪 Test Play Mode', 'Admin Test Run: Scores are not saved to customer profile.', 'info');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const payload = {
        score: finalScore,
        giftsCollected: itemStatsRef.current.gifts,
        coinsCollected: itemStatsRef.current.coins,
        specialGiftsCollected: itemStatsRef.current.specialGifts,
        bombsHit: itemStatsRef.current.bombs,
      };

      const res = await fetch(`${API_URL}/catch-game/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        console.log('✅ Customer game score saved to database:', data);
        fetchCustomerPoints(); // Automatically refresh Navbar & Profile points
      }
    } catch (err) {
      console.error('Failed submitting game score to backend server:', err);
    }
  };

  // End Game
  const endGame = () => {
    playAudio('gameover');
    setGameState('gameover');

    // Save Customer Game Score & Stats securely to Backend API (unless test mode)
    setScore((currentScore) => {
      submitScoreToBackend(currentScore);
      return currentScore;
    });

    // Generate coupon reward if score >= 30 (Exempt in Admin Test Play Mode)
    if (score >= 30 && !isTestMode) {
      const code = `GIFT${Math.min(score, 500)}`;
      const discountVal = score >= 150 ? '₹150 OFF' : score >= 80 ? '₹100 OFF' : '₹50 OFF';

      const newCoupon: CouponItem = {
        id: `c-catch-${Date.now()}`,
        code,
        discount: discountVal,
        title: 'Catch The Gift Fever Voucher',
        desc: `Unlocked with a score of ${score} PTS!`,
        expiry: 'Valid for 7 days',
        color: 'from-emerald-500 to-teal-600',
        badge: 'GAME WINNER'
      };

      setMyCoupons((prev) => {
        if (!prev.some((c) => c.code === code)) {
          addToast('🎉 REWARD UNLOCKED!', `Earned ${discountVal} coupon code ${code}!`, 'success');
          return [newCoupon, ...prev];
        }
        return prev;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf5] font-sans antialiased text-gray-800 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 pb-16 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-4">

        {/* ADMIN TEST MODE BANNER */}
        {isTestMode && (
          <div className="bg-amber-500 text-white rounded-2xl p-3 px-4 shadow-md flex items-center justify-between text-xs font-black animate-pulse">
            <div className="flex items-center gap-2">
              <span className="bg-white text-amber-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                🧪 ADMIN TEST MODE
              </span>
              <span className="text-amber-50 font-bold">Previewing game settings — Points & vouchers will NOT be saved to customer accounts.</span>
            </div>
            <Link to="/admin" className="underline text-amber-100 hover:text-white font-extrabold text-[11px] shrink-0 ml-2">
              Return to Admin
            </Link>
          </div>
        )}

        {/* TOP CONTROLS BAR: Back Button, Play Button, Sound On/Off Button */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-100 shadow-2xs flex items-center justify-between gap-2">
          
          {/* 1. Back Button */}
          <Link
            to="/play-and-win"
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all cursor-pointer border border-gray-200/80"
          >
            <ArrowLeft className="w-4 h-4 text-[#488710]" />
            <span>Back</span>
          </Link>

          {/* 2. Play Button */}
          <button
            onClick={startGame}
            className="inline-flex items-center gap-2 bg-[#488710] hover:bg-[#386b0c] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Game</span>
          </button>

          {/* 3. Sound On/Off Button */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all cursor-pointer border border-gray-200/80"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#488710]" />
                <span className="hidden xs:inline">Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-500" />
                <span className="hidden xs:inline">Sound OFF</span>
              </>
            )}
          </button>

        </div>

        {/* FLOATING HUD STATS BAR */}
        <div className="bg-white rounded-3xl p-3 border border-gray-100 shadow-2xs flex items-center justify-around text-slate-800 text-xs sm:text-sm font-black">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px]">Score:</span>
            <span className="text-[#488710] text-base sm:text-lg font-black">{score}</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px]">Time:</span>
            <span className="text-sky-600 text-base sm:text-lg font-black">{timeLeft}s</span>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px]">Combo:</span>
            <span className="text-purple-600 text-base sm:text-lg font-black">{combo}x</span>
          </div>

          <div className="h-4 w-px bg-gray-200 hidden xs:block" />

          <div className="hidden xs:flex items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px]">Best:</span>
            <span className="text-amber-500 text-base sm:text-lg font-black">{highScore}</span>
          </div>
        </div>

        {/* DEFAULT PRE-GAME CARD (IDLE STATE) */}
        <div className="bg-gradient-to-br from-[#386b0c] via-[#488710] to-[#0084d1] border-2 border-emerald-300/80 rounded-3xl shadow-xl p-8 text-center text-white space-y-5">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 mx-auto flex items-center justify-center shadow-lg animate-bounce">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#488710] to-[#0084d1] flex items-center justify-center text-white shadow-md">
              <Gift className="w-7 h-7" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-2xl font-black text-white tracking-wide">Catch the Gift</h3>
            <p className="text-xs text-sky-100 font-medium leading-relaxed">
              Move your basket or tap falling gifts to collect points in <span className="font-bold text-amber-300">{catchTheGiftSettings.gameDuration} seconds</span>!
            </p>
          </div>

          <button
            onClick={startGame}
            className="bg-white hover:bg-emerald-50 text-[#386b0c] font-black px-8 py-3.5 rounded-full text-base shadow-xl inline-flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 border border-white"
          >
            <Play className="w-5 h-5 fill-[#386b0c]" />
            <span>START GAME NOW</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN MOBILE RESPONSIVE GAME VIEW MATCHING REFERENCE MOCKUP */}
      {/* ========================================================================= */}
      {(gameState === 'playing' || gameState === 'gameover') && (
        <div
          ref={gameAreaRef}
          style={{
            backgroundImage: `url(${gamebgm})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          className="fixed inset-0 z-[100] flex flex-col justify-between p-3 sm:p-5 text-white overflow-hidden touch-none select-none"
        >
          {/* TOP CONTROLS ROW & BRAND HEADER */}
          <div className="space-y-2 relative z-30 pt-1">
            <div className="flex items-center justify-between gap-2 px-1">
              {/* Back / Pause Icon */}
              <button
                onClick={() => setGameState('idle')}
                className="w-10 h-10 rounded-full bg-white text-[#386b0c] hover:bg-emerald-50 flex items-center justify-center shadow-lg font-black cursor-pointer transition-transform hover:scale-105"
                title="Pause / Back"
              >
                <ArrowLeft className="w-5 h-5 text-[#386b0c]" />
              </button>

              {/* Game Title */}
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/40 shadow-xs">
                <Gift className="w-5 h-5 text-amber-300 fill-amber-300" />
                <h2 className="text-sm sm:text-base font-black tracking-tight uppercase text-white drop-shadow-xs">
                  CATCH THE GIFT
                </h2>
              </div>

              {/* Sound Toggle Icon */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-10 h-10 rounded-full bg-white text-[#386b0c] hover:bg-emerald-50 flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105"
                title="Sound Toggle"
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-[#386b0c]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-rose-500" />
                )}
              </button>
            </div>

            {/* TOP HUD BAR: TIME LEFT (LEFT) vs SCORE (RIGHT) */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto px-1">
              {/* TIME LEFT HUD CARD */}
              <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-lg border border-emerald-100 flex items-center gap-2 text-slate-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#386b0c] flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">TIME LEFT</p>
                  <p className="text-base sm:text-lg font-black text-[#386b0c] leading-none">{timeLeft}s</p>
                </div>
              </div>

              {/* SCORE HUD CARD */}
              <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-lg border border-emerald-100 flex items-center gap-2 text-slate-800 justify-end">
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-gray-500 tracking-wider">SCORE</p>
                  <p className="text-base sm:text-lg font-black text-[#386b0c] leading-none">{score}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-4.5 h-4.5 fill-amber-400" />
                </div>
              </div>
            </div>

            {/* REWARD MILESTONES BAR */}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/30 max-w-md mx-auto grid grid-cols-4 gap-1 text-center text-white">
              <div className="bg-white/10 rounded-xl p-1">
                <Gift className="w-4 h-4 mx-auto text-amber-300" />
                <p className="text-[10px] font-black">50+</p>
                <p className="text-[8px] opacity-90">5% OFF</p>
              </div>

              <div className="bg-white/10 rounded-xl p-1">
                <Gift className="w-4 h-4 mx-auto text-amber-300" />
                <p className="text-[10px] font-black">100+</p>
                <p className="text-[8px] opacity-90">10% OFF</p>
              </div>

              <div className="bg-white/10 rounded-xl p-1">
                <Gift className="w-4 h-4 mx-auto text-amber-300" />
                <p className="text-[10px] font-black">150+</p>
                <p className="text-[8px] opacity-90">15% OFF</p>
              </div>

              <div className="bg-white/10 rounded-xl p-1">
                <Gift className="w-4 h-4 mx-auto text-amber-300" />
                <p className="text-[10px] font-black">200+</p>
                <p className="text-[8px] opacity-90">20% OFF</p>
              </div>
            </div>
          </div>

          {/* PLAYING CANVAS AREA */}
          <div
            onPointerDown={(e) => {
              if (gameState !== 'playing' || !gameAreaRef.current) return;
              const rect = gameAreaRef.current.getBoundingClientRect();
              const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
              setBasketPos(Math.max(10, Math.min(90, relativeX)));
            }}
            onPointerMove={(e) => {
              if (gameState !== 'playing' || e.buttons !== 1 || !gameAreaRef.current) return;
              const rect = gameAreaRef.current.getBoundingClientRect();
              const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
              setBasketPos(Math.max(10, Math.min(90, relativeX)));
            }}
            className="relative w-full flex-1 my-1 overflow-hidden cursor-pointer"
          >
            {/* Floating Catch Particles */}
            {catchParticles.map((p) => (
              <div
                key={p.id}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={`absolute font-black text-base sm:text-lg animate-bounce transition-all z-20 pointer-events-none ${p.color}`}
              >
                {p.text}
              </div>
            ))}

            {/* Falling Gift Items */}
            {items.map((item) => (
              <div
                key={item.id}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute transform -translate-x-1/2 pointer-events-none z-10"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} shadow-xl border border-white/40 flex items-center justify-center text-2xl sm:text-3xl animate-pulse`}>
                  {item.icon}
                </div>
              </div>
            ))}

            {/* Monkey Basket Character (gameboy.png) */}
            <div
              style={{ left: `${basketPos}%` }}
              className="absolute bottom-1 transform -translate-x-1/2 transition-all duration-75 z-20 w-max max-w-none pointer-events-none shrink-0"
            >
              {gameState === 'playing' && isStationary && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-rose-600/95 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-xl border border-rose-300 animate-bounce whitespace-nowrap z-30 flex items-center gap-1">
                  <span>💣</span>
                  <span>Stationary! Move to get gifts</span>
                </div>
              )}
              <img
                src={gameboy}
                alt="Green Monkey Basket"
                className={`w-44 xs:w-52 sm:w-64 md:w-72 max-w-none h-auto object-contain drop-shadow-2xl shrink-0 ${
                  isStationary ? 'drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]' : ''
                }`}
              />
            </div>
          </div>

          {/* ON-SCREEN NAVIGATION ARROWS (LEFT & RIGHT) */}
          <div className="absolute bottom-16 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
            <button
              onClick={() => setBasketPos((prev) => Math.max(10, prev - 10))}
              className="w-12 h-12 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-md text-white border border-white/50 flex items-center justify-center shadow-lg pointer-events-auto cursor-pointer transition-transform hover:scale-110 active:scale-95"
              title="Move Left"
            >
              <ArrowLeft className="w-6 h-6 stroke-[3]" />
            </button>

            <button
              onClick={() => setBasketPos((prev) => Math.min(90, prev + 10))}
              className="w-12 h-12 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-md text-white border border-white/50 flex items-center justify-center shadow-lg pointer-events-auto cursor-pointer transition-transform hover:scale-110 active:scale-95"
              title="Move Right"
            >
              <ArrowLeft className="w-6 h-6 stroke-[3] rotate-180" />
            </button>
          </div>

          {/* BOTTOM GOAL PROGRESS BAR CARD */}
          <div className="relative z-30 bg-white rounded-2xl p-2.5 sm:p-3 shadow-xl border border-emerald-100 flex items-center justify-between gap-2 max-w-md mx-auto w-full text-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#386b0c] flex items-center justify-center shrink-0">
                <Gift className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-900 leading-tight">CATCH MORE GIFTS</p>
                <p className="text-[9px] font-extrabold text-[#386b0c] leading-none">EARN MORE REWARDS!</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 min-w-[100px]">
              <span className="text-xs font-black text-[#386b0c]">{score} / 150</span>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-lime-400 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (score / 150) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* TIME OVER MODAL OVERLAY */}
          {gameState === 'gameover' && (
            <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400 shadow-2xl animate-pulse">
                <Clock className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">TIME OVER!</h3>
                <p className="text-xs sm:text-sm text-emerald-200 font-medium">Your {catchTheGiftSettings.gameDuration}-second catch challenge has ended</p>
              </div>

              {/* Stats Box */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/15 w-full max-w-xs grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">SCORE</p>
                  <p className="text-xl font-black text-amber-300">{score} PTS</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">GIFTS</p>
                  <p className="text-xl font-black text-emerald-300">🎁 {itemStatsRef.current.gifts}</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">COMBO</p>
                  <p className="text-xl font-black text-cyan-300">{maxCombo}X</p>
                </div>
              </div>

              {/* Open Caught Gifts Button */}
              {itemStatsRef.current.gifts > 0 && (
                <div className="bg-gradient-to-r from-amber-500/30 via-emerald-500/30 to-teal-500/30 border border-amber-400/50 rounded-2xl p-3.5 max-w-xs text-center space-y-2 w-full">
                  <div className="flex items-center justify-center gap-1.5 text-amber-300 font-black text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>{itemStatsRef.current.gifts} GIFT BOX{itemStatsRef.current.gifts > 1 ? 'ES' : ''} SAVED TO YOUR ACCOUNT!</span>
                  </div>
                  <button
                    onClick={() => {
                      setGameState('idle');
                      setTimeout(() => {
                        const giftsElem = document.getElementById('my-gifts-section');
                        if (giftsElem) giftsElem.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🎁 OPEN YOUR CAUGHT GIFTS NOW</span>
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={startGame}
                  className="bg-[#386b0c] hover:bg-[#2c5309] text-white font-black px-6 py-2.5 rounded-full text-xs shadow-xl flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 border border-white/40"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>PLAY AGAIN</span>
                </button>

                <button
                  onClick={() => setGameState('idle')}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-md flex items-center gap-2 cursor-pointer border border-white/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>EXIT GAME</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY GIFTS UNBOXING & REWARDS SECTION */}
      <div id="my-gifts-section" className="max-w-4xl w-full pt-4">
        <MyGifts />
      </div>
    </div>
  );
};
