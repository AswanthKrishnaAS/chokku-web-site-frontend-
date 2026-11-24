import { socket } from '../socket';
import { safeFetch } from './api';

// Keys for persistent visitor and session tracking
const VISITOR_ID_KEY = 'chokku_analytics_visitor_id';
const SESSION_ID_KEY = 'chokku_analytics_session_id';

// Generate or retrieve persistent visitor ID (persists across visits)
export const getVisitorId = (): string => {
  if (typeof window === 'undefined') return 'guest_visitor';
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return `vis_${Date.now()}`;
  }
};

// Generate or retrieve session ID (lives per tab / browsing session)
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'guest_session';
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `sess_${Date.now()}`;
  }
};

// Detect basic device type and browser
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { deviceType: 'Desktop', browser: 'Unknown', os: 'Unknown' };
  }
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) {
    deviceType = 'Mobile';
  }

  let browser = 'Chrome';
  if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opera|opr\//i.test(ua)) browser = 'Opera';

  let os = 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';

  return { deviceType, browser, os };
};

export interface TrackEventPayload {
  eventType:
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'checkout_start'
  | 'checkout_complete'
  | 'game_play'
  | 'points_redeem';
  page?: string;
  pageTitle?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  category?: string;
  quantity?: number;
  orderId?: string;
  orderAmount?: number;
  gameType?: 'catch_the_gift' | 'spin_and_win' | 'treasure_hunt';
  score?: number;
  points?: number;
  metadata?: Record<string, any>;
}

// Track an event to backend DB API (non-blocking)
export const trackEvent = async (payload: TrackEventPayload): Promise<void> => {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    let userId: string | null = null;
    let userName = 'Guest Visitor hhh';
    let userRole = 'guest';

    try {
      const savedCustomer = localStorage.getItem('chokku_customer_user_v2');
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        userId = parsed.id || parsed._id || null;
        userName = parsed.name || parsed.username || 'Customer';
        userRole = 'customer';
      }
    } catch { }

    const body = {
      ...payload,
      visitorId,
      sessionId,
      userId,
      userName,
      userRole,
      page: payload.page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      pageTitle: payload.pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    };

    // Send asynchronously without awaiting
    safeFetch('/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => { });
  } catch (err) {
    // Non-fatal tracking catch
  }
};

// Send real-time heartbeat to socket
export const sendVisitorHeartbeat = (customData?: Record<string, any>) => {
  if (!socket || !socket.connected) return;

  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { deviceType, browser, os } = getDeviceInfo();

    let userId: string | null = null;
    let userName = 'Guest Visitor';
    let userEmail = '';
    let userRole = 'guest';

    try {
      const savedCustomer = localStorage.getItem('chokku_customer_user_v2');
      if (savedCustomer) {
        const parsed = JSON.parse(savedCustomer);
        userId = parsed.id || parsed._id || null;
        userName = parsed.name || parsed.username || 'Customer';
        userEmail = parsed.email || '';
        userRole = 'customer';
      }
    } catch { }

    // Check cart items
    let hasActiveCart = false;
    let cartItemsCount = 0;
    try {
      const savedCart = localStorage.getItem('ecoblue_cart_v1');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        if (Array.isArray(items) && items.length > 0) {
          hasActiveCart = true;
          cartItemsCount = items.length;
        }
      }
    } catch { }

    const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';
    const pageTitle = typeof document !== 'undefined' ? document.title : 'Chokku Store';

    socket.emit('visitor_heartbeat', {
      sessionId,
      visitorId,
      userId,
      userName,
      userEmail,
      userRole,
      currentPage,
      pageTitle,
      deviceType,
      browser,
      os,
      hasActiveCart,
      cartItemsCount,
      ...customData,
    });
  } catch (err) {
    // Ignore heartbeat error
  }
};

// Notify page navigation on socket
export const notifyPageChange = (pathname: string, title?: string) => {
  if (!socket) return;
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    socket.emit('visitor_page_change', {
      sessionId,
      visitorId,
      currentPage: pathname,
      pageTitle: title || (typeof document !== 'undefined' ? document.title : ''),
    });
  } catch { }
};

// Notify cart update on socket
export const notifyCartUpdate = (hasActiveCart: boolean, cartItemsCount: number, cartTotalAmount: number = 0) => {
  if (!socket) return;
  try {
    const sessionId = getSessionId();
    socket.emit('visitor_cart_update', {
      sessionId,
      hasActiveCart,
      cartItemsCount,
      cartTotalAmount,
    });
  } catch { }
};

