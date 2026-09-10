import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import notificationSound from '../assets/notification.mp3';

interface TreasureCoinProps {
  pageId: 'home' | 'shop' | 'product' | 'category' | 'cart';
}

export const TreasureCoin: React.FC<TreasureCoinProps> = ({ pageId }) => {
  const { addToast } = useToast();
  const [isCollected, setIsCollected] = useState(false);
  const [collectedCoins, setCollectedCoins] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chokku_collected_coins');
      const list: string[] = saved ? JSON.parse(saved) : [];
      setCollectedCoins(list);
      if (list.includes(pageId)) {
        setIsCollected(true);
      }
    } catch {}
  }, [pageId]);

  if (isCollected) return null;

  const handleCollectCoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('chokku_collected_coins');
      const list: string[] = saved ? JSON.parse(saved) : [];
      if (!list.includes(pageId)) {
        const newList = [...list, pageId];
        localStorage.setItem('chokku_collected_coins', JSON.stringify(newList));
        setCollectedCoins(newList);
        setIsCollected(true);

        // Sound effect
        try {
          const audio = new Audio(notificationSound);
          audio.volume = 0.8;
          audio.play().catch(() => {});
        } catch {}

        if (newList.length === 5) {
          addToast('🎉 TREASURE UNLOCKED!', 'You collected all 5 coins! Go to Play & Win to claim ₹500 coupon & 500 points!', 'success');
        } else {
          addToast('🪙 Golden Coin Collected!', `Found coin ${newList.length}/5! Collect all 5 to win ₹500 coupon!`, 'success');
        }
      }
    } catch (err) {
      console.error('Error collecting coin:', err);
    }
  };

  return (
    <div
      onClick={handleCollectCoin}
      className="fixed bottom-24 right-5 z-40 cursor-pointer group animate-bounce"
      title="Tap to collect golden coin for Treasure Hunt!"
    >
      <div className="relative flex items-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 px-3.5 py-2 rounded-full shadow-2xl border-2 border-yellow-200 hover:scale-110 transition-transform">
        <div className="w-8 h-8 rounded-full bg-yellow-300 border-2 border-amber-600 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
          🪙
        </div>
        <div className="hidden sm:block text-left text-xs font-black leading-tight">
          <p className="flex items-center gap-1">
            <span>Coin Found!</span>
            <Sparkles className="w-3 h-3 text-amber-900" />
          </p>
          <p className="text-[10px] opacity-80 font-bold">Tap to collect ({collectedCoins.length + 1}/5)</p>
        </div>
      </div>
    </div>
  );
};
