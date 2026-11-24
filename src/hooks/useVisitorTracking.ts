import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { sendVisitorHeartbeat, notifyPageChange, trackEvent } from '../utils/analyticsTracker';
import { socket } from '../socket';

export const useVisitorTracking = () => {
  const location = useLocation();
  const lastPathRef = useRef<string>('');

  // Page view tracking on location change
  useEffect(() => {
    const currentPath = location.pathname;
    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath;

      // Don't track admin dashboard sub-navigation as public page views if not needed
      const isPublicPage = !currentPath.startsWith('/admin-dashboard');

      if (isPublicPage) {
        trackEvent({
          eventType: 'page_view',
          page: currentPath,
          pageTitle: typeof document !== 'undefined' ? document.title : '',
        });
      }

      notifyPageChange(currentPath);
      sendVisitorHeartbeat({ currentPage: currentPath });
    }
  }, [location.pathname]);

  // Periodic heartbeat every 20 seconds
  useEffect(() => {
    // Send immediate heartbeat on mount or socket connect
    const onConnect = () => {
      sendVisitorHeartbeat();
    };

    if (socket.connected) {
      sendVisitorHeartbeat();
    } else {
      socket.on('connect', onConnect);
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendVisitorHeartbeat();
      }
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendVisitorHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect', onConnect);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

