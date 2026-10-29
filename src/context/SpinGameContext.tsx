import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeFetch } from '../utils/api';

export type RewardType = 'jackpot' | 'coins' | 'free_delivery' | 'discount' | 'bonus' | 'no_prize';

export interface SpinSlotConfig {
  _id?: string;
  slotIndex: number; // 0 to 7
  slotNumber: number; // 1 to 8
  label: string;
  subLabel: string;
  rewardType: RewardType;
  coinValue: number;
  couponCode: string;
  probability: number;
  color: string;
  textColor: string;
  icon: string;
  badge?: string;
}

export interface SpinGameSettings {
  gameTitle: string;
  description: string;
  dailyFreeSpins: number;
  slots: SpinSlotConfig[];
  isConfigured: boolean;
  totalProbability: number;
}

export interface SimulationResultItem {
  slotIndex: number;
  slotNumber: number;
  label: string;
  rewardType: RewardType;
  configuredProbability: number;
  coinValue: number;
  wins: number;
  empiricalPercentage: number;
  difference: number;
}

export interface SimulationResult {
  totalSpins: number;
  remainderHits: number;
  results: SimulationResultItem[];
}

export const DEFAULT_SPIN_SLOTS: SpinSlotConfig[] = [
  {
    slotIndex: 0,
    slotNumber: 1,
    label: 'Jackpot',
    subLabel: 'Grand Store Jackpot Reward',
    rewardType: 'jackpot',
    coinValue: 500,
    couponCode: 'JACKPOT500',
    probability: 5,
    color: '#ea580c', // Electric Orange / Gold
    textColor: '#ffffff',
    icon: '👑',
    badge: 'JACKPOT',
  },
  {
    slotIndex: 1,
    slotNumber: 2,
    label: '100 Coins',
    subLabel: 'Direct 100 coins credited',
    rewardType: 'coins',
    coinValue: 100,
    couponCode: '',
    probability: 10,
    color: '#0284c7', // Ocean Blue
    textColor: '#ffffff',
    icon: '🪙',
    badge: 'POPULAR',
  },
  {
    slotIndex: 2,
    slotNumber: 3,
    label: '50 Coins',
    subLabel: 'Instant 50 coins added',
    rewardType: 'coins',
    coinValue: 50,
    couponCode: '',
    probability: 15,
    color: '#059669', // Emerald Green
    textColor: '#ffffff',
    icon: '★',
    badge: 'HOT',
  },
  {
    slotIndex: 3,
    slotNumber: 4,
    label: '25 Coins',
    subLabel: 'Instant 25 coins credit',
    rewardType: 'coins',
    coinValue: 25,
    couponCode: '',
    probability: 20,
    color: '#d97706', // Amber Gold
    textColor: '#ffffff',
    icon: '🪙',
    badge: 'LUCKY',
  },
  {
    slotIndex: 4,
    slotNumber: 5,
    label: 'Free Delivery',
    subLabel: 'Zero delivery charges voucher',
    rewardType: 'free_delivery',
    coinValue: 0,
    couponCode: 'SPINFREESHIP',
    probability: 10,
    color: '#0891b2', // Cyan
    textColor: '#ffffff',
    icon: '🚚',
    badge: 'FAST',
  },
  {
    slotIndex: 5,
    slotNumber: 6,
    label: '10 Coins',
    subLabel: 'Instant 10 coins credit',
    rewardType: 'coins',
    coinValue: 10,
    couponCode: '',
    probability: 20,
    color: '#7c3aed', // Purple Violet
    textColor: '#ffffff',
    icon: '★',
    badge: 'BONUS',
  },
  {
    slotIndex: 6,
    slotNumber: 7,
    label: 'Bonus Reward',
    subLabel: 'Exclusive VIP bonus voucher',
    rewardType: 'bonus',
    coinValue: 50,
    couponCode: 'SPINBONUS10',
    probability: 10,
    color: '#e11d48', // Rose Red
    textColor: '#ffffff',
    icon: '🎁',
    badge: 'SPECIAL',
  },
  {
    slotIndex: 7,
    slotNumber: 8,
    label: 'Better Luck Next Time',
    subLabel: 'Spin again tomorrow for free!',
    rewardType: 'no_prize',
    coinValue: 0,
    couponCode: '',
    probability: 10,
    color: '#64748b', // Slate Gray
    textColor: '#ffffff',
    icon: '🍀',
    badge: 'TRY AGAIN',
  },
];

export const DEFAULT_SPIN_SETTINGS: SpinGameSettings = {
  gameTitle: 'Spin and Win',
  description: 'Spin the lucky wheel daily to win jackpot rewards, coins, free delivery, and vouchers!',
  dailyFreeSpins: 1,
  slots: DEFAULT_SPIN_SLOTS,
  isConfigured: true,
  totalProbability: 100,
};

interface SpinGameContextType {
  spinGameSettings: SpinGameSettings;
  isConfigured: boolean;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  saveSpinSettings: (newSettings: Partial<SpinGameSettings>) => Promise<{ success: boolean; message: string; settings?: SpinGameSettings }>;
  resetSpinSettings: () => void;
  executeBackendSpin: (
    token?: string,
    userId?: string,
    clientRequestId?: string,
    isTestMode?: boolean
  ) => Promise<{
    success: boolean;
    winningSlotIndex?: number;
    winningSlot?: SpinSlotConfig;
    coinsEarned?: number;
    couponCode?: string;
    newTotalPoints?: number;
    availableRupees?: number;
    walletBalance?: number;
    alreadySpun?: boolean;
    isDuplicateReplay?: boolean;
    remainingMs?: number;
    message: string;
    error?: string;
  }>;
  simulateSpins: (count?: number, customSlots?: SpinSlotConfig[]) => Promise<SimulationResult | null>;
}

const SpinGameContext = createContext<SpinGameContextType | undefined>(undefined);

const STORAGE_KEY = 'chokku_spin_game_settings_v2';
const IS_CONFIGURED_KEY = 'chokku_spin_game_is_configured_v2';

export const SpinGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spinGameSettings, setSpinGameSettings] = useState<SpinGameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.slots) && parsed.slots.length === 8) {
          return { ...DEFAULT_SPIN_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.error('Error loading local spin game settings:', e);
    }
    return DEFAULT_SPIN_SETTINGS;
  });

  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return localStorage.getItem(IS_CONFIGURED_KEY) === 'true';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      const res = await safeFetch('/spin-game/settings');
      if (res.ok && res.isJson && res.data?.success && res.data?.settings) {
        const settings = res.data.settings;
        if (Array.isArray(settings.slots) && settings.slots.length === 8) {
          setSpinGameSettings({ ...DEFAULT_SPIN_SETTINGS, ...settings });
          setIsConfigured(!!res.data.isConfigured);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
          localStorage.setItem(IS_CONFIGURED_KEY, res.data.isConfigured ? 'true' : 'false');
        }
      }
    } catch (err) {
      console.warn('Could not fetch SpinGame settings from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const saveSpinSettings = async (newSettings: Partial<SpinGameSettings>) => {
    const updated = { ...spinGameSettings, ...newSettings };
    
    // Validate slot count
    if (!Array.isArray(updated.slots) || updated.slots.length !== 8) {
      return { success: false, message: 'The Spin and Win game requires exactly 8 prize slots.' };
    }

    // Validate total probability
    const totalProb = Math.round(
      updated.slots.reduce((sum, s) => sum + (Number(s.probability) || 0), 0) * 100
    ) / 100;

    if (totalProb > 100) {
      return {
        success: false,
        message: `Total probability cannot exceed 100%. Current total: ${totalProb}%. Please reduce slot percentages.`
      };
    }

    updated.totalProbability = totalProb;

    setSpinGameSettings(updated);
    setIsConfigured(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(IS_CONFIGURED_KEY, 'true');

    try {
      const res = await safeFetch('/spin-game/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (res.ok && res.isJson && res.data?.success) {
        if (res.data.settings) {
          setSpinGameSettings(res.data.settings);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data.settings));
        }
        return {
          success: true,
          message: res.data.message || 'Spin & Win settings successfully saved in database!',
          settings: res.data.settings
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed saving spin settings to backend'
        };
      }
    } catch (err: any) {
      console.error('Error saving SpinGame settings:', err);
      return { success: true, message: 'Settings saved locally in browser storage' };
    }
  };

  const resetSpinSettings = () => {
    setSpinGameSettings(DEFAULT_SPIN_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SPIN_SETTINGS));
    } catch (e) {
      console.error('Error resetting spin settings:', e);
    }
  };

  const executeBackendSpin = async (
    token?: string,
    userId?: string,
    clientRequestId?: string,
    isTestMode?: boolean
  ) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const res = await safeFetch('/spin-game/spin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientRequestId: clientRequestId || '',
          isTestMode: !!isTestMode,
        }),
      });

      if (res.ok && res.isJson && res.data?.success) {
        return {
          success: true,
          winningSlotIndex: res.data.winningSlotIndex,
          winningSlot: res.data.winningSlot,
          coinsEarned: res.data.coinsEarned || 0,
          couponCode: res.data.couponCode || '',
          newTotalPoints: res.data.newTotalPoints || 0,
          availableRupees: res.data.availableRupees || 0,
          walletBalance: res.data.walletBalance || 0,
          isDuplicateReplay: res.data.isDuplicateReplay || false,
          message: res.data.message || 'Spin confirmed by backend',
        };
      }

      // If backend explicitly rejected due to daily free spin cooldown or duplicate replay
      if (res.data?.alreadySpun || res.status === 400 || res.status === 429) {
        return {
          success: false,
          alreadySpun: !!res.data?.alreadySpun,
          remainingMs: res.data?.remainingMs,
          message: res.data?.message || 'Daily free spin already claimed! Please try again tomorrow.',
          error: res.data?.message || 'Daily free spin cooldown active',
        };
      }

      // Only in explicit test mode without server connection, provide local simulation fallback
      if (isTestMode) {
        const slots = spinGameSettings.slots;
        const roll = Math.random() * 100;
        let cumulative = 0;
        let winIdx = 7;
        for (let i = 0; i < slots.length; i++) {
          cumulative += Number(slots[i].probability) || 0;
          if (roll < cumulative) {
            winIdx = i;
            break;
          }
        }
        const winSlot = slots[winIdx];
        return {
          success: true,
          winningSlotIndex: winIdx,
          winningSlot: winSlot,
          coinsEarned: winSlot.coinValue || 0,
          couponCode: winSlot.couponCode || '',
          newTotalPoints: 0,
          message: `Test Spin: ${winSlot.label}`,
        };
      }

      return {
        success: false,
        message: res.data?.message || res.error || 'Server rejected spin request',
        error: res.data?.message || res.error || 'Request failed',
      };
    } catch (err: any) {
      console.error('Error executing backend spin:', err);
      return {
        success: false,
        message: 'Network connection error while connecting to spin game server',
        error: err.message,
      };
    }
  };

  const simulateSpins = async (count: number = 1000, customSlots?: SpinSlotConfig[]): Promise<SimulationResult | null> => {
    try {
      const slotsToSend = customSlots || spinGameSettings.slots;
      const res = await safeFetch('/spin-game/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, slots: slotsToSend }),
      });

      if (res.ok && res.isJson && res.data?.success) {
        return res.data as SimulationResult;
      }
    } catch (err) {
      console.error('Error running backend simulation:', err);
    }

    // Client-side simulation fallback
    const slots = customSlots || spinGameSettings.slots;
    const tallies = slots.map((s, idx) => ({
      slotIndex: idx,
      slotNumber: idx + 1,
      label: s.label,
      rewardType: s.rewardType,
      configuredProbability: Number(s.probability) || 0,
      coinValue: Number(s.coinValue) || 0,
      wins: 0,
    }));

    let remainderHits = 0;
    for (let i = 0; i < count; i++) {
      const roll = Math.random() * 100;
      let cum = 0;
      let hit = false;
      for (let j = 0; j < slots.length; j++) {
        cum += Number(slots[j].probability) || 0;
        if (roll < cum) {
          tallies[j].wins++;
          hit = true;
          break;
        }
      }
      if (!hit) {
        remainderHits++;
        tallies[7].wins++;
      }
    }

    return {
      totalSpins: count,
      remainderHits,
      results: tallies.map((t) => {
        const empiricalPercentage = Math.round((t.wins / count) * 10000) / 100;
        const difference = Math.round((empiricalPercentage - t.configuredProbability) * 100) / 100;
        return {
          ...t,
          empiricalPercentage,
          difference,
        };
      }),
    };
  };

  return (
    <SpinGameContext.Provider
      value={{
        spinGameSettings,
        isConfigured,
        isLoading,
        refreshSettings,
        saveSpinSettings,
        resetSpinSettings,
        executeBackendSpin,
        simulateSpins,
      }}
    >
      {children}
    </SpinGameContext.Provider>
  );
};

export const useSpinGame = () => {
  const context = useContext(SpinGameContext);
  if (!context) {
    throw new Error('useSpinGame must be used within a SpinGameProvider');
  }
  return context;
};
