import { io, Socket } from 'socket.io-client';

const rawUrl = (import.meta.env.VITE_API_URL || '').trim();
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const backendOrigin = rawUrl 
  ? rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '') 
  : (isLocal ? 'http://localhost:5000' : 'https://chokku-web-site-backend.onrender.com');

const SOCKET_URL = backendOrigin;

// Singleton pattern: prevent creating multiple WebSocket connections across Vite HMR or re-renders
const GLOBAL_SOCKET_KEY = '__CHOKKU_STORE_SOCKET_INSTANCE__';

const getOrCreateSocket = (): Socket => {
  if (typeof window !== 'undefined' && (window as any)[GLOBAL_SOCKET_KEY]) {
    return (window as any)[GLOBAL_SOCKET_KEY];
  }

  const newSocket = io(SOCKET_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  if (typeof window !== 'undefined') {
    (window as any)[GLOBAL_SOCKET_KEY] = newSocket;

    // Clean up connection on page unload
    window.addEventListener('beforeunload', () => {
      newSocket.disconnect();
    });
  }

  return newSocket;
};

export const socket = getOrCreateSocket();
