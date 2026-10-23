import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Star,
  Film,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGameSettings } from '../context/GameSettingsContext';
import { safeFetch } from '../utils/api';
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

  // Basket position state (in percentage 8% to 92%)
  const [basketPos, setBasketPos] = useState(50);
  const [isStationary, setIsStationary] = useState(false);
  const [isActivelyMoving, setIsActivelyMoving] = useState(false);
  const basketPosRef = useRef(basketPos);
  const lastMoveTimeRef = useRef<number>(Date.now());
  const moveDirectionRef = useRef<'left' | 'right' | null>(null);
  const moveAnimFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [catchParticles, setCatchParticles] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);

  // Keep basketPosRef in sync with basketPos state
  useEffect(() => {
    basketPosRef.current = basketPos;
  }, [basketPos]);

  // Track basket movement to reset stationary timer
  useEffect(() => {
    if (gameState === 'playing') {
      lastMoveTimeRef.current = Date.now();
      setIsStationary(false);
    }
  }, [basketPos, gameState]);

  // 24-Hour Replay Restriction & Ad Video State
  const userIdKey = customerUser?.id || (customerUser as any)?._id || 'guest';
  const [lastPlayedTime, setLastPlayedTime] = useState<number>(() => {
    const saved = localStorage.getItem(`catch_gift_last_played_${userIdKey}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [hasReplayTicket, setHasReplayTicket] = useState<boolean>(() => {
    return localStorage.getItem(`catch_gift_replay_ticket_${userIdKey}`) === 'true';
  });
  const [remainingCooldown, setRemainingCooldown] = useState<number>(0);

  // Ad Video Modal States
  const [showAdModal, setShowAdModal] = useState<boolean>(false);
  const [adTimer, setAdTimer] = useState<number>(10);
  const [adFinished, setAdFinished] = useState<boolean>(false);
  const [showEarlyExitPrompt, setShowEarlyExitPrompt] = useState<boolean>(false);

  // 24h Cooldown duration (86,400,000 ms = 24 hours)
  const COOLDOWN_DURATION_MS = 24 * 60 * 60 * 1000;

  useEffect(() => {
    const checkCooldown = () => {
      if (!lastPlayedTime || isTestMode || hasReplayTicket) {
        setRemainingCooldown(0);
        return;
      }
      const elapsed = Date.now() - lastPlayedTime;
      const remaining = Math.max(0, COOLDOWN_DURATION_MS - elapsed);
      setRemainingCooldown(remaining);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [lastPlayedTime, isTestMode, hasReplayTicket, COOLDOWN_DURATION_MS]);

  const canPlay = isTestMode || hasReplayTicket || remainingCooldown <= 0;

  // Format countdown ms to HHh MMm SSs
  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
      return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${pad(minutes)}m ${pad(seconds)}s`;
  };

  // Ad countdown timer effect
  useEffect(() => {
    let timerInterval: any;
    if (showAdModal && !adFinished && !showEarlyExitPrompt) {
      timerInterval = setInterval(() => {
        setAdTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setAdFinished(true);
            playAudio('gold');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [showAdModal, adFinished, showEarlyExitPrompt]);

  const openAdModal = () => {
    setAdTimer(10);
    setAdFinished(false);
    setShowEarlyExitPrompt(false);
    setShowAdModal(true);
  };

  const handleCloseAd = () => {
    if (adFinished) {
      setShowAdModal(false);
      return;
    }
    setShowEarlyExitPrompt(true);
  };

  const confirmExitAdEarly = () => {
    setShowEarlyExitPrompt(false);
    setShowAdModal(false);
    addToast('Ad Incomplete', 'You must watch the full ad video to earn a replay ticket. Daily 24h wait is active.', 'warning');
  };

  const handlePlayAfterAd = () => {
    setHasReplayTicket(true);
    localStorage.setItem(`catch_gift_replay_ticket_${userIdKey}`, 'true');
    setShowAdModal(false);
    addToast('🎉 Replay Unlocked!', 'Sponsored video watched! Your game replay starts now.', 'success');
    startGame();
  };

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

  // Stop continuous glide
  const stopMove = useCallback(() => {
    moveDirectionRef.current = null;
    if (moveAnimFrameRef.current) {
      cancelAnimationFrame(moveAnimFrameRef.current);
      moveAnimFrameRef.current = null;
    }
    if (!isDraggingRef.current) {
      setIsActivelyMoving(false);
    }
  }, []);

  // Continuous glide step at 60fps
  const stepGlide = useCallback(() => {
    if (!moveDirectionRef.current) return;

    setBasketPos((prev) => {
      const step = 0.95; // ~57% per second glide speed
      let next = prev;
      if (moveDirectionRef.current === 'left') {
        next = Math.max(8, prev - step);
      } else if (moveDirectionRef.current === 'right') {
        next = Math.min(92, prev + step);
      }
      basketPosRef.current = next;
      return next;
    });

    lastMoveTimeRef.current = Date.now();
    setIsStationary(false);

    moveAnimFrameRef.current = requestAnimationFrame(stepGlide);
  }, []);

  // Start continuous glide in a direction (instant tactile response on press + 60fps glide)
  const startMove = useCallback((direction: 'left' | 'right') => {
    if (gameState !== 'playing') return;
    moveDirectionRef.current = direction;
    setIsActivelyMoving(true);
    lastMoveTimeRef.current = Date.now();
    setIsStationary(false);

    // Immediate instant responsive step on press
    setBasketPos((prev) => {
      const initialStep = 2.5;
      const next = direction === 'left' ? Math.max(8, prev - initialStep) : Math.min(92, prev + initialStep);
      basketPosRef.current = next;
      return next;
    });

    if (moveAnimFrameRef.current) {
      cancelAnimationFrame(moveAnimFrameRef.current);
    }
    moveAnimFrameRef.current = requestAnimationFrame(stepGlide);
  }, [gameState, stepGlide]);

  // Direct pointer drag handler for touch and mouse
  const handlePointerDrag = useCallback((clientX: number) => {
    if (gameState !== 'playing' || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(8, Math.min(92, relativeX));
    setBasketPos(clamped);
    basketPosRef.current = clamped;
    lastMoveTimeRef.current = Date.now();
    setIsStationary(false);
  }, [gameState]);

  // Clean up animation frames on unmount or state switch
  useEffect(() => {
    return () => {
      if (moveAnimFrameRef.current) {
        cancelAnimationFrame(moveAnimFrameRef.current);
      }
    };
  }, []);

  // Keyboard controls: Arrow keys and A/D glide smoothly without OS repeat delay
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Prevent stutter from OS repeat interval
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        startMove('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        startMove('right');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
        e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'
      ) {
        stopMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopMove();
    };
  }, [gameState, startMove, stopMove]);

  // Start Game
  const startGame = () => {
    if (!canPlay && !hasReplayTicket && !isTestMode) {
      openAdModal();
      return;
    }

    // If played using an unlocked replay ticket, consume it
    if (hasReplayTicket) {
      setHasReplayTicket(false);
      localStorage.removeItem(`catch_gift_replay_ticket_${userIdKey}`);
    }

    stopMove();
    isDraggingRef.current = false;
    setIsActivelyMoving(false);
    playAudio('start');
    setScore(0);
    setTimeLeft(catchTheGiftSettings.gameDuration || 25);
    setCombo(0);
    setMaxCombo(0);
    setItems([]);
    setCatchParticles([]);
    setBasketPos(50);
    basketPosRef.current = 50;
    lastMoveTimeRef.current = Date.now();
    setIsStationary(false);
    setGameState('playing');
  };

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

        const isStationaryNow = Date.now() - lastMoveTimeRef.current > 2500;
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

        // RULE: If basket remains in one position for > 2.5 sec:
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

        const isStationaryNow = now - lastMoveTimeRef.current > 2500;
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
      const token = localStorage.getItem('chokku_customer_token_v2') || localStorage.getItem('chokku_token') || '';
      const userId = customerUser?.id || (customerUser as any)?._id || '';

      const payload = {
        score: finalScore,
        giftsCollected: itemStatsRef.current.gifts,
        coinsCollected: itemStatsRef.current.coins,
        specialGiftsCollected: itemStatsRef.current.specialGifts,
        bombsHit: itemStatsRef.current.bombs,
      };

      const res = await safeFetch('/catch-game/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok && res.data?.success) {
        console.log('✅ Customer game score saved to database:', res.data);
        fetchCustomerPoints(); // Automatically refresh Navbar & Profile points
      }
    } catch (err) {
      console.error('Failed submitting game score to backend server:', err);
    }
  };

  // End Game
  const endGame = () => {
    stopMove();
    isDraggingRef.current = false;
    setIsActivelyMoving(false);
    playAudio('gameover');
    setGameState('gameover');

    // Save 24-hour replay cooldown timestamp (unless in admin test mode)
    if (!isTestMode) {
      const now = Date.now();
      setLastPlayedTime(now);
      localStorage.setItem(`catch_gift_last_played_${userIdKey}`, now.toString());
      setHasReplayTicket(false);
      localStorage.removeItem(`catch_gift_replay_ticket_${userIdKey}`);
    }

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

          {/* 2. Play / Watch Ad Button */}
          <button
            onClick={() => {
              if (canPlay) {
                startGame();
              } else {
                openAdModal();
              }
            }}
            className={`inline-flex items-center gap-2 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-xs transition-all cursor-pointer ${
              canPlay
                ? 'bg-[#488710] hover:bg-[#386b0c] text-white'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black border border-amber-300'
            }`}
          >
            {canPlay ? (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play Game</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>Watch Ad to Play</span>
              </>
            )}
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
        <div className="bg-gradient-to-br from-[#386b0c] via-[#488710] to-[#0084d1] border-2 border-emerald-300/80 rounded-3xl shadow-xl p-6 sm:p-8 text-center text-white space-y-4">
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

          {canPlay ? (
            <button
              onClick={startGame}
              className="bg-white hover:bg-emerald-50 text-[#386b0c] font-black px-8 py-3.5 rounded-full text-base shadow-xl inline-flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 border border-white"
            >
              <Play className="w-5 h-5 fill-[#386b0c]" />
              <span>START GAME NOW</span>
            </button>
          ) : (
            <div className="space-y-3 max-w-sm mx-auto pt-1">
              <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-300/40 text-amber-200 text-xs font-black">
                <Clock className="w-4 h-4 text-amber-300 animate-spin" />
                <span>Wait 24 Hours: {formatCountdown(remainingCooldown)}</span>
              </div>
              <p className="text-xs text-sky-100 font-medium leading-relaxed">
                You reached your daily free play limit. Watch a short sponsored video to unlock an immediate replay ticket, or wait 24 hours to play again.
              </p>
              <button
                onClick={openAdModal}
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black px-7 py-3 rounded-full text-sm shadow-xl inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 border border-amber-200"
              >
                <Film className="w-4 h-4 fill-slate-950" />
                <span>WATCH AD VIDEO TO PLAY NOW</span>
              </button>
            </div>
          )}
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

          {/* PLAYING CANVAS AREA (Direct Touch Drag & Pointer Controls) */}
          <div
            onPointerDown={(e) => {
              if (gameState !== 'playing') return;
              isDraggingRef.current = true;
              setIsActivelyMoving(true);
              try {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              } catch (_) {}
              handlePointerDrag(e.clientX);
            }}
            onPointerMove={(e) => {
              if (gameState !== 'playing' || !isDraggingRef.current) return;
              handlePointerDrag(e.clientX);
            }}
            onPointerUp={(e) => {
              isDraggingRef.current = false;
              setIsActivelyMoving(false);
              try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
              } catch (_) {}
            }}
            onPointerCancel={() => {
              isDraggingRef.current = false;
              setIsActivelyMoving(false);
            }}
            onTouchStart={(e) => {
              if (gameState !== 'playing' || !e.touches[0]) return;
              isDraggingRef.current = true;
              setIsActivelyMoving(true);
              handlePointerDrag(e.touches[0].clientX);
            }}
            onTouchMove={(e) => {
              if (gameState !== 'playing' || !isDraggingRef.current || !e.touches[0]) return;
              handlePointerDrag(e.touches[0].clientX);
            }}
            onTouchEnd={() => {
              isDraggingRef.current = false;
              setIsActivelyMoving(false);
            }}
            onTouchCancel={() => {
              isDraggingRef.current = false;
              setIsActivelyMoving(false);
            }}
            className="relative w-full flex-1 my-1 overflow-hidden cursor-pointer touch-none select-none"
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
              className={`absolute bottom-1 transform -translate-x-1/2 z-20 w-max max-w-none pointer-events-none shrink-0 will-change-[left] ${
                isActivelyMoving ? 'transition-none' : 'transition-[left] duration-75 ease-out'
              }`}
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

          {/* ON-SCREEN NAVIGATION ARROWS (SMOOTH CONTINUOUS HOLD & INSTANT TAP) */}
          <div className="absolute bottom-16 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startMove('left');
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                stopMove();
              }}
              onPointerLeave={() => {
                stopMove();
              }}
              onPointerCancel={() => {
                stopMove();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startMove('left');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopMove();
              }}
              onTouchCancel={() => {
                stopMove();
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/35 hover:bg-white/50 active:bg-white/65 active:scale-90 backdrop-blur-md text-white border-2 border-white/60 flex items-center justify-center shadow-2xl pointer-events-auto cursor-pointer transition-transform touch-none select-none"
              title="Move Left (Hold or Tap)"
            >
              <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startMove('right');
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                stopMove();
              }}
              onPointerLeave={() => {
                stopMove();
              }}
              onPointerCancel={() => {
                stopMove();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startMove('right');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopMove();
              }}
              onTouchCancel={() => {
                stopMove();
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/35 hover:bg-white/50 active:bg-white/65 active:scale-90 backdrop-blur-md text-white border-2 border-white/60 flex items-center justify-center shadow-2xl pointer-events-auto cursor-pointer transition-transform touch-none select-none"
              title="Move Right (Hold or Tap)"
            >
              <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3] rotate-180" />
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
            <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-3.5 animate-scale-up max-w-md mx-auto my-auto h-fit rounded-3xl border border-white/20 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400 shadow-2xl animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">TIME OVER!</h3>
                <p className="text-xs text-emerald-200 font-medium">Your catch challenge has ended</p>
              </div>

              {/* Stats Box */}
              <div className="bg-white/10 rounded-2xl p-3 border border-white/15 w-full max-w-xs grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">SCORE</p>
                  <p className="text-lg font-black text-amber-300">{score} PTS</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">GIFTS</p>
                  <p className="text-lg font-black text-emerald-300">🎁 {itemStatsRef.current.gifts}</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-200 font-bold uppercase tracking-wider">COMBO</p>
                  <p className="text-lg font-black text-cyan-300">{maxCombo}X</p>
                </div>
              </div>

              {/* 1. VIEW YOUR WON GIFTS BUTTON (PRIMARY ACTION) */}
              <button
                onClick={() => {
                  setGameState('idle');
                  setTimeout(() => {
                    const giftsElem = document.getElementById('my-gifts-section');
                    if (giftsElem) {
                      giftsElem.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 150);
                }}
                className="w-full max-w-xs bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 active:scale-98 border border-white/40"
              >
                <Gift className="w-4.5 h-4.5 text-amber-200 fill-amber-200" />
                <span>VIEW YOUR WON GIFTS</span>
              </button>

              {/* 2. REPLAY RESTRICTION & AD VIDEO REQUIREMENT (PLAY AGAIN REMOVED) */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 w-full max-w-xs text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-300 text-[11px] font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next Free Game in: {formatCountdown(remainingCooldown || 86400000)}</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-200 leading-tight font-medium">
                  To play again immediately, you must watch a short sponsored video. Otherwise, you must wait 24 hours.
                </p>
                <button
                  onClick={openAdModal}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 border border-amber-200"
                >
                  <Film className="w-4 h-4 fill-slate-950" />
                  <span>WATCH AD VIDEO TO PLAY AGAIN</span>
                </button>
              </div>

              {/* 3. EXIT GAME */}
              <button
                onClick={() => setGameState('idle')}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-2 rounded-full text-xs shadow-md flex items-center gap-2 cursor-pointer border border-white/20 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Game</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SPONSORED AD VIDEO MODAL */}
      {showAdModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-white relative animate-scale-up flex flex-col">
            {/* Ad Video Header */}
            <div className="bg-slate-800/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ad
                </span>
                <span className="text-xs font-bold text-gray-300">Sponsored Video</span>
              </div>

              <div className="flex items-center gap-2">
                {!adFinished ? (
                  <span className="bg-white/10 text-amber-300 text-xs font-mono font-bold px-2.5 py-1 rounded-full border border-white/10">
                    Reward in {adTimer}s
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reward Earned!</span>
                  </span>
                )}

                <button
                  onClick={handleCloseAd}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Ad"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Player Display Screen */}
            <div className="relative aspect-video bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden border-b border-slate-800">
              {/* Animated decorative background rays */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              
              {!adFinished ? (
                <div className="space-y-3 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center shadow-2xl animate-pulse">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>

                  <div>
                    <span className="inline-block bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold px-3 py-0.5 rounded-full mb-1">
                      CHOKKU FRESH STORE
                    </span>
                    <h4 className="text-lg font-black text-white leading-tight">
                      Flat 50% OFF On First Grocery Order!
                    </h4>
                    <p className="text-xs text-gray-300 font-medium mt-1">
                      Fresh Farm Veggies, Fruits &amp; Free 10-Min Delivery
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[11px] text-amber-300 font-bold border border-white/15">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Use Coupon: CHOKKUNEW</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 relative z-10 animate-scale-up">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-2xl">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-white">Video Completed!</h4>
                    <p className="text-xs text-emerald-300 font-medium mt-0.5">
                      1 Replay Ticket has been granted to your account!
                    </p>
                  </div>
                </div>
              )}

              {/* Video Bottom Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-lime-400 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((10 - adTimer) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Ad Video Footer Actions */}
            <div className="p-4 bg-slate-900 text-center space-y-2">
              {adFinished ? (
                <button
                  onClick={handlePlayAfterAd}
                  className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-slate-950 font-black py-3 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 active:scale-98"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>START GAME NOW</span>
                </button>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">
                    Please watch until the timer reaches zero to unlock your replay ticket.
                  </p>
                  <button
                    onClick={handleCloseAd}
                    className="text-[11px] text-gray-500 hover:text-gray-300 underline font-medium cursor-pointer"
                  >
                    Skip &amp; Wait 24 Hours
                  </button>
                </div>
              )}
            </div>

            {/* Early Exit Confirmation Alert */}
            {showEarlyExitPrompt && (
              <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-white">Skip Ad Video?</h4>
                <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
                  If you leave now without finishing the video, you will <strong className="text-rose-400">NOT receive a replay ticket</strong> and must wait <strong className="text-amber-300">24 hours</strong> before playing again.
                </p>
                <div className="flex items-center gap-2 pt-2 w-full max-w-xs">
                  <button
                    onClick={() => setShowEarlyExitPrompt(false)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Resume Video
                  </button>
                  <button
                    onClick={confirmExitAdEarly}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 font-bold py-2 px-3 rounded-xl text-xs cursor-pointer border border-white/15"
                  >
                    Exit (Wait 24h)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY GIFTS UNBOXING & REWARDS SECTION */}
      <div id="my-gifts-section" className="max-w-4xl w-full pt-4 scroll-mt-6">
        <MyGifts />
      </div>
    </div>
  );
};
