import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { safeFetch } from '../utils/api';

interface ServerStatusContextType {
  isServerConnected: boolean;
  isChecking: boolean;
  checkServerConnection: (force?: boolean) => Promise<boolean>;
  setServerDisconnected: () => void;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

// Cache cooldown: do not re-request /health within 10 seconds unless forced (e.g. user clicks retry)
const HEALTH_CHECK_COOLDOWN_MS = 10000;

export const ServerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Mutable refs to track state without causing unnecessary re-renders or stale closures
  const isConnectedRef = useRef<boolean>(true);
  const inFlightPromiseRef = useRef<Promise<boolean> | null>(null);
  const lastCheckTimestampRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  const checkServerConnection = useCallback(async (force: boolean = false): Promise<boolean> => {
    const now = Date.now();

    // 1. If request is already in-flight, reuse existing promise (prevents duplicate requests in StrictMode/concurrent calls)
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    // 2. If checked recently within cooldown and not forced, return cached status
    if (!force && now - lastCheckTimestampRef.current < HEALTH_CHECK_COOLDOWN_MS) {
      return isConnectedRef.current;
    }

    // 3. Abort any previous lingering controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsChecking(true);

    const executeCheck = async (): Promise<boolean> => {
      let timeoutId: number | null = null;
      try {
        // 12-second timeout for free-tier cloud instances
        timeoutId = window.setTimeout(() => {
          controller.abort();
        }, 12000);

        const res = await safeFetch('/health', {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });

        if (timeoutId) clearTimeout(timeoutId);

        lastCheckTimestampRef.current = Date.now();

        if (res.ok) {
          isConnectedRef.current = true;
          setIsServerConnected(true);
          return true;
        } else {
          isConnectedRef.current = false;
          setIsServerConnected(false);
          return false;
        }
      } catch (err: any) {
        if (timeoutId) clearTimeout(timeoutId);
        // If aborted by unmount or superseded by a new check, preserve state without error
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          return isConnectedRef.current;
        }
        isConnectedRef.current = false;
        setIsServerConnected(false);
        return false;
      } finally {
        setIsChecking(false);
        inFlightPromiseRef.current = null;
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    };

    inFlightPromiseRef.current = executeCheck();
    return inFlightPromiseRef.current;
  }, []);

  const setServerDisconnected = useCallback(() => {
    isConnectedRef.current = false;
    setIsServerConnected(false);
  }, []);

  // 1. Initial health check on mount (deduplicated in React StrictMode)
  useEffect(() => {
    checkServerConnection();

    return () => {
      // Abort active fetch if unmounted
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [checkServerConnection]);

  // 2. Adaptive recovery polling: ONLY poll when server is DISCONNECTED to detect recovery
  useEffect(() => {
    if (isServerConnected) {
      // Server is healthy - clear any polling interval to prevent unnecessary requests
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Only when server is disconnected, poll every 15s to detect recovery
    const checkRecovery = () => {
      if (document.hidden) return; // Don't poll in background tabs
      checkServerConnection(true);
    };

    pollIntervalRef.current = window.setInterval(checkRecovery, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isServerConnected, checkServerConnection]);

  // 3. Event listeners: Online/Offline network state & Visibility Change
  useEffect(() => {
    const handleOnline = () => {
      checkServerConnection(true);
    };

    const handleOffline = () => {
      isConnectedRef.current = false;
      setIsServerConnected(false);
    };

    const handleVisibilityChange = () => {
      // When user returns to tab and server was marked disconnected, check if it recovered
      if (!document.hidden && !isConnectedRef.current) {
        checkServerConnection(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkServerConnection]);

  return (
    <ServerStatusContext.Provider
      value={{
        isServerConnected,
        isChecking,
        checkServerConnection,
        setServerDisconnected,
      }}
    >
      {children}
    </ServerStatusContext.Provider>
  );
};

export const useServerStatus = () => {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus must be used within a ServerStatusProvider');
  }
  return context;
};
