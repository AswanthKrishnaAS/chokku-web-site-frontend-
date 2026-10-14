import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Globe, ChevronUp, ExternalLink, X, ArrowUpRight } from 'lucide-react';
import './InstagramWebsiteBar.css';

/**
 * Automatically retrieves the website URL already configured in the project.
 * Uses environment configuration if present, or falls back dynamically to the 
 * current window.location.origin (e.g. http://localhost:3000 or production domain).
 */
export const getWebsiteUrl = () => {
  // 1. Check environment variables if configured
  const envUrl =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_WEBSITE_URL ||
        import.meta.env.VITE_APP_URL ||
        import.meta.env.APP_URL)) ||
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.VITE_WEBSITE_URL ||
        process.env.VITE_APP_URL ||
        process.env.APP_URL)) ||
    '';

  if (envUrl && envUrl.trim() && envUrl !== 'MY_APP_URL') {
    return envUrl.trim();
  }

  // 2. Automatically use the website URL already running/configured in this project
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  return '/';
};

/**
 * Clean URL representation without http://, https://, www, or trailing slash
 */
export const formatDisplayUrl = (url) => {
  if (!url) return '';
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const InstagramWebsiteBar = ({ hasBottomNav: customHasBottomNav }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const touchStartY = useRef(null);
  const touchCurrentY = useRef(null);

  const websiteUrl = getWebsiteUrl();
  const displayUrl = formatDisplayUrl(websiteUrl);

  const pathname = location?.pathname || '';
  const isAdmin = pathname.startsWith('/admin');
  const isCheckout = pathname === '/checkout';

  // Determine whether mobile bottom nav is active on this page
  const hasBottomNav = typeof customHasBottomNav === 'boolean' 
    ? customHasBottomNav 
    : (!isAdmin && !isCheckout);

  // If user is inside admin routes, hide the bar completely to avoid interference
  if (isAdmin) {
    return null;
  }

  const handleOpenUrl = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Play smooth swipe-up animation on open
    setIsSwipingUp(true);
    setTimeout(() => {
      window.open(websiteUrl, '_blank', 'noopener,noreferrer');
      setIsSwipingUp(false);
    }, 280);
  };

  // Touch gesture handling for smooth swipe-up and swipe-down interaction
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    touchCurrentY.current = currentY;
    const deltaY = currentY - touchStartY.current;

    // Constrain drag offset for springy feeling
    if (deltaY < 0) {
      // Swiping up (max 50px resistance)
      setDragOffset(Math.max(deltaY, -50));
    } else if (deltaY > 0) {
      // Dragging down (max 40px resistance)
      setDragOffset(Math.min(deltaY, 40));
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current !== null && touchCurrentY.current !== null) {
      const deltaY = touchCurrentY.current - touchStartY.current;
      
      // Swipe Up threshold (-30px) -> Trigger Open
      if (deltaY < -30) {
        handleOpenUrl();
      } 
      // Swipe Down threshold (+35px) -> Minimize bar
      else if (deltaY > 35) {
        setIsMinimized(true);
      }
    }
    touchStartY.current = null;
    touchCurrentY.current = null;
    setDragOffset(0);
  };

  if (!isVisible) {
    return null;
  }

  // Minimized state - unobtrusive floating pill
  if (isMinimized) {
    return (
      <div 
        className={`ig-minimized-wrapper ${hasBottomNav ? 'has-bottom-nav' : ''}`}
        role="complementary"
        aria-label="Instagram Website Link"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="ig-minimized-pill"
          title="Show Instagram website bar"
          aria-label="Expand website link bar"
        >
          <div className="ig-minimized-icon-box">
            <Globe className="w-3.5 h-3.5 text-[#262626]" />
          </div>
          <span className="ig-minimized-text">{displayUrl}</span>
          <ChevronUp className="w-3.5 h-3.5 text-gray-500 animate-bounce" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`ig-website-bar-wrapper ${hasBottomNav ? 'has-bottom-nav' : ''} ${isSwipingUp ? 'is-swiping' : ''}`}
      style={{
        transform: dragOffset !== 0 ? `translateY(${dragOffset}px)` : undefined,
      }}
      role="complementary"
      aria-label="Instagram Website Link Bar"
    >
      <div
        className="ig-website-bar-card"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Indicator Handle (Instagram style) */}
        <div 
          className="ig-drag-handle-wrapper" 
          onClick={handleOpenUrl}
          title="Swipe up or click to open website"
        >
          <div className="ig-drag-handle" />
        </div>

        {/* Main Interactive Bar Content */}
        <div className="ig-bar-content" onClick={handleOpenUrl}>
          {/* Left: Website / Globe Icon badge */}
          <div className="ig-icon-badge">
            <div className="ig-icon-inner">
              <Globe className="w-4 h-4 text-[#262626] stroke-[2.2]" />
            </div>
            <span className="ig-status-dot" />
          </div>

          {/* Center: Website URL and Label */}
          <div className="ig-info-col">
            <div className="ig-url-row">
              <span className="ig-url-text" title={websiteUrl}>
                {displayUrl}
              </span>
              <span className="ig-verified-badge" title="Official Website">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#0095f6]" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </span>
            </div>
            <div className="ig-subtext-row">
              <span className="ig-subtext">Website link</span>
              <span className="ig-bullet">•</span>
              <span className="ig-action-hint">Swipe up to visit</span>
            </div>
          </div>

          {/* Right: Upward Arrow & Open Button Interaction */}
          <div className="ig-action-group">
            <button
              type="button"
              onClick={handleOpenUrl}
              className="ig-open-btn"
              aria-label={`Open website: ${websiteUrl}`}
            >
              <span className="ig-open-text">Visit</span>
              <div className="ig-arrow-wrapper">
                <ChevronUp className="w-4 h-4 ig-upward-chevron stroke-[2.5]" />
              </div>
            </button>

            {/* Subtle dismiss / minimize button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="ig-close-btn"
              title="Minimize website link"
              aria-label="Minimize website link"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramWebsiteBar;
