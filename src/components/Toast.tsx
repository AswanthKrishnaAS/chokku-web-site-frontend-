import React from 'react';
import { useToast, ToastType } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, X } from 'lucide-react';

interface ToastTheme {
  border: string;
  shadow: string;
  iconBg: string;
  icon: React.ReactNode;
}

const getToastTheme = (type: ToastType): ToastTheme => {
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
      className="fixed top-3 left-0 right-0 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex flex-col items-center sm:items-end gap-2 px-3 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => {
        const theme = getToastTheme(toast.type);

        return (
          <div
            key={toast.id}
            role="alert"
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-white/95 backdrop-blur-md border ${theme.border} ${theme.shadow} transition-all duration-200 animate-toast-enter active:scale-95 cursor-pointer max-w-[94vw] sm:max-w-md w-auto`}
          >
            {/* Only Status Icon Added */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${theme.iconBg} flex items-center justify-center shrink-0`}
            >
              {theme.icon}
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
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors shrink-0 ml-0.5 active:scale-90"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5 stroke-[2.3]" />
            </button>
          </div>
        );
      })}
    </div>
  );
};


