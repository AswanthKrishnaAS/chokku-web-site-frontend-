import React from 'react';
import { Sliders, Target, Cpu, X, Maximize2, Minimize2 } from 'lucide-react';
import { Product } from '../../types';
import { FrameMode } from '../../services/accessoryTransform';

interface TryOnControlsProps {
  product: Product;
  earringScale: number;
  setEarringScale: (val: number) => void;
  frameMode?: FrameMode;
  setFrameMode?: (mode: FrameMode) => void;
  showLandmarks: boolean;
  setShowLandmarks: (val: boolean) => void;
  showDebug: boolean;
  setShowDebug: (val: boolean) => void;
  onClose: () => void;
}

export const TryOnControls: React.FC<TryOnControlsProps> = ({
  product,
  earringScale,
  setEarringScale,
  frameMode = 'auto',
  setFrameMode,
  showLandmarks,
  setShowLandmarks,
  showDebug,
  setShowDebug,
  onClose,
}) => {
  // Determine current size category from numerical scale
  const currentSize = earringScale <= 0.85 ? 'Small' : earringScale >= 1.2 ? 'Large' : 'Medium';
  const isDress = product?.tryOnType === 'Dress';

  return (
    <div className="absolute bottom-28 inset-x-4 z-50 bg-black/85 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-white shadow-2xl space-y-4 max-w-md mx-auto animate-fadeIn">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> AR Fit & Alignment Controls
        </span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xs font-bold cursor-pointer p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Frame Mode Selector for Dress Try-On */}
      {isDress && setFrameMode && (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
            Dress Camera Frame Mode:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFrameMode('half')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                frameMode === 'half'
                  ? 'bg-amber-500 text-black border-amber-300 shadow-md font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" /> Half Frame
            </button>
            <button
              type="button"
              onClick={() => setFrameMode('full')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                frameMode === 'full'
                  ? 'bg-amber-500 text-black border-amber-300 shadow-md font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Full Body
            </button>
            <button
              type="button"
              onClick={() => setFrameMode('auto')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                frameMode === 'auto'
                  ? 'bg-emerald-500 text-white border-emerald-300 shadow-md font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Auto Detect
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-medium pt-0.5">
            {frameMode === 'half'
              ? 'Half Frame: Crops lower dress naturally at canvas bottom for upper body shots.'
              : frameMode === 'full'
              ? 'Full Body: Fits complete dress from shoulders down to knees/feet.'
              : 'Auto: Automatically adapts frame according to body distance.'}
          </p>
        </div>
      )}

      {/* Product Size Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300">
          Product Size:
        </label>
        <select
          value={currentSize}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'Small') setEarringScale(0.75);
            else if (val === 'Large') setEarringScale(1.35);
            else setEarringScale(1.0);
          }}
          className="w-full px-3.5 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-emerald-400 cursor-pointer"
        >
          <option value="Small" className="bg-slate-900 text-white">Small</option>
          <option value="Medium" className="bg-slate-900 text-white">Medium</option>
          <option value="Large" className="bg-slate-900 text-white">Large</option>
        </select>
      </div>

      {/* Toggles */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> Show Target Points
          </span>
          <input
            type="checkbox"
            checked={showLandmarks}
            onChange={(e) => setShowLandmarks(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Enable Debug Mode HUD
          </span>
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
