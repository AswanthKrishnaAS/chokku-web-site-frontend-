import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border bg-white transition-all duration-300 animate-slide-up ${
              isSuccess
                ? 'border-brand-green/30 text-gray-800'
                : isError
                ? 'border-red-300 text-gray-800'
                : 'border-brand-blue/30 text-gray-800'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-brand-green" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-blue" />}
            </div>

            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
