import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (title: string, descriptionOrType?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentToastsRef = React.useRef<{ [key: string]: number }>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (title: string, descriptionOrType?: string, maybeType?: ToastType) => {
      let description: string | undefined = descriptionOrType;
      let type: ToastType = maybeType || 'success';

      // Check if 2nd parameter was actually the type (e.g. addToast("Saved", "success"))
      const validTypes: ToastType[] = ['success', 'error', 'info', 'warning'];
      if (!maybeType && descriptionOrType && validTypes.includes(descriptionOrType as ToastType)) {
        type = descriptionOrType as ToastType;
        description = undefined;
      }

      // De-duplicate if the exact same toast was created within the last 800ms
      const dedupeKey = `${title}_${type}`;
      const now = Date.now();
      if (recentToastsRef.current[dedupeKey] && now - recentToastsRef.current[dedupeKey] < 800) {
        return;
      }
      recentToastsRef.current[dedupeKey] = now;

      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = {
        id,
        title,
        description,
        type,
        createdAt: now,
      };

      // Remove any existing toast with the exact same title to prevent duplicate bubbles
      setToasts((prev) => {
        const withoutDuplicate = prev.filter((t) => t.title.toLowerCase() !== title.toLowerCase());
        return [...withoutDuplicate.slice(-1), newToast];
      });

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
