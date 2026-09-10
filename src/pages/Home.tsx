import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Flame,
  Gift,
  Mail,
  Star,
  Gamepad2,
  Percent,
  LayoutGrid,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useWebsiteSettings } from '../context/WebsiteSettingsContext';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../context/ProductContext';
import { TreasureCoin } from '../components/TreasureCoin';
import heroImg from '../assets/img/img.png';
import chokkuLogo from '../assets/img/chokku.png';

export const Home: React.FC = () => {
  const { homeSliders } = useWebsiteSettings();
  const { categories: dynamicCategories } = useCategories();
  const { products: storeProducts } = useProducts();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const activeHomeSliders = homeSliders.filter((s) => s.status !== 'Inactive');

  const slides = activeHomeSliders.length > 0
    ? activeHomeSliders
    : [
        {
          id: '1',
          image: heroImg,
          metaTag: 'SPECIAL OFFER',
          heading: 'ZXCZXC',
          subheading: 'sdcdscd',
          buttonText: 'SHOP NOW',
          buttonLink: '/shop',
        },
        {
          id: '2',
          image: heroImg,
          metaTag: 'SPECIAL OFFER',
          heading: 'ZXCZXC',
          subheading: 'sdcdscd',
          buttonText: 'SHOP NOW',
          buttonLink: '/shop',
        },
      ];

  // Auto-play carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeCategories = dynamicCategories.filter((c) => (c as any).status !== 'Inactive');

  const fallbackCategories = [
    {
      id: 'cat-sarees',
      name: 'Sarees',
      slug: 'sarees',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cat-lehenga',
      name: 'Lehenga',
      slug: 'lehenga',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cat-kurtis',
      name: 'Kurtis',
      slug: 'kurtis',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cat-jewellery',
      name: 'Jewellery',
      slug: 'jewellery',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cat-men',
      name: 'Men Wear',
      slug: 'men-wear',
      image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'cat-electronics',
      name: 'Electronics',
      slug: 'electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const allCategories = activeCategories.length > 0 ? activeCategories : fallbackCategories;
  const displayedCategories = showAllCategories ? allCategories : allCategories.slice(0, 4);

  const featuredProducts = storeProducts.filter((p) => p.isFeatured);
  const newArrivals = storeProducts.filter((p) => p.isNewArrival);
  const bestSellers = storeProducts.filter((p) => p.isBestSeller);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-12 pb-16 bg-[#fbfdf9] w-full">
      {/* 1. Hero Carousel Banner Container (Image 2 style rounded card wrapper) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6">
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-gray-100/90 bg-white group">
          {/* Carousel Slide Container */}
          <div className="relative w-full overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, idx) => (
                <div key={slide.id || idx} className="w-full shrink-0 relative flex items-center">
                  <img
                    src={slide.image || heroImg}
                    alt={slide.heading || 'Chokku Store Banner'}
                    className="w-full h-[200px] xs:h-[240px] sm:h-[400px] md:h-[500px] lg:h-[580px] object-cover object-center block"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== window.location.origin + '/img.png') {
                        target.src = '/img.png';
                      }
                    }}
                  />

                  {/* Overlaid Responsive Content matching Image 2 */}
                  <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 md:px-14 z-10 pointer-events-none">
                    <div className="max-w-xs sm:max-w-md space-y-1.5 sm:space-y-3 pointer-events-auto">
                      {/* Meta Tag Heading Badge */}
                      {slide.metaTag && (
                        <div className="inline-block bg-[#488710] text-white text-[9px] xs:text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                          {slide.metaTag}
                        </div>
                      )}

                      {/* Headline */}
                      <div className="text-xl xs:text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-[#488710]">
                        {slide.heading || 'ZXCZXC'}
                      </div>

                      {/* Subheadline Pill */}
                      {slide.subheading && (
                        <div>
                          <span className="inline-block bg-gray-100/90 backdrop-blur-xs text-gray-800 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-md border border-gray-200 shadow-2xs">
                            {slide.subheading}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 sm:pt-2">
                        <Link
                          to={slide.buttonLink || '/shop'}
                          className="inline-flex items-center gap-1 bg-[#488710] hover:bg-[#386b0c] text-white font-extrabold text-[10px] sm:text-sm px-3.5 sm:px-6 py-1.5 sm:py-2.5 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 uppercase"
                        >
                          <span>{slide.buttonText || 'SHOP NOW'}</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>

                        <Link
                          to="/play-and-win"
                          className="inline-flex items-center gap-1 bg-white/95 hover:bg-white text-[#488710] border-2 border-[#488710] font-extrabold text-[10px] sm:text-sm px-3.5 sm:px-6 py-1.5 sm:py-2.5 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 uppercase"
                        >
                          <span>PLAY &amp; WIN</span>
                          <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-70 hover:opacity-100"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md flex items-center justify-center transition-all opacity-70 hover:opacity-100"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>
        </div>

        {/* Carousel Pagination Dots (Below Image 2 Hero Card) */}
        <div className="flex items-center justify-center gap-2 pt-3 pb-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === idx ? 'w-6 h-2 bg-[#488710]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. 4-Feature Trust Strip Container (Below hero banner in Image 2 design) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-[#f0f9e8] rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-emerald-100 shadow-2xs">
          <div className="grid grid-cols-4 divide-x divide-emerald-200/60 text-center">
            {/* Feature 1 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-100 shadow-xs flex items-center justify-center text-[#488710] mb-1">
                <Gamepad2 className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <span className="text-[10px] sm:text-xs font-black text-[#386b0c] uppercase tracking-tight block">
                PLAY GAMES
              </span>
              <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
                Win Rewards
              </span>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-100 shadow-xs flex items-center justify-center text-[#488710] mb-1">
                <Gift className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <span className="text-[10px] sm:text-xs font-black text-[#386b0c] uppercase tracking-tight block">
                EARN POINTS
              </span>
              <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
                Get Discounts
              </span>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-100 shadow-xs flex items-center justify-center text-[#488710] mb-1">
                <Percent className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <span className="text-[10px] sm:text-xs font-black text-[#386b0c] uppercase tracking-tight block">
                OFFERS
              </span>
              <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
                Best Deals
              </span>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white border border-gray-100 shadow-xs flex items-center justify-center text-[#488710] mb-1">
                <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <span className="text-[10px] sm:text-xs font-black text-[#386b0c] uppercase tracking-tight block">
                100% SECURE
              </span>
              <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium block truncate max-w-full">
                Safe Shopping
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE CATEGORIES Circle Section (Shows 4 categories + More by default, expands to all on click) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-emerald-100/90 shadow-2xs">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#488710]" />
              <h2 className="text-xs sm:text-base font-extrabold text-[#488710] uppercase tracking-wider">
                EXPLORE CATEGORIES
              </h2>
            </div>
            <button
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#488710] hover:text-emerald-700 transition-colors cursor-pointer"
            >
              <span>{showAllCategories ? 'Show Less' : 'View All'}</span>
              {showAllCategories ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#488710]" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 text-[#488710]" />
              )}
            </button>
          </div>

          {/* Category Circle Avatars: Shows 4 categories + "More" avatar when collapsed; shows all categories + "Less" avatar when expanded */}
          <div
            className={`grid ${
              showAllCategories
                ? 'grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 lg:grid-cols-8'
                : 'grid-cols-5'
            } gap-2 sm:gap-4 text-center transition-all duration-300`}
          >
            {displayedCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="flex flex-col items-center group cursor-pointer"
              >
                <img
                  src={
                    cat.image ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={cat.name}
                  className="w-12 h-12 xs:w-14 xs:h-14 sm:w-18 sm:h-18 rounded-full object-cover ring-2 ring-[#488710] ring-offset-2 shadow-xs group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <span className="text-[10px] sm:text-xs font-bold text-gray-800 mt-2 truncate w-full text-center">
                  {cat.name}
                </span>
              </Link>
            ))}

            {/* Toggle Button: "More" app icon when collapsed, "Less" icon when expanded */}
            {!showAllCategories ? (
              <button
                onClick={() => setShowAllCategories(true)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-18 sm:h-18 rounded-full bg-[#488710] text-white flex items-center justify-center ring-2 ring-[#488710] ring-offset-2 shadow-xs group-hover:scale-105 transition-transform">
                  <LayoutGrid className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-800 mt-2 truncate w-full text-center">
                  More
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowAllCategories(false)}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-18 sm:h-18 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center ring-2 ring-gray-300 ring-offset-2 shadow-xs group-hover:scale-105 transition-transform">
                  <ChevronUp className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-gray-800 mt-2 truncate w-full text-center">
                  Less
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. Promotional Banner Card ("Grab Best Offers" matching Image 2) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#488710] via-[#386b0c] to-[#2d6a4f] text-white p-5 sm:p-8 shadow-md flex items-center justify-between">
          <div className="relative z-10 max-w-xs sm:max-w-md space-y-1.5 sm:space-y-3">
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-emerald-200 bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
              NEW DEALS EVERYDAY!
            </span>
            <h3 className="text-lg xs:text-xl sm:text-3xl font-extrabold text-white leading-tight">
              Grab Best Offers <br />
              <span className="text-emerald-100 font-bold text-sm sm:text-xl">On Top Products</span>
            </h3>
            <div className="pt-1">
              <Link
                to="/shop?tag=offers"
                className="inline-flex items-center gap-1.5 bg-white text-[#488710] hover:bg-emerald-50 font-black text-[11px] sm:text-xs px-4 py-2 rounded-full shadow-md transition-all active:scale-95 uppercase"
              >
                <span>SHOP OFFERS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right 3D Green Bag & Coins Illustration graphic matching Image 2 */}
          <div className="relative hidden xs:flex items-center justify-center shrink-0 w-28 sm:w-44 h-28 sm:h-44">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 sm:w-36 sm:h-36 bg-gradient-to-br from-emerald-300 to-green-500 rounded-3xl border-2 border-white/40 shadow-xl flex flex-col items-center justify-center p-2 transform rotate-6">
              <img
                src={chokkuLogo}
                alt="chokku logo"
                className="h-10 sm:h-14 object-contain mb-1"
              />
              <span className="bg-amber-400 text-amber-950 text-[9px] sm:text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                OFF 30%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-[#488710] uppercase tracking-wider bg-[#f0f9e8] px-2.5 py-0.5 rounded-full border border-[#d2ea9d]">
                <Flame className="w-3 h-3 text-amber-500" />
                Handpicked Deals
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-1">
                Featured Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#488710] hover:text-emerald-700"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. New Arrivals Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-[#488710] uppercase tracking-wider bg-[#f0f9e8] px-2.5 py-0.5 rounded-full border border-[#d2ea9d]">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Fresh Inventory
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-1">
                New Arrivals
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#488710] hover:text-emerald-700"
            >
              <span>Explore New</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Star className="w-3 h-3 fill-current text-amber-500" />
                Most Popular
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 mt-1">
                Best-Selling Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#488710] hover:text-emerald-700"
            >
              <span>Shop Best</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Newsletter & Community Container */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-[#f0f9e8] rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-2xs text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#488710] text-white shadow-md mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              Join the Chokku Family &amp; Get <span className="text-[#488710]">15% OFF</span> 🎁
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto font-medium">
              Subscribe for instant discount alerts and exclusive VIP member rewards.
            </p>
          </div>

          {isSubscribed ? (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl font-bold text-xs max-w-md mx-auto">
              🎉 Thank you for subscribing! Check your email for your 15% discount code.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="w-full py-2.5 px-4 text-xs text-gray-800 bg-white border border-gray-200 rounded-full focus:outline-none focus:border-[#488710] shadow-2xs"
              />
              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 bg-[#488710] hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-md transition-all active:scale-95"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Golden Treasure Coin for Home Page */}
      <TreasureCoin pageId="home" />
    </div>
  );
};
