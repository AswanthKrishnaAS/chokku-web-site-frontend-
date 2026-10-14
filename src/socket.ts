import { io } from 'socket.io-client';

const rawUrl = (import.meta.env.VITE_API_URL || '').trim();
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const backendOrigin = rawUrl 
  ? rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '') 
  : (isLocal ? 'http://localhost:5000' : 'https://chokku-web-site-backend.onrender.com');

const SOCKET_URL = backendOrigin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
