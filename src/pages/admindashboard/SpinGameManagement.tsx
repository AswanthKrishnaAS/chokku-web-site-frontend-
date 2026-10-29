import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Disc,
  Sparkles,
  ExternalLink,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Play,
  Dices,
  Trophy,
  Coins,
  Percent,
  Tag,
  Truck,
  Gift,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  useSpinGame,
  SpinSlotConfig,
  DEFAULT_SPIN_SLOTS,
  SimulationResult,
  RewardType
} from '../../context/SpinGameContext';
import { safeFetch } from '../../utils/api';

const QUICK_COLORS = [
  '#ea580c', // Electric Orange / Gold
  '#0284c7', // Ocean Blue
  '#059669', // Emerald Green
  '#d97706', // Amber Gold
  '#0891b2', // Cyan
  '#7c3aed', // Purple Violet
  '#e11d48', // Rose Red
  '#64748b', // Slate Gray
  '#10b981', // Mint
  '#f59e0b', // Yellow
  '#ec4899', // Pink
  '#3b82f6', // Sky Blue
];

const QUICK_ICONS = ['👑', '🪙', '★', '🚚', '🏷️', '🎁', '🍀', '%', '💎', '🎯', '🔥', '⚡'];

export const SpinGameManagement: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const {
    spinGameSettings,
    isConfigured,
    isLoading,
    saveSpinSettings,
    resetSpinSettings,
    simulateSpins,
  } = useSpinGame();

  // Local form state
  const [slots, setSlots] = useState<SpinSlotConfig[]>(() => spinGameSettings.slots);
  const [gameTitle, setGameTitle] = useState(spinGameSettings.gameTitle || 'Spin and Win');
  const [dailyFreeSpins, setDailyFreeSpins] = useState(spinGameSettings.dailyFreeSpins || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'slots' | 'simulator' | 'history'>('slots');

  // Simulator state
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Customer Spin Log state
  const [customerSpins, setCustomerSpins] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Interactive Live Wheel Preview in Dashboard
  const [previewWheelRotation, setPreviewWheelRotation] = useState(0);
  const [previewIsSpinning, setPreviewIsSpinning] = useState(false);
  const [previewWonSlot, setPreviewWonSlot] = useState<SpinSlotConfig | null>(null);

  // Sync state when context updates
  useEffect(() => {
    if (spinGameSettings && Array.isArray(spinGameSettings.slots) && spinGameSettings.slots.length === 8) {
      setSlots(spinGameSettings.slots);
      setGameTitle(spinGameSettings.gameTitle || 'Spin and Win');
      setDailyFreeSpins(spinGameSettings.dailyFreeSpins || 1);
    }
  }, [spinGameSettings]);

  // Fetch customer spin history
  const fetchCustomerSpins = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await safeFetch('/spin-game/all-scores');
      if (res.ok && res.isJson && res.data?.success && Array.isArray(res.data.spins)) {
        setCustomerSpins(res.data.spins);
      }
    } catch (err) {
      console.warn('Could not fetch spin history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchCustomerSpins();
    }
  }, [activeTab]);

  // Calculate total probability
  const totalProbability = Math.round(
    slots.reduce((sum, s) => sum + (Number(s.probability) || 0), 0) * 100
  ) / 100;

  const isOver100 = totalProbability > 100;
  const isUnder100 = totalProbability < 100;
  const isExact100 = totalProbability === 100;
  const unassignedRemainder = Math.max(0, Math.round((100 - totalProbability) * 100) / 100);

  // Slot field change handler
  const handleSlotChange = (index: number, field: keyof SpinSlotConfig, value: any) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Auto assign remainder to Slot 8 (Better Luck Next Time)
  const handleAutoAssignRemainder = () => {
    const sumFirstSeven = slots
      .slice(0, 7)
      .reduce((sum, s) => sum + (Number(s.probability) || 0), 0);
    const remainder = Math.max(0, Math.round((100 - sumFirstSeven) * 100) / 100);

    setSlots((prev) => {
      const next = [...prev];
      next[7] = {
        ...next[7],
        label: next[7].label || 'Better Luck Next Time',
        rewardType: 'no_prize',
        probability: remainder,
      };
      return next;
    });

    addToast(
      'Probability Balanced',
      `Assigned remaining ${remainder}% to Slot 8. Total probability is now 100%!`,
      'success'
    );
  };

  // Save Settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (totalProbability > 100) {
      addToast(
        'Validation Failed',
        `Total winning probability is ${totalProbability}%, exceeding 100%. Please reduce slot percentages before saving.`,
        'error'
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveSpinSettings({
        gameTitle,
        dailyFreeSpins: Number(dailyFreeSpins) || 1,
        slots,
      });

      if (res.success) {
        addToast('Settings Saved!', res.message, 'success');
      } else {
        addToast('Save Failed', res.message, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Defaults
  const handleReset = () => {
    resetSpinSettings();
    setSlots(DEFAULT_SPIN_SLOTS);
    addToast('Restored Defaults', 'Standard 8 prize slots and default probabilities loaded.', 'info');
  };

  // Run Simulation
  const handleRunSimulation = async (count: number) => {
    setIsSimulating(true);
    try {
      const res = await simulateSpins(count, slots);
      if (res) {
        setSimulationResult(res);
        addToast(
          'Simulation Complete',
          `Ran ${count.toLocaleString()} spins. Check empirical win frequencies below.`,
          'success'
        );
      }
    } catch (err) {
      addToast('Simulation Error', 'Failed to run simulation test', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Dashboard Wheel Preview Test Spin
  const handlePreviewTestSpin = () => {
    if (previewIsSpinning) return;
    setPreviewIsSpinning(true);
    setPreviewWonSlot(null);

    // Pick random winning slot based on configured probabilities
    const roll = Math.random() * 100;
    let cum = 0;
    let winningIndex = 7;

    for (let i = 0; i < slots.length; i++) {
      cum += Number(slots[i].probability) || 0;
      if (roll < cum) {
        winningIndex = i;
        break;
      }
    }

    const sliceAngle = 360 / 8; // 45 deg
    const targetAngleMod = (360 - (winningIndex * sliceAngle + sliceAngle / 2)) % 360;
    const currentAngleMod = ((previewWheelRotation % 360) + 360) % 360;
    const extraToReachTarget = (targetAngleMod - currentAngleMod + 360) % 360;
    const fullSpins = 360 * 6; // 6 dramatic rotations
    const nextTotalRotation = previewWheelRotation + fullSpins + extraToReachTarget;

    setPreviewWheelRotation(nextTotalRotation);

    setTimeout(() => {
      setPreviewIsSpinning(false);
      const won = slots[winningIndex];
      setPreviewWonSlot(won);
      addToast(
        'Preview Spin Landed!',
        `Slot ${winningIndex + 1}: ${won.label} (${won.probability}% configured probability)`,
        'success'
      );
    }, 4800);
  };

  // Helper for rendering SVG wheel slices
  const radius = 175;
  const cx = 200;
  const cy = 200;
  const sliceAngle = 360 / 8;

  const renderSvgSlice = (index: number, slot: SpinSlotConfig) => {
    const startAngle = (index * sliceAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * sliceAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
    const midAngle = ((index + 0.5) * sliceAngle - 90) * (Math.PI / 180);
    const textRadius = radius * 0.62;
    const tx = cx + textRadius * Math.cos(midAngle);
    const ty = cy + textRadius * Math.sin(midAngle);
    const textRotation = (index + 0.5) * sliceAngle;

    return (
      <g key={index}>
        <path
          d={pathData}
          fill={slot.color || QUICK_COLORS[index % QUICK_COLORS.length]}
          stroke="#ffffff"
          strokeWidth="2.5"
          className="transition-colors duration-200"
        />
        {/* Slice Text & Icon */}
        <g transform={`translate(${tx}, ${ty}) rotate(${textRotation + 90})`}>
          <text
            textAnchor="middle"
            fill={slot.textColor || '#ffffff'}
            fontSize="11"
            fontWeight="900"
            fontFamily="sans-serif"
            className="select-none drop-shadow-sm"
          >
            {slot.icon} {slot.label.length > 11 ? `${slot.label.substring(0, 10)}…` : slot.label}
          </text>
          <text
            y="13"
            textAnchor="middle"
            fill="rgba(255,255,255,0.9)"
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="sans-serif"
            className="select-none"
          >
            {slot.coinValue > 0 ? `+${slot.coinValue} coins` : `${slot.probability}%`}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER BANNER */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-sky-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black text-amber-200 border border-white/30 tracking-wide">
            <Disc className="w-4 h-4 animate-spin [animation-duration:8s]" />
            <span>GAME MANAGEMENT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <span>Spin and Win Settings</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-2xl font-medium leading-relaxed">
            MongoDB Collection: <span className="font-bold font-mono text-amber-300">SpinGame</span>. Configure all 8 prize slots, coin rewards, reward types, and winning probability percentages with strict backend outcome validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/spin-and-win?testMode=true')}
            className="bg-white/15 hover:bg-white/25 text-white font-extrabold px-3.5 py-2.5 rounded-xl text-xs backdrop-blur-md border border-white/30 inline-flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            <ExternalLink className="w-4 h-4 text-amber-300" />
            <span>Test Customer Game</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || isOver100}
            className={`font-black px-4 py-2.5 rounded-xl text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all ${
              isOver100
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-white hover:bg-amber-50 text-orange-700 hover:scale-105 active:scale-95'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PROBABILITY VALIDATION & HEALTH WIDGET */}
      {/* ============================================================ */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xs ${
        isExact100
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : isOver100
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isExact100
                ? 'bg-emerald-600 text-white'
                : isOver100
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {isExact100 ? (
                <Check className="w-5 h-5 stroke-[2.8]" />
              ) : isOver100 ? (
                <AlertTriangle className="w-5 h-5 stroke-[2.8]" />
              ) : (
                <Percent className="w-5 h-5 stroke-[2.8]" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base">
                  {isExact100
                    ? '✅ 100% Optimal Probability Distribution'
                    : isOver100
                    ? `❌ Total Exceeds 100% (${totalProbability}%)`
                    : `⚠️ Total Configured Probability: ${totalProbability}% (${unassignedRemainder}% Unassigned)`}
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isExact100
                    ? 'bg-emerald-200 text-emerald-900'
                    : isOver100
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-amber-200 text-amber-900'
                }`}>
                  Sum: {totalProbability}%
                </span>
              </div>

              <p className="text-xs leading-relaxed opacity-90 font-medium">
                {isExact100 && (
                  <span>All 8 prize slots sum to 100%. Outcomes will be awarded in exact proportion to the configured winning percentages.</span>
                )}
                {isOver100 && (
                  <span className="font-bold text-rose-700">
                    Total probability exceeds 100% by {Math.round((totalProbability - 100) * 100) / 100}%. Saving is blocked until you reduce slot percentages.
                  </span>
                )}
                {isUnder100 && (
                  <span>
                    The total is less than 100%. Per requirements, any roll landing in the remaining <strong className="font-black text-amber-800">{unassignedRemainder}%</strong> range will be awarded to <strong className="font-black">Slot 8 (Better Luck Next Time / No Prize)</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {isUnder100 && (
              <button
                type="button"
                onClick={handleAutoAssignRemainder}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                Auto-Assign {unassignedRemainder}% to Slot 8
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-extrabold text-xs px-3 py-2 rounded-xl shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
          </div>
        </div>

        {/* Stacked Probability Visualizer Bar */}
        <div className="mt-4 pt-3 border-t border-gray-200/50">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1.5">
            <span>Visual Probability Share (All 8 Slots)</span>
            <span className="font-mono">{totalProbability}% of 100%</span>
          </div>

          <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden flex shadow-inner">
            {slots.map((s, idx) => {
              const widthPct = Math.max(0, Math.min(100, Number(s.probability) || 0));
              if (widthPct <= 0) return null;
              return (
                <div
                  key={idx}
                  style={{
                    width: `${(widthPct / (totalProbability > 100 ? totalProbability : 100)) * 100}%`,
                    backgroundColor: s.color || QUICK_COLORS[idx % QUICK_COLORS.length],
                  }}
                  title={`Slot ${idx + 1} (${s.label}): ${s.probability}%`}
                  className="h-full relative group transition-all"
                />
              );
            })}
            {isUnder100 && (
              <div
                style={{ width: `${unassignedRemainder}%` }}
                title={`Unassigned Remainder (${unassignedRemainder}%): Better Luck Next Time`}
                className="h-full bg-repeating-linear-stripes bg-gray-300/80"
              />
            )}
          </div>

          {/* Slot Legend Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {slots.map((s, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 shadow-2xs"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color || QUICK_COLORS[idx % QUICK_COLORS.length] }}
                />
                <span className="text-gray-700">S{idx + 1}: {s.label}</span>
                <span className="font-extrabold text-gray-900">({s.probability}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. NAVIGATION TABS */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'slots'
                ? 'border-orange-600 text-orange-600 bg-orange-50/40 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>8 Prize Slots Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-orange-600 text-orange-600 bg-orange-50/40 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Probability Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-orange-600 text-orange-600 bg-orange-50/40 rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Customer Spin Log</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600">
              {customerSpins.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: 8 PRIZE SLOTS CONFIGURATION */}
      {/* ============================================================ */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          {/* Top Preview & Game Info Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
            {/* Left: General Settings */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  General Game Rules
                </span>
                <h3 className="text-lg font-black text-gray-900">Live Wheel Preview</h3>
                <p className="text-xs text-gray-500">
                  Updates in real time as you adjust slot names, colors, and rewards. Test the spinning physics directly from the dashboard.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Game Display Title
                  </label>
                  <input
                    type="text"
                    value={gameTitle}
                    onChange={(e) => setGameTitle(e.target.value)}
                    placeholder="Spin and Win"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Daily Free Spins Per Customer
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={dailyFreeSpins}
                    onChange={(e) => setDailyFreeSpins(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:border-orange-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Default 1 free spin every 24 hours per customer.
                  </span>
                </div>

                {previewWonSlot && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 animate-scale-up">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                      Last Preview Result
                    </p>
                    <p className="text-sm font-black text-gray-900 mt-0.5 flex items-center gap-1.5">
                      <span>{previewWonSlot.icon}</span>
                      <span>Slot {previewWonSlot.slotNumber}: {previewWonSlot.label}</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Type: <strong className="capitalize">{previewWonSlot.rewardType}</strong> • Reward: {previewWonSlot.coinValue > 0 ? `+${previewWonSlot.coinValue} Coins` : 'Voucher/None'} • Configured Prob: {previewWonSlot.probability}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Interactive SVG Wheel Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100/60 rounded-2xl border border-gray-200 relative overflow-hidden">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                {/* 12 o'clock pointer */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center drop-shadow-md">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-red-600 filter drop-shadow" />
                  <div className="w-3.5 h-3.5 rounded-full bg-red-600 -mt-1 ring-2 ring-white" />
                </div>

                {/* SVG Spinning Wheel */}
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full drop-shadow-xl"
                  style={{
                    transform: `rotate(${previewWheelRotation}deg)`,
                    transition: previewIsSpinning ? 'transform 4.8s cubic-bezier(0.12, 0.88, 0.22, 1)' : 'none',
                  }}
                >
                  <circle cx={cx} cy={cy} r={radius + 8} fill="#ffffff" stroke="#e2e8f0" strokeWidth="8" />
                  {slots.map((s, idx) => renderSvgSlice(idx, s))}
                  {/* Center Hub */}
                  <circle cx={cx} cy={cy} r="32" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" className="shadow-lg" />
                  <circle cx={cx} cy={cy} r="24" fill="#ea580c" />
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    SPIN
                  </text>
                </svg>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviewTestSpin}
                  disabled={previewIsSpinning}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{previewIsSpinning ? 'Wheel Spinning...' : 'Test Spin Preview Wheel'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 8 SLOTS CONFIGURATION CARDS GRID */}
          {/* ============================================================ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                  <span>8 Configurable Prize Slots</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    Exactly 8 Slots
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Admins can independently adjust names, reward types, coin rewards, and winning probability % for all 8 slots.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving || isOver100}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save All 8 Slots</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl border border-gray-200 hover:border-orange-300 p-5 shadow-2xs hover:shadow-md transition-all space-y-4 relative"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                        style={{ backgroundColor: slot.color || QUICK_COLORS[idx] }}
                      >
                        {slot.icon || `S${idx + 1}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-gray-900">
                            Slot {idx + 1}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            ({idx * 45}° – {(idx + 1) * 45}°)
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {slot.rewardType === 'jackpot' && '👑 Grand Jackpot Slot'}
                          {slot.rewardType === 'coins' && '🪙 Direct Coins Credit'}
                          {slot.rewardType === 'free_delivery' && '🚚 Free Shipping Voucher'}
                          {slot.rewardType === 'discount' && '🏷️ Discount Offer Voucher'}
                          {slot.rewardType === 'bonus' && '🎁 Exclusive Bonus Reward'}
                          {slot.rewardType === 'no_prize' && '🍀 Better Luck Next Time'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-orange-600 font-mono">
                        {slot.probability}%
                      </span>
                      <span className="block text-[10px] text-gray-400 font-bold">Winning Prob</span>
                    </div>
                  </div>

                  {/* Card Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Prize Label */}
                    <div className="space-y-1">
                      <label className="font-extrabold text-gray-700 flex items-center gap-1">
                        <span>Prize Name</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={slot.label}
                        onChange={(e) => handleSlotChange(idx, 'label', e.target.value)}
                        placeholder="e.g. Jackpot, 100 Coins"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Reward Type */}
                    <div className="space-y-1">
                      <label className="font-extrabold text-gray-700">Reward Type</label>
                      <select
                        value={slot.rewardType}
                        onChange={(e) => handleSlotChange(idx, 'rewardType', e.target.value as RewardType)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold focus:border-orange-500 focus:outline-none bg-white"
                      >
                        <option value="jackpot">👑 Jackpot (Grand Reward)</option>
                        <option value="coins">🪙 Coins (Direct Points)</option>
                        <option value="free_delivery">🚚 Free Delivery Voucher</option>
                        <option value="discount">🏷️ Discount Voucher</option>
                        <option value="bonus">🎁 Bonus Reward</option>
                        <option value="no_prize">🍀 Better Luck Next Time</option>
                      </select>
                    </div>

                    {/* Description / Sub-label */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-extrabold text-gray-700">Sub-label / Description</label>
                      <input
                        type="text"
                        value={slot.subLabel}
                        onChange={(e) => handleSlotChange(idx, 'subLabel', e.target.value)}
                        placeholder="e.g. Instant 100 coins credited into balance"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Coin Reward Amount */}
                    <div className="space-y-1">
                      <label className="font-extrabold text-gray-700 flex items-center justify-between">
                        <span>Coin Value (Coins)</span>
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={slot.coinValue}
                        onChange={(e) => handleSlotChange(idx, 'coinValue', Math.max(0, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-black text-amber-700 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Coupon Code */}
                    <div className="space-y-1">
                      <label className="font-extrabold text-gray-700 flex items-center justify-between">
                        <span>Voucher Code</span>
                        <Tag className="w-3.5 h-3.5 text-sky-500" />
                      </label>
                      <input
                        type="text"
                        value={slot.couponCode}
                        onChange={(e) => handleSlotChange(idx, 'couponCode', e.target.value.toUpperCase())}
                        placeholder="e.g. JACKPOT500"
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold focus:border-orange-500 focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* PROBABILITY PERCENTAGE SLIDER & NUMBER BOX */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-extrabold text-gray-800 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-orange-600" />
                        <span>Winning Probability Percentage:</span>
                      </label>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={slot.probability}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                            handleSlotChange(idx, 'probability', val);
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-center font-black text-xs text-orange-600 focus:border-orange-500 focus:outline-none"
                        />
                        <span className="font-black text-gray-700">%</span>
                      </div>
                    </div>

                    {/* Range slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={slot.probability}
                      onChange={(e) => handleSlotChange(idx, 'probability', Number(e.target.value))}
                      className="w-full accent-orange-600 cursor-pointer"
                    />

                    {/* Quick Probability Preset Incrementers */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSlotChange(idx, 'probability', Math.max(0, slot.probability - 1))}
                          className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px]"
                        >
                          -1%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSlotChange(idx, 'probability', Math.min(100, slot.probability + 1))}
                          className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px]"
                        >
                          +1%
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {[5, 10, 15, 20].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleSlotChange(idx, 'probability', preset)}
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-colors ${
                              slot.probability === preset
                                ? 'bg-orange-600 text-white'
                                : 'bg-orange-50 hover:bg-orange-100 text-orange-800'
                            }`}
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* VISUAL STYLING: COLOR & ICON */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3 text-xs">
                    {/* Quick Color Swatches */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400">Color:</span>
                      <div className="flex items-center gap-1">
                        {QUICK_COLORS.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleSlotChange(idx, 'color', c)}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                              slot.color === c ? 'border-gray-900 scale-110 shadow-xs' : 'border-white'
                            }`}
                          />
                        ))}
                        <input
                          type="color"
                          value={slot.color || '#ea580c'}
                          onChange={(e) => handleSlotChange(idx, 'color', e.target.value)}
                          className="w-5 h-5 rounded-full border-0 p-0 cursor-pointer bg-transparent"
                          title="Custom Hex Color"
                        />
                      </div>
                    </div>

                    {/* Quick Icon Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400">Icon:</span>
                      <select
                        value={slot.icon}
                        onChange={(e) => handleSlotChange(idx, 'icon', e.target.value)}
                        className="px-2 py-1 rounded-lg border border-gray-300 font-bold text-xs bg-white focus:outline-none"
                      >
                        {QUICK_ICONS.map((ic) => (
                          <option key={ic} value={ic}>
                            {ic}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save Bar */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-black text-gray-900">
                  Total Probability: <span className={isExact100 ? 'text-emerald-600' : isOver100 ? 'text-rose-600' : 'text-amber-600'}>{totalProbability}%</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  {isOver100
                    ? 'Total exceeds 100%. Please reduce probabilities to save.'
                    : 'Changes will instantly take effect on live customer wheel spins.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
                >
                  Reset Defaults
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving || isOver100}
                  className={`font-black px-6 py-2.5 rounded-xl text-xs shadow-md inline-flex items-center gap-2 cursor-pointer transition-all ${
                    isOver100
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                      : 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save All Settings to MongoDB'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PROBABILITY SIMULATOR */}
      {/* ============================================================ */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <Dices className="w-3.5 h-3.5" />
                  <span>Probability Monte-Carlo Simulator</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">
                  Empirical Probability Verification
                </h3>
                <p className="text-xs text-gray-500 max-w-xl">
                  As specified: if the jackpot probability is set to 5%, approximately 5 out of every 100 spins will win over time. Run high-volume tests below to prove statistical distribution.
                </p>
              </div>

              {/* Simulation Quick Trigger Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation(100)}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-purple-200 cursor-pointer transition-all disabled:opacity-50"
                >
                  Simulate 100 Spins
                </button>

                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation(1000)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSimulating ? 'Simulating...' : 'Simulate 1,000 Spins'}
                </button>

                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation(10000)}
                  className="bg-gray-900 hover:bg-black text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  Simulate 10,000 Spins
                </button>
              </div>
            </div>

            {/* Results Display */}
            {simulationResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-100 text-xs font-bold text-purple-900">
                  <span>
                    Test Sample: <strong className="font-black text-purple-950">{simulationResult.totalSpins.toLocaleString()}</strong> spins tested through backend algorithm
                  </span>
                  <span>
                    Remainder Hits: <strong className="font-black">{simulationResult.remainderHits || 0}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-gray-200">
                        <th className="py-3 px-4">Slot</th>
                        <th className="py-3 px-4">Prize Label</th>
                        <th className="py-3 px-4">Reward Type</th>
                        <th className="py-3 px-4 text-center">Configured Prob</th>
                        <th className="py-3 px-4 text-center">Empirical Wins</th>
                        <th className="py-3 px-4 text-center">Empirical %</th>
                        <th className="py-3 px-4 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold text-gray-800">
                      {simulationResult.results.map((res, i) => {
                        const isClose = Math.abs(res.difference) <= 2.0;
                        return (
                          <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-black text-orange-600">
                              Slot {res.slotNumber}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-gray-900">{res.label}</span>
                              {res.coinValue > 0 && (
                                <span className="text-[10px] text-amber-600 block">+{res.coinValue} coins</span>
                              )}
                            </td>
                            <td className="py-3 px-4 capitalize text-gray-600 text-[11px]">
                              {res.rewardType}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-gray-900">
                              {res.configuredProbability}%
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-purple-700 bg-purple-50/50">
                              {res.wins.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-black text-gray-900">
                              {res.empiricalPercentage}%
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <span
                                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                                  isClose
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {res.difference > 0 ? `+${res.difference}%` : `${res.difference}%`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Dices className="w-12 h-12 mx-auto text-purple-300 opacity-60" />
                <p className="text-sm font-bold text-gray-700">No Simulation Run Yet</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Click one of the simulation buttons above to test 100, 1,000, or 10,000 random rolls through the probability selector.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: CUSTOMER SPIN LOGS */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>Customer Spin Records</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Verified server-side gameplay records recorded in MongoDB.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCustomerSpins}
                disabled={isLoadingHistory}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs px-3 py-1.5 rounded-xl cursor-pointer"
              >
                {isLoadingHistory ? 'Refreshing...' : 'Refresh Records'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4 text-center">Slot Landed</th>
                    <th className="py-3 px-4">Prize Awarded</th>
                    <th className="py-3 px-4 text-center">Coins Credited</th>
                    <th className="py-3 px-4">Voucher</th>
                    <th className="py-3 px-4 text-right">Spin Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-bold text-gray-800">
                  {customerSpins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <Disc className="w-10 h-10 text-gray-300 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-bold text-gray-700">No Customer Spin Records Found</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          When customers spin the lucky wheel, their verified results will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    customerSpins.map((spin, idx) => (
                      <tr key={spin.id || idx} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-black text-gray-900">{spin.name || 'Customer'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">@{spin.username || 'user'}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-700">
                          {spin.phone || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-orange-600">
                          Slot {spin.slotNumber || idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-gray-900">{spin.prizeLabel}</span>
                          <span className="block text-[10px] text-gray-400 capitalize">{spin.rewardType}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {spin.coinValue > 0 ? (
                            <span className="inline-block bg-amber-100 text-amber-800 font-black text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                              +{spin.coinValue} Coins
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-sky-600">
                          {spin.couponCode || '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500 font-medium text-[11px]">
                          {spin.playedAt ? new Date(spin.playedAt).toLocaleString() : 'Recently'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
