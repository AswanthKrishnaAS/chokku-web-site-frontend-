import React, { useRef, useEffect } from 'react';
import { useToast, ToastType } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, X, PartyPopper } from 'lucide-react';
import toastMascotImg from '../assets/img/tost.png';

interface ToastTheme {
  border: string;
  shadow: string;
  iconBg: string;
  icon: React.ReactNode;
}

interface CanvasParticle {
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

/**
 * Ultra-smooth, GPU-accelerated HTML5 Canvas Confetti Burst.
 * Replaces static DOM spans with natural ballistic physics:
 * air resistance, parabolic arc gravity, 3D paper flipping wobble, and clean alpha decay.
 */
export const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 380;
    const height = 340;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const COLORS = [
      '#488710', // Chokku brand green
      '#64A901', // Bright lime
      '#F59E0B', // Warm gold
      '#EF4444', // Festive red
      '#0284C7', // Sky blue
      '#8B5CF6', // Royal purple
      '#EC4899', // Hot pink
      '#F97316', // Tangerine
      '#10B981', // Fresh emerald
    ];

    const particles: CanvasParticle[] = [];
    const count = 55;
    const originX = 24;
    const originY = 24;

    for (let i = 0; i < count; i++) {
      // Fan arc: directed downward and outward into screen (25 deg to 155 deg)
      const angle = (Math.PI / 180) * (25 + Math.random() * 130);
      const speed = 5 + Math.random() * 10;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 5 + Math.random() * 4,
        h: Math.random() > 0.35 ? 9 + Math.random() * 8 : 5 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.08 + Math.random() * 0.12,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        shape: Math.random() > 0.28 ? 'rect' : 'circle',
        opacity: 1,
      });
    }

    let animationId: number;
    let frame = 0;
    const maxFrames = 95;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      let alive = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Air drag & gravity
        p.vx *= 0.955;
        p.vy *= 0.955;
        p.vy += 0.32;
        p.x += p.vx;
        p.y += p.vy;

        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        if (frame > 45) {
          p.opacity = Math.max(0, 1 - (frame - 45) / (maxFrames - 45));
        }

        if (p.opacity > 0.01) {
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
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
            } else {
              ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
            ctx.fill();
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

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none select-none z-50 overflow-visible"
      style={{
        width: 380,
        height: 340,
        left: -12,
        top: -6,
      }}
    />
  );
};

const getToastTheme = (type: ToastType, isConfetti?: boolean): ToastTheme => {
  if (isConfetti) {
    return {
      border: 'border-emerald-300/90 ring-1 ring-emerald-400/20',
      shadow: 'shadow-lg shadow-[#488710]/15',
      iconBg: 'bg-[#f0f9e8] text-[#488710]',
      icon: <PartyPopper className="w-4.5 h-4.5 stroke-[2.2] text-[#488710] animate-popper-pop" />,
    };
  }

  switch (type) {
    case 'error':
      return {
        border: 'border-rose-200',
        shadow: 'shadow-lg shadow-rose-500/10',
        iconBg: 'bg-rose-50 text-rose-600',
        icon: <AlertCircle className="w-4.5 h-4.5 stroke-[2.5] text-rose-600" />,
      };
    case 'warning':
      return {
        border: 'border-amber-200',
        shadow: 'shadow-lg shadow-amber-500/10',
        iconBg: 'bg-amber-50 text-amber-600',
        icon: <AlertTriangle className="w-4.5 h-4.5 stroke-[2.5] text-amber-600" />,
      };
    case 'info':
      return {
        border: 'border-sky-200',
        shadow: 'shadow-lg shadow-sky-500/10',
        iconBg: 'bg-sky-50 text-sky-600',
        icon: <Sparkles className="w-4.5 h-4.5 stroke-[2.5] text-sky-600" />,
      };
    case 'success':
    default:
      return {
        border: 'border-emerald-200/90',
        shadow: 'shadow-lg shadow-[#488710]/10',
        iconBg: 'bg-[#f0f9e8] text-[#488710]',
        icon: <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5] text-[#488710]" />,
      };
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-3 left-0 right-0 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex flex-col items-center sm:items-end gap-2.5 px-3 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        const theme = getToastTheme(toast.type, toast.confetti);

        return (
          <div
            key={toast.id}
            className="relative flex flex-col items-center sm:items-end w-full max-w-[94vw] sm:max-w-md pointer-events-none"
          >
            {/* Celebratory Monkey Mascot (tost.png) - Clean, no floating extra emojis */}
            {toast.showMascot && (
              <div
                onClick={() => removeToast(toast.id)}
                className="relative flex items-end justify-center mb-0.5 select-none pointer-events-auto cursor-pointer animate-toast-mascot-up origin-bottom z-10"
              >
                <div className="relative animate-mascot-cheer">
                  <img
                    src={toastMascotImg}
                    alt="Chokku Mascot"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-md select-none transform hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            )}

            {/* Main Clean Toast Pill */}
            <div
              role="alert"
              onClick={() => removeToast(toast.id)}
              className={`pointer-events-auto relative flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/95 backdrop-blur-md border ${theme.border} ${theme.shadow} transition-all duration-200 animate-toast-enter active:scale-95 cursor-pointer max-w-[94vw] sm:max-w-md w-auto`}
            >
              {/* Status Icon Wrapper with Party-Popper Canvas Confetti */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${theme.iconBg} flex items-center justify-center shrink-0`}
                >
                  {theme.icon}
                </div>

                {/* Smooth, high-performance Canvas Confetti Burst without any extra icons */}
                {toast.confetti && <ConfettiCanvas />}
              </div>

              {/* Simple Text Content */}
              <div className="min-w-0 pr-1 flex items-baseline gap-1.5 truncate">
                <span className="font-extrabold text-xs sm:text-sm text-gray-900 tracking-tight whitespace-nowrap">
                  {toast.title}
                </span>
                {toast.description && (
                  <span className="text-[11px] sm:text-xs text-gray-500 font-medium truncate hidden xs:inline">
                    {toast.description}
                  </span>
                )}
              </div>

              {/* Simple Dismiss Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors shrink-0 ml-0.5 active:scale-90 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5 stroke-[2.3]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};


