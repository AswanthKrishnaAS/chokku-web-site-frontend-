import React, { createContext, useContext, useState, useEffect } from 'react';

export interface GiftBoxRewardConfig {
  _id?: string;
  boxNumber: number;
  rewardType: 'coins' | 'product_offer';
  coinAmount?: number;
  productId?: string;
  productName?: string;
  productImage?: string;
  offerPercentage?: number;
  originalPrice?: number;
  offerPrice?: number;
  expiryDays?: number;
}

export interface CatchTheGiftGameSettings {
  giftCount: number;         // Set how many gift boxes should appear in the game (default 5)
  giftBoxCount: number;      // Gift box count (same as giftCount)
  coinCount: number;         // Set how many coins should appear in gameplay (default 10)
  pointsPerCoin: number;     // Points per coin collected (default 10)
  bombCount: number;         // Set how many bombs should appear in gameplay (default 3)
  pointsLossPerBomb: number; // Points loss per bomb hit (default 20)
  gameDuration: number;      // Game duration in seconds (default 25s)
  giftSpeed: number;         // Gift Box falling speed (default 1.5)
  coinSpeed: number;         // Coin falling speed (default 2.0)
  bombSpeed: number;         // Bomb/Boose falling speed (default 2.2)
  giftBoxes: GiftBoxRewardConfig[]; // Per-box rewards configuration list
}

export const DEFAULT_GAME_SETTINGS: CatchTheGiftGameSettings = {
  giftCount: 5,
  giftBoxCount: 5,
  coinCount: 10,
  pointsPerCoin: 10,
  bombCount: 3,
  pointsLossPerBomb: 20,
  gameDuration: 25,
  giftSpeed: 1.5,
  coinSpeed: 2.0,
  bombSpeed: 2.2,
  giftBoxes: [
    { boxNumber: 1, rewardType: 'coins', coinAmount: 1000 },
    { boxNumber: 2, rewardType: 'coins', coinAmount: 5000 },
    { boxNumber: 3, rewardType: 'product_offer', offerPercentage: 50, productName: 'Special Product', originalPrice: 1000, offerPrice: 500, expiryDays: 7 },
    { boxNumber: 4, rewardType: 'coins', coinAmount: 2500 },
    { boxNumber: 5, rewardType: 'product_offer', offerPercentage: 30, productName: 'Exclusive Product', originalPrice: 1500, offerPrice: 1050, expiryDays: 7 },
  ],
};

interface GameSettingsContextType {
  catchTheGiftSettings: CatchTheGiftGameSettings;
  isConfigured: boolean;
  createCatchTheGiftSettings: (settings: Partial<CatchTheGiftGameSettings>) => Promise<{ success: boolean; message: string }>;
  updateCatchTheGiftSettings: (settings: Partial<CatchTheGiftGameSettings>) => Promise<{ success: boolean; message: string }>;
  resetCatchTheGiftSettings: () => void;
  refreshSettings: () => Promise<void>;
}

const GameSettingsContext = createContext<GameSettingsContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const STORAGE_KEY = 'chokku_catch_the_gift_game_settings_v1';
const IS_CONFIGURED_KEY = 'chokku_catch_game_is_configured_v1';

export const GameSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catchTheGiftSettings, setCatchTheGiftSettings] = useState<CatchTheGiftGameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_GAME_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading local game settings:', e);
    }
    return DEFAULT_GAME_SETTINGS;
  });

  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return localStorage.getItem(IS_CONFIGURED_KEY) === 'true';
  });

  const refreshSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/catch-game/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setCatchTheGiftSettings({ ...DEFAULT_GAME_SETTINGS, ...data.settings });
          setIsConfigured(!!data.isConfigured);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.settings));
          localStorage.setItem(IS_CONFIGURED_KEY, data.isConfigured ? 'true' : 'false');
        }
      }
    } catch (err) {
      console.warn('Could not fetch CatchGame settings from server:', err);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Create Settings (POST /api/catch-game/settings) - Allowed 1 time only!
  const createCatchTheGiftSettings = async (newSettings: Partial<CatchTheGiftGameSettings>) => {
    const updated = { ...catchTheGiftSettings, ...newSettings };
    setCatchTheGiftSettings(updated);
    setIsConfigured(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(IS_CONFIGURED_KEY, 'true');

    try {
      const res = await fetch(`${API_URL}/catch-game/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || 'Game settings created in database' };
      } else {
        return { success: false, message: data.message || 'Settings already created' };
      }
    } catch (err: any) {
      console.error('Error creating CatchGame settings:', err);
      return { success: true, message: 'Settings created locally' };
    }
  };

  // Update Settings (PUT /api/catch-game/settings)
  const updateCatchTheGiftSettings = async (newSettings: Partial<CatchTheGiftGameSettings>) => {
    const updated = { ...catchTheGiftSettings, ...newSettings };
    setCatchTheGiftSettings(updated);
    setIsConfigured(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(IS_CONFIGURED_KEY, 'true');

    try {
      const res = await fetch(`${API_URL}/catch-game/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message || 'Game settings updated successfully' };
      } else {
        return { success: false, message: data.message || 'Failed updating backend settings' };
      }
    } catch (err: any) {
      console.error('Error updating CatchGame settings:', err);
      return { success: true, message: 'Settings saved locally' };
    }
  };

  const resetCatchTheGiftSettings = () => {
    setCatchTheGiftSettings(DEFAULT_GAME_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GAME_SETTINGS));
    } catch (e) {
      console.error('Error resetting game settings:', e);
    }
  };

  return (
    <GameSettingsContext.Provider
      value={{
        catchTheGiftSettings,
        isConfigured,
        createCatchTheGiftSettings,
        updateCatchTheGiftSettings,
        resetCatchTheGiftSettings,
        refreshSettings,
      }}
    >
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = () => {
  const context = useContext(GameSettingsContext);
  if (!context) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  return context;
};
