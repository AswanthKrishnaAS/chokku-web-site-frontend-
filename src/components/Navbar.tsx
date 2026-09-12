import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, ShoppingCart, ChevronDown, Menu, X, Sparkles, Bell, Percent, Gamepad2, Gift, Heart, Coins } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import chokkuLogo from '../assets/img/chokku.png';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);

  const { totalItems } = useCart();
  const { user, isAuthenticated, customerPoints, orders } = useAuth();
  const { navbarLogo } = useWebsiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsSearchOpen(false);
    setIsNotificationOpen(false);
  };

  // Auto-close navbar & popovers on route/location change
  useEffect(() => {
    closeAllMenus();
  }, [location.pathname, location.search]);

  // Auto-close navbar & popovers on window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen || isCategoryDropdownOpen || isSearchOpen || isNotificationOpen) {
        closeAllMenus();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen, isCategoryDropdownOpen, isSearchOpen, isNotificationOpen]);

  // Smooth points update animation state
  const [isPointsAnimating, setIsPointsAnimating] = useState(false);
  const prevPointsRef = useRef(customerPoints);

  useEffect(() => {
    if (prevPointsRef.current !== customerPoints) {
      setIsPointsAnimating(true);
      const timer = setTimeout(() => setIsPointsAnimating(false), 1200);
      prevPointsRef.current = customerPoints;
      return () => clearTimeout(timer);
    }
  }, [customerPoints]);

  useEffect(() => {
    if (orders && orders.length > 0) {
      setHasUnreadNotifications(true);
    } else {
      setHasUnreadNotifications(false);
    }
  }, [orders]);

  const notifications = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.map((ord) => {
      const statusIcon =
        ord.status === 'Delivered'
          ? '✅'
          : ord.status === 'Cancelled'
          ? '❌'
          : ord.status === 'Shipped'
          ? '🚚'
          : '📦';

      return {
        id: `notif-${ord.id}`,
        icon: statusIcon,
        title: `Order ${ord.id}`,
        message: `Status: ${ord.status} • Total: ₹${ord.totalAmount.toFixed(2)}`,
        time: ord.date,
        link: '/orders',
      };
    });
  }, [orders]);

  // Close search & notification when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      closeAllMenus();
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs w-full transition-all">
      {/* ===== MOBILE HEADER (lg:hidden) matching Image 2 ===== */}
      <div className="lg:hidden w-full px-3 py-2 space-y-2">
        {/* Top Row: Logo | Search Input | Bell | Cart */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center py-0.5">
            <img
              src={navbarLogo || chokkuLogo}
              alt="chokku store logo"
              className="h-24 xs:h-18 sm:h-20 w-auto object-contain max-w-[160px] xs:max-w-[210px] sm:max-w-[280px] transition-all"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== chokkuLogo) {
                  target.src = chokkuLogo;
                }
              }}
            />
          </Link>

          {/* Search Bar Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative max-w-[200px] xs:max-w-none">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products"
              className="w-full py-1.5 pl-8 pr-3 text-xs text-gray-800 bg-gray-50/90 border border-gray-200 rounded-full focus:outline-none focus:border-[#488710] focus:bg-white transition-all shadow-2xs placeholder:text-gray-400"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </form>

          {/* Icons: Bell & Cart */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bell Notification Icon */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setHasUnreadNotifications(false);
                }}
                className="relative p-1.5 text-gray-700 hover:text-[#488710] rounded-full hover:bg-gray-50 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[2]" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#488710] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 animate-slide-down">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#488710]" />
                      <h4 className="font-extrabold text-gray-900 text-xs">Notifications</h4>
                    </div>
                    <span className="text-[9px] font-bold text-[#488710] bg-[#f0f9e8] px-2 py-0.5 rounded-full border border-[#d2ea9d]">
                      {notifications.length} New
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-gray-400 font-medium text-xs">
                        No Notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setIsNotificationOpen(false);
                            if (n.link) navigate(n.link);
                          }}
                          className="p-2 bg-gray-50 hover:bg-[#f0f9e8] rounded-xl transition-all cursor-pointer flex items-center gap-2"
                        >
                          <span className="text-sm">{n.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart Icon with Green Badge */}
            <Link
              to="/cart"
              className="relative p-1.5 text-gray-700 hover:text-[#488710] rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 stroke-[2]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#488710] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Bottom Row: Quick Nav Pill Cards (Menu | Offers | Play & Win | Wishlist | Points Count) */}
        <div className="grid grid-cols-5 gap-1.5 pt-1.5 border-t border-gray-100/60">
          {/* 1. Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-[#f8faf6] hover:bg-[#f0f9e8] rounded-xl border border-gray-100 transition-all group"
          >
            <Menu className="w-4 h-4 text-[#488710] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-gray-700 mt-0.5">Menu</span>
          </button>

          {/* 2. Offers */}
          <Link
            to="/shop?tag=offers"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-[#f8faf6] hover:bg-[#f0f9e8] rounded-xl border border-gray-100 transition-all group"
          >
            <Percent className="w-4 h-4 text-[#488710] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-gray-700 mt-0.5">Offers</span>
          </Link>

          {/* 3. Play & Win */}
          <Link
            to="/play-and-win"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-[#f8faf6] hover:bg-[#f0f9e8] rounded-xl border border-gray-100 transition-all group"
          >
            <Gift className="w-4 h-4 text-[#488710] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-gray-700 mt-0.5 leading-none text-center">Play &amp; Win</span>
          </Link>

          {/* 4. Wishlist */}
          <Link
            to="/shop"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-[#f8faf6] hover:bg-[#f0f9e8] rounded-xl border border-gray-100 transition-all group"
          >
            <Heart className="w-4 h-4 text-[#488710] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-gray-700 mt-0.5">Wishlist</span>
          </Link>

          {/* 5. Points Count (Placed right next to Wishlist!) */}
          <Link
            to={isAuthenticated ? '/points' : '/login'}
            className={`flex flex-col items-center justify-center py-1 px-0.5 bg-gradient-to-br from-[#386b0c] via-[#488710] to-[#609f00] text-white rounded-xl border border-emerald-300/40 transition-all cursor-pointer group shadow-2xs ${
              isPointsAnimating
                ? 'scale-105 ring-2 ring-amber-300 bg-amber-500 shadow-md'
                : 'hover:scale-105 active:scale-95'
            }`}
            title={isAuthenticated ? 'Your Total Game Points' : 'Sign In to view points'}
          >
            <div className="flex items-center gap-0.5">
              <span className="text-xs">🪙</span>
              <span className="text-[10px] font-black tracking-tight leading-tight">
                {isAuthenticated ? customerPoints.toLocaleString() : '0'}
              </span>
            </div>
            <span className="text-[9px] font-black text-amber-200 mt-0.5 tracking-tight uppercase">
              {isAuthenticated ? 'PTS' : 'Points'}
            </span>
          </Link>
        </div>
      </div>

      {/* ===== DESKTOP HEADER (hidden lg:flex) ===== */}
      <div className="hidden lg:flex w-full px-4 sm:px-8 lg:px-12 py-3 items-center justify-between gap-4 sm:gap-6 min-h-[88px] sm:min-h-[100px]">
        {/* Left: Prominent & Extra Large Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group py-1" title="Chokku Store Home">
          <img
            src={navbarLogo || chokkuLogo}
            alt="chokku store logo"
            className="h-14 sm:h-20 md:h-24 lg:h-26 max-w-[320px] sm:max-w-[460px] w-auto object-contain transition-all duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== chokkuLogo) {
                target.src = chokkuLogo;
              }
            }}
          />
        </Link>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-2 xl:gap-3 text-sm font-bold text-gray-800">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4.5 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                  : 'text-gray-700 hover:text-[#488710] hover:bg-[#f6fcf1]'
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/shop"
            className={({ isActive }) =>
              `px-4.5 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                  : 'text-gray-700 hover:text-[#488710] hover:bg-[#f6fcf1]'
              }`
            }
          >
            Shop
          </NavLink>

          {/* Categories Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsCategoryDropdownOpen(true)}
            onMouseLeave={() => setIsCategoryDropdownOpen(false)}
          >
            <button className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-full text-gray-700 hover:text-[#488710] hover:bg-[#f6fcf1] transition-all duration-200 font-bold">
              <span>Categories</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isCategoryDropdownOpen ? 'rotate-180 text-[#488710]' : ''
                }`}
              />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-100 py-3 z-50 animate-fade-in divide-y divide-gray-50">
                <div className="px-4 py-1.5 text-[11px] font-extrabold text-[#488710] uppercase tracking-wider flex items-center justify-between">
                  <span>All Categories</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="py-1">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f0f9e8] hover:text-[#488710] transition-colors group"
                    >
                      <span className="font-semibold group-hover:translate-x-0.5 transition-transform">
                        {cat.name}
                      </span>
                      <span className="text-xs text-[#488710] bg-[#f0f9e8] px-2.5 py-0.5 rounded-full font-bold">
                        {cat.itemCount}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <NavLink
            to="/shop?tag=offers"
            className={({ isActive }) =>
              `px-4.5 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                  : 'text-gray-700 hover:text-[#488710] hover:bg-[#f6fcf1]'
              }`
            }
          >
            Offers
          </NavLink>

          <NavLink
            to="/play-and-win"
            className={({ isActive }) =>
              `px-4.5 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                  : 'text-gray-700 hover:text-[#488710] hover:bg-[#f6fcf1]'
              }`
            }
          >
            Play &amp; Win
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `px-4.5 py-2.5 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#f0f9e8] text-[#488710] font-extrabold shadow-2xs border border-[#d2ea9d]/60'
                  : 'text-gray-700 hover:text-[#488710] hover:bg-[#f6fcf1]'
              }`
            }
          >
            How It Works
          </NavLink>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search Icon Toggle */}
          <div ref={searchRef} className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2.5 text-[#1e293b] hover:text-[#488710] hover:bg-[#f0f9e8] rounded-full transition-all duration-200"
              title="Search Products"
              aria-label="Search Products"
            >
              <Search className="w-5 h-5 stroke-[2.3]" />
            </button>

            {/* Popup Search Dropdown */}
            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3.5 z-50 animate-fade-in">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    autoFocus
                    className="w-full py-2.5 pl-9 pr-8 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-[#488710] focus:bg-white"
                  />
                  <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                {/* Suggestions list */}
                {searchSuggestions.length > 0 && (
                  <div className="mt-2 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 p-2 hover:bg-[#f0f9e8] rounded-xl transition-colors"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-9 h-9 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-[#488710] font-bold">
                            ₹{product.price.toFixed(2)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell Icon */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setHasUnreadNotifications(false);
              }}
              className="relative p-2.5 text-[#1e293b] hover:text-[#488710] hover:bg-[#f0f9e8] rounded-full transition-all duration-200 flex items-center cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5 stroke-[2.3]" />
              {hasUnreadNotifications && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 animate-slide-down">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#488710]" />
                    <h4 className="font-extrabold text-gray-900 text-sm">Notifications</h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#488710] bg-[#f0f9e8] px-2.5 py-0.5 rounded-full border border-[#d2ea9d]">
                    {notifications.length} New
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 font-medium text-xs space-y-1">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                      <p className="font-bold text-gray-700">No Notifications</p>
                      <p className="text-[11px] text-gray-400">Your order status updates will appear here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setIsNotificationOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className="p-3 bg-gray-50/80 hover:bg-[#f0f9e8] rounded-2xl border border-gray-100 transition-all cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-base shrink-0 shadow-2xs">
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 leading-tight">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                          <span className="text-[9px] font-semibold text-gray-400 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Authenticated Customer Points Badge */}
          {isAuthenticated && (
            <Link
              to="/points"
              className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-[#386b0c] via-[#488710] to-[#609f00] text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs border border-emerald-300/40 transition-all duration-300 ${
                isPointsAnimating
                  ? 'scale-110 ring-4 ring-amber-300/80 bg-amber-500 shadow-md'
                  : 'scale-100 hover:scale-105'
              }`}
              title="Your Total Game Points"
            >
              <Coins className="w-4 h-4 fill-amber-300 text-amber-600" />
              <span>{customerPoints.toLocaleString()} PTS</span>
            </Link>
          )}

          <div className="w-px h-6 bg-gray-200/90 mx-0.5" />

          {/* User Icon */}
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className="p-2.5 text-[#1e293b] hover:text-[#488710] hover:bg-[#f0f9e8] rounded-full transition-all duration-200 flex items-center"
            title={isAuthenticated ? user?.name || 'Account' : 'Sign In'}
          >
            {isAuthenticated && user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#488710]"
              />
            ) : (
              <User className="w-5 h-5 stroke-[2.3]" />
            )}
          </Link>

          <div className="w-px h-6 bg-gray-200/90 mx-0.5" />

          {/* Shopping Cart Icon */}
          <Link
            to="/cart"
            className="relative p-2.5 text-[#1e293b] hover:text-[#488710] hover:bg-[#f0f9e8] rounded-full transition-all duration-200 flex items-center"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5 stroke-[2.3]" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#488710] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer (Toggled by Menu button) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-3 animate-slide-down shadow-xl">
          <nav className="flex flex-col space-y-1.5 text-sm font-semibold text-gray-800">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-[#f0f9e8] hover:text-[#488710]"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-[#f0f9e8] hover:text-[#488710]"
            >
              Shop
            </Link>
            <Link
              to="/shop?tag=offers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-[#f0f9e8] hover:text-[#488710]"
            >
              Offers
            </Link>
            <Link
              to="/play-and-win"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-[#f0f9e8] hover:text-[#488710]"
            >
              Play &amp; Win Arcade
            </Link>
            <Link
              to="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-[#f0f9e8] hover:text-[#488710]"
            >
              How It Works
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};





