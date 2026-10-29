import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, ShoppingCart, ChevronDown, Menu, X, Sparkles, Percent, Gamepad2, Gift, Heart, Coins } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../context/ProductContext';
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
  const { categories: dynamicCategories } = useCategories();
  const { products: storeProducts } = useProducts();

  const { totalItems } = useCart();
  const { user, isAuthenticated, customerPoints, orders } = useAuth();
  const { navbarLogo } = useWebsiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsCategoryDropdownOpen(false);
    setIsSearchOpen(false);
  };

  // Auto-close navbar & popovers on route/location change
  useEffect(() => {
    closeAllMenus();
  }, [location.pathname, location.search]);

  // Auto-close navbar & popovers on window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen || isCategoryDropdownOpen || isSearchOpen) {
        closeAllMenus();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen, isCategoryDropdownOpen, isSearchOpen]);

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

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
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

  // Populate search suggestions based on dynamic products
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase().trim();
      const words = q.split(/\s+/).filter(Boolean);
      const allProds = storeProducts.length > 0 ? storeProducts : PRODUCTS;
      const matches = allProds
        .filter((p) => {
          const text = [
            p.name,
            p.categoryName,
            p.category,
            p.description,
            ...(Array.isArray(p.tags) ? p.tags : []),
            ...(Array.isArray(p.highlights) ? p.highlights : []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return text.includes(q) || words.every((w) => text.includes(w));
        })
        .slice(0, 5);
      setSearchSuggestions(matches);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, storeProducts]);

  const navCategories = dynamicCategories.length > 0 ? dynamicCategories : CATEGORIES;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs w-full transition-all">
      {/* ===== TOP MARQUEE CONTAINER ("Special Welcome Order" / "spacal welocom order") ===== */}
      <div
        className="w-full bg-gradient-to-r from-[#1c3804] via-[#386b0c] to-[#1c3804] text-white py-1.5 px-3 overflow-hidden shadow-xs border-b border-[#2d5509]/60 relative z-20 group select-none"
        data-marquee="spacal welocom order"
        data-testid="navbar-marquee-spacal-welocom-order"
        role="region"
        aria-label="Special Welcome Order Announcements"
      >
        <Link
          to="/shop?tag=offers"
          className="flex overflow-hidden items-center justify-start cursor-pointer transition-opacity hover:opacity-95"
          title="Special Welcome Order - Click to explore exclusive offers"
        >
          <div className="animate-marquee-scroll flex items-center shrink-0">
            {/* Half 1 */}
            <div className="flex items-center gap-6 sm:gap-10 shrink-0 pr-6 sm:pr-10">
              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white tracking-wide">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                </span>
                <span className="font-black uppercase tracking-wider text-amber-200 bg-black/25 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-2xs text-[10px] sm:text-[11px]">
                  Special Welcome Order
                </span>
                <span className="text-white font-medium">
                  Flat 20% OFF on your welcome order! Use code: <span className="font-extrabold text-amber-300 underline underline-offset-2">WELCOME20</span>
                </span>
                <span className="sr-only">spacal welocom order</span>
              </div>

              <span className="text-emerald-300/40 text-sm font-bold">•</span>

              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white tracking-wide">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-300/30">
                  <Gift className="w-3 h-3 text-amber-300" />
                </span>
                <span className="font-black uppercase tracking-wider text-amber-200 bg-black/25 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-2xs text-[10px] sm:text-[11px]">
                  Special Welcome Order
                </span>
                <span className="text-white font-medium">
                 Free Express Delivery + Surprise Gift on all first orders!
                </span>
                <span className="sr-only">spacal welocom order</span>
              </div>

              <span className="text-emerald-300/40 text-sm font-bold">•</span>

              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white tracking-wide">
                {/* <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  <Coins className="w-3 h-3 text-amber-300" />
                </span> */}
                <span className="font-black uppercase tracking-wider text-amber-200 bg-black/25 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-2xs text-[10px] sm:text-[11px]">
                  Special Welcome Order
                </span>
                <span className="text-white font-medium">
                  🪙 100 Bonus Game Coins credited to your wallet instantly upon signup!
                </span>
                <span className="sr-only">spacal welocom order</span>
              </div>

              <span className="text-emerald-300/40 text-sm font-bold">•</span>
            </div>

            {/* Half 2 (Exact duplicate for seamless infinite loop) */}
            <div className="flex items-center gap-6 sm:gap-10 shrink-0 pr-6 sm:pr-10" aria-hidden="true">
              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white tracking-wide">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                </span>
                <span className="font-black uppercase tracking-wider text-amber-200 bg-black/25 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-2xs text-[10px] sm:text-[11px]">
                  Special Welcome Order
                </span>
                <span className="text-white font-medium">
                  Flat 20% OFF on your welcome order! Use code: <span className="font-extrabold text-amber-300 underline underline-offset-2">WELCOME20</span>
                </span>
                <span className="sr-only">spacal welocom order</span>
              </div>

              <span className="text-emerald-300/40 text-sm font-bold">•</span>

              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white tracking-wide">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-300/30">
                  <Gift className="w-3 h-3 text-amber-300" />
                </span>
                <span className="font-black uppercase tracking-wider text-amber-200 bg-black/25 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-2xs text-[10px] sm:text-[11px]">
                  Special Welcome Order
                </span>
                <span className="text-white font-medium">
                   Free Express Delivery + Surprise Gift on all first orders!
                </span>
                <span className="sr-only">spacal welocom order</span>
              </div>

              <span className="text-emerald-300/40 text-sm font-bold">•</span>

              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold text-white tracking-wide">
                <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  <Coins className="w-3 h-3 text-amber-300" />
                </span>
                <span className="font-black uppercase tracking-wider text-amber-200 bg-black/25 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-2xs text-[10px] sm:text-[11px]">
                  Special Welcome Order
                </span>
                <span className="text-white font-medium">
                  🪙 100 Bonus Game Coins credited to your wallet instantly upon signup!
                </span>
                <span className="sr-only">spacal welocom order</span>
              </div>

              <span className="text-emerald-300/40 text-sm font-bold">•</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ===== MOBILE HEADER (lg:hidden) matching Image 2 ===== */}
      <div className="lg:hidden w-full px-3 py-2 space-y-2">
        {/* Top Row: Logo | Search Input | Bell | Cart */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center py-0.5">
            {navbarLogo ? (
              <img
                src={navbarLogo}
                alt="Store logo"
                className="h-55 xs:h-16 sm:h-20 max-h-[100px] sm:max-h-[80px] w-auto object-contain transition-all"
              />
            ) : (
              <span className="text-xl xs:text-2xl font-black text-[#488710] tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-6 h-6 text-[#488710] shrink-0" />
                <span>Chokku Store</span>
              </span>
            )}
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

          {/* Icons: Cart */}
          <div className="flex items-center gap-1.5 shrink-0">

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
        {/* Left: Prominent Logo or Brand Name */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group py-1" title="Chokku Store Home">
          {navbarLogo ? (
            <img
              src={navbarLogo}
              alt="Store logo"
              className="h-16 sm:h-22 md:h-26 lg:h-30 max-h-[95px] max-w-[360px] sm:max-w-[500px] w-auto object-contain transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-2xl sm:text-3xl font-black text-[#488710] tracking-tight flex items-center gap-2 group-hover:scale-105 transition-transform">
              <Sparkles className="w-8 h-8 text-[#488710] shrink-0" />
              <span>Chokku Store</span>
            </span>
          )}
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
                  {navCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#f0f9e8] hover:text-[#488710] transition-colors group"
                    >
                      <span className="font-semibold group-hover:translate-x-0.5 transition-transform">
                        {cat.name}
                      </span>
                      {cat.itemCount !== undefined && (
                        <span className="text-xs text-[#488710] bg-[#f0f9e8] px-2.5 py-0.5 rounded-full font-bold">
                          {cat.itemCount}
                        </span>
                      )}
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





