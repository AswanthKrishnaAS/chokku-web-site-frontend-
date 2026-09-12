import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ServerStatusContextType {
  isServerConnected: boolean;
  isChecking: boolean;
  checkServerConnection: () => Promise<boolean>;
  setServerDisconnected: () => void;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ServerStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkServerConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setIsServerConnected(true);
        return true;
      } else {
        setIsServerConnected(false);
        return false;
      }
    } catch {
      setIsServerConnected(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const setServerDisconnected = useCallback(() => {
    setIsServerConnected(false);
  }, []);

  useEffect(() => {
    checkServerConnection();

    // Periodically re-check connection every 15 seconds
    const interval = setInterval(() => {
      checkServerConnection();
    }, 15000);

    return () => clearInterval(interval);
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
