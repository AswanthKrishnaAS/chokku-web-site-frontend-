import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Share2,
  Sparkles,
  Camera,
  ThumbsUp,
  MessageSquare,
  Plus,
  X,
  Calendar,
  User,
  Upload,
  Image as ImageIcon,
  Filter,
  Check,
  ZoomIn,
  Maximize2,
  ChevronLeft,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { TreasureCoin } from '../components/TreasureCoin';
import { TryOnModal } from '../components/TryOnModal';
import { useAuth } from '../context/AuthContext';
import { ProductReview } from '../types';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products: storeProducts, addOrUpdateReview } = useProducts();
  const { addToCart, setBuyNowItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const { customerUser, customerWalletBalance } = useAuth();

  const allProducts = storeProducts.length > 0 ? storeProducts : PRODUCTS;
  const product = allProducts.find((p) => p.id === id);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedSizePrice, setSelectedSizePrice] = useState<number>(0);
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'highlights' | 'reviews'>('highlights');
  const [isTryOnOpen, setIsTryOnOpen] = useState<boolean>(false);

  // Review Filtering, Lightbox & All Reviews Bottom Sheet State
  const [starFilter, setStarFilter] = useState<number | 'all' | 'photos'>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isAllReviewsOpen, setIsAllReviewsOpen] = useState<boolean>(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  // Mobile Image Slider & Fullscreen Viewer State
  const mobileSliderRef = React.useRef<HTMLDivElement>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState<number>(0);
  const [isMobileFullscreenOpen, setIsMobileFullscreenOpen] = useState<boolean>(false);

  // Write Review Form State
  const [revCustomerName, setRevCustomerName] = useState(customerUser?.name || '');
  const [revRating, setRevRating] = useState<number>(5);
  const [revComment, setRevComment] = useState('');
  const [revImage, setRevImage] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Sync main image and size prices when product changes
  React.useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setQuantity(1);
      setIsAllReviewsOpen(false);
      if (product.sizeVariants && product.sizeVariants.length > 0) {
        const firstAvail = product.sizeVariants.find((v) => v.isAvailable !== false) || product.sizeVariants[0];
        setSelectedSize(firstAvail.size);
        setSelectedSizePrice(firstAvail.price);
      } else if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
        setSelectedSizePrice(product.price);
      } else {
        setSelectedSizePrice(product.price);
      }
      setActiveMobileIndex(0);
      if (mobileSliderRef.current) {
        mobileSliderRef.current.scrollTo({ left: 0, behavior: 'instant' as any });
      }
    }
  }, [product]);

  // Lock body scroll and handle Escape key for All Reviews Bottom Sheet
  React.useEffect(() => {
    if (isAllReviewsOpen) {
      document.body.classList.add('hide-bottom-nav');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsAllReviewsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('hide-bottom-nav');
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAllReviewsOpen]);

  // Lock body scroll and handle Escape key for mobile fullscreen modal
  React.useEffect(() => {
    if (isMobileFullscreenOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileFullscreenOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileFullscreenOpen]);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const newIndex = Math.round(el.scrollLeft / el.clientWidth);
    if (newIndex !== activeMobileIndex && newIndex >= 0 && newIndex < galleryList.length) {
      setActiveMobileIndex(newIndex);
    }
  };

  const scrollMobileToIndex = (index: number) => {
    if (mobileSliderRef.current) {
      const width = mobileSliderRef.current.clientWidth;
      mobileSliderRef.current.scrollTo({
        left: index * width,
        behavior: 'smooth',
      });
      setActiveMobileIndex(index);
    }
  };

  // Auto-resume Buy Now checkout if returning after Login/Signup
  React.useEffect(() => {
    if (!product || !customerUser) return;
    const searchParams = new URLSearchParams(window.location.search);
    const isAutoBuy = searchParams.get('autoBuy') === 'true';

    if (isAutoBuy) {
      window.history.replaceState({}, '', window.location.pathname);
      const curPrice = selectedSizePrice > 0 ? selectedSizePrice : product.price;
      const curOrigPrice = product.originalPrice && product.originalPrice > curPrice ? product.originalPrice : Math.round(curPrice * 1.25);
      const buyItem = {
        product: {
          ...product,
          price: curPrice,
          originalPrice: curOrigPrice,
        },
        quantity,
        selectedSize: selectedSize || undefined,
      };
      setBuyNowItem(buyItem);
      addToast('Continuing Checkout', `Resuming purchase for ${product.name}`, 'success');
      navigate('/checkout?mode=buynow');
    }
  }, [customerUser, product]);

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('File Too Large', 'Please select an image smaller than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRevImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomerSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!revCustomerName.trim() || !revComment.trim()) {
      addToast('Incomplete Form', 'Please enter your name and review text', 'error');
      return;
    }

    setIsSubmittingReview(true);
    const result = await addOrUpdateReview(product.id, {
      customerName: revCustomerName.trim(),
      rating: revRating,
      comment: revComment.trim(),
      date: new Date().toISOString().split('T')[0],
      image: revImage,
      images: revImage ? [revImage] : [],
    });
    setIsSubmittingReview(false);

    if (result.success) {
      addToast('Thank You!', 'Your review has been published successfully.', 'success');
      setIsWriteReviewOpen(false);
      setRevComment('');
      setRevImage('');
    } else {
      addToast('Error', result.message || 'Failed to submit review', 'error');
    }
  };

  const toggleHelpful = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    addToast('Feedback Saved', 'Thank you for your feedback!', 'info');
  };

  const productReviews: ProductReview[] = product?.reviews && product.reviews.length > 0
    ? product.reviews
    : [];

  const totalReviewsCount = productReviews.length;

  const starCounts = {
    5: productReviews.filter((r) => r.rating === 5).length,
    4: productReviews.filter((r) => r.rating === 4).length,
    3: productReviews.filter((r) => r.rating === 3).length,
    2: productReviews.filter((r) => r.rating === 2).length,
    1: productReviews.filter((r) => r.rating === 1).length,
  };

  const photoReviewsCount = productReviews.filter(
    (r) => r.image || (r.images && r.images.length > 0)
  ).length;

  const filteredReviews = productReviews.filter((r) => {
    if (starFilter === 'all') return true;
    if (starFilter === 'photos') return Boolean(r.image || (r.images && r.images.length > 0));
    return r.rating === starFilter;
  });

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-gray-500 text-sm mt-2">
          The requested product ID could not be found.
        </p>
        <Link to="/shop" className="mt-4 inline-flex items-center gap-2 text-brand-green font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Return to Shop
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const sameCategoryProducts = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      ((Boolean(product.category) && Boolean(p.category) && p.category.toLowerCase() === product.category.toLowerCase()) ||
       (Boolean(product.categoryName) && Boolean(p.categoryName) && p.categoryName.toLowerCase() === product.categoryName.toLowerCase()))
  );

  const relatedProducts = (
    sameCategoryProducts.length >= 4
      ? sameCategoryProducts
      : [
          ...sameCategoryProducts,
          ...allProducts.filter(
            (p) => p.id !== product.id && !sameCategoryProducts.some((sc) => sc.id === p.id)
          ),
        ]
  ).slice(0, 4);

  const renderReviewCard = (rev: ProductReview, inPanel: boolean = false) => (
    <div
      key={rev.id}
      className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
        inPanel ? 'bg-white/95' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Review Header: Avatar, Name, Rating & Date */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            {rev.profileImage ? (
              <img
                src={rev.profileImage}
                alt={rev.customerName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#609f00] to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                {rev.customerName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-black text-gray-900">{rev.customerName}</h4>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified Buyer</span>
                </span>
              </div>

              <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{rev.date}</span>
              </span>
            </div>
          </div>

          {/* Rating Star Badge */}
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-black text-amber-700 shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{rev.rating}.0</span>
          </div>
        </div>

        {/* Stars Row */}
        <div className="flex text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
              }`}
            />
          ))}
        </div>

        {/* Comment Text */}
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
          "{rev.comment}"
        </p>

        {/* Customer-Uploaded Review Photos Attachment */}
        {(rev.image || (rev.images && rev.images.length > 0)) && (
          <div className="pt-2 space-y-1.5">
            <span className="text-[11px] font-extrabold text-gray-500 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-[#609f00]" />
              <span>Customer Attached Photo:</span>
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(rev.images && rev.images.length > 0 ? rev.images : [rev.image]).filter(Boolean).map((photoUrl, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setLightboxImage(photoUrl)}
                  className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:border-[#609f00] transition-colors shrink-0"
                  title="Click to expand customer photo"
                >
                  <img
                    src={photoUrl}
                    alt={`Customer review photo ${pIdx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Helpful Button */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-bold">
        <span className="text-[11px] text-gray-400">Was this review helpful?</span>
        <button
          type="button"
          onClick={() => toggleHelpful(rev.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Helpful ({helpfulVotes[rev.id] || 0})</span>
        </button>
      </div>
    </div>
  );

  const displayPrice = selectedSizePrice > 0 ? selectedSizePrice : (product?.price || 0);
  const displayOriginalPrice = (product?.originalPrice && product.originalPrice > displayPrice) ? product.originalPrice : Math.round(displayPrice * 1.25);

  const activeProductPayload = product ? {
    ...product,
    price: displayPrice,
    originalPrice: displayOriginalPrice,
    image: selectedImage || product.image,
  } : null;

  const handleAddToCart = () => {
    if (!product) return;
    const targetProduct = activeProductPayload || product;
    addToCart(
      targetProduct,
      quantity,
      undefined,
      selectedSize || undefined
    );
  };

  const handleBuyNow = () => {
    if (!product) return;

    const buyItem = {
      product: activeProductPayload || product,
      quantity,
      selectedSize: selectedSize || undefined,
    };

    setBuyNowItem(buyItem);

    if (!customerUser) {
      addToast('Login Required', 'Please log in or sign up to complete your purchase.', 'info');
      sessionStorage.setItem('chokku_redirect_after_login', '/checkout?mode=buynow');
      sessionStorage.setItem('chokku_buy_now_product_id', product.id);
      sessionStorage.setItem('chokku_buy_now_qty', String(quantity));
      navigate('/login', {
        state: {
          returnUrl: '/checkout?mode=buynow',
          buyNowProductId: product.id,
          buyNowQuantity: quantity,
        },
      });
      return;
    }

    navigate('/checkout?mode=buynow');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link Copied!', 'Product link copied to your clipboard.', 'info');
    }
  };

  const galleryList = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image];

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
          <Link to="/" className="hover:text-brand-green">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <Link to="/shop" className="hover:text-brand-green">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <Link to={`/category/${product.category}`} className="hover:text-brand-green">
            {product.categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product Details Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* Left Column: Product Image Gallery */}
          <div>
            {/* MOBILE ONLY LAYOUT (< lg): Swipeable Slider + Bottom-Left Fullscreen Icon + Pagination Dots (NO thumbnails) */}
            <div className="block lg:hidden space-y-2.5">
              {/* Mobile Swipe Slider Container */}
              <div className="relative aspect-square w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                
                {/* Horizontal Scroll Snap Track */}
                <div
                  ref={mobileSliderRef}
                  onScroll={handleMobileScroll}
                  className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth touch-pan-x"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {galleryList.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="w-full h-full shrink-0 snap-center snap-always flex items-center justify-center p-2 bg-white"
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} slide ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain object-center select-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Discount Badge (Top Left) */}
                {product.discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-[#64A901] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs z-10 pointer-events-none">
                    {product.discountPercent}% OFF
                  </span>
                )}

                {/* Share Button (Top Right) */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/85 hover:bg-white text-gray-700 shadow-sm backdrop-blur-md transition-colors z-10 cursor-pointer"
                  title="Share product link"
                  aria-label="Share product link"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Fullscreen Icon at Bottom-Left Corner */}
                <button
                  type="button"
                  onClick={() => setIsMobileFullscreenOpen(true)}
                  className="absolute bottom-3 left-3 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-md border border-white/70 transition-all active:scale-95 z-20 cursor-pointer flex items-center justify-center"
                  title="Open Fullscreen"
                  aria-label="Open Fullscreen"
                >
                  <Maximize2 className="w-4 h-4 text-gray-800 stroke-[2.2]" />
                </button>

                {/* Floating Try On Button (if available) */}
                {Boolean(product.tryOn && Array.isArray(product.tryOnImages) && product.tryOnImages.length > 0) && (
                  <button
                    type="button"
                    onClick={() => setIsTryOnOpen(true)}
                    className="absolute bottom-3 right-14 bg-gradient-to-r from-[#64A901] via-teal-600 to-[#01589D] text-white text-xs font-extrabold px-3 py-2 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 border border-white/30 transition-all active:scale-95 cursor-pointer z-10"
                    title="Virtual Try On"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <span>Try On</span>
                  </button>
                )}

                {/* Wishlist Heart (Love) Icon at Bottom-Right Corner */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id, product.name);
                  }}
                  className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-md backdrop-blur-md border transition-all active:scale-90 z-20 cursor-pointer flex items-center justify-center ${
                    isWishlisted
                      ? 'bg-white border-red-200 text-red-500 shadow-red-500/15'
                      : 'bg-white/90 hover:bg-white border-white/70 text-gray-700 hover:text-red-500'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 transition-transform duration-200 ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
                </button>
              </div>

              {/* Mobile Pagination Dots Below Main Image */}
              {galleryList.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 py-1.5">
                  {galleryList.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => scrollMobileToIndex(dotIdx)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        dotIdx === activeMobileIndex
                          ? 'w-5 h-2 bg-[#64A901] shadow-2xs'
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to image ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP ONLY LAYOUT (>= lg): Existing Unchanged Main Image + Thumbnails */}
            <div className="hidden lg:block space-y-4">
              {/* Main Image Container */}
              <div className="relative aspect-square sm:aspect-4/3 w-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center p-2">
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain object-center"
                />
                
                {product.discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-brand-green text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                    {product.discountPercent}% OFF
                  </span>
                )}

                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-brand-blue shadow-sm backdrop-blur-md transition-colors"
                  title="Share product link"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Floating Try On Button on Right Side of Product Image */}
                {Boolean(product.tryOn && Array.isArray(product.tryOnImages) && product.tryOnImages.length > 0) && (
                  <button
                    onClick={() => setIsTryOnOpen(true)}
                    className="absolute bottom-4 right-16 bg-gradient-to-r from-brand-green via-teal-600 to-brand-blue hover:from-brand-green-hover hover:to-brand-blue-hover text-white text-xs sm:text-sm font-extrabold px-3.5 py-2 rounded-full shadow-lg shadow-brand-green/20 backdrop-blur-md flex items-center gap-2 border border-white/30 transition-all hover:scale-105 cursor-pointer z-10"
                    title="Virtual Try On"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse text-amber-200" />
                    <Camera className="w-4 h-4 text-white" />
                    <span>Try On</span>
                  </button>
                )}

                {/* Wishlist Heart (Love) Icon at Bottom-Right Corner */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id, product.name);
                  }}
                  className={`absolute bottom-4 right-4 p-2.5 sm:p-3 rounded-full shadow-md backdrop-blur-md border transition-all active:scale-90 hover:scale-105 z-20 cursor-pointer flex items-center justify-center ${
                    isWishlisted
                      ? 'bg-white border-red-200 text-red-500 shadow-red-500/15'
                      : 'bg-white/90 hover:bg-white border-white/70 text-gray-700 hover:text-red-500'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 transition-transform duration-200 ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
                </button>
              </div>

              {/* Thumbnail Carousel / List */}
              {galleryList.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {galleryList.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(imgUrl);
                        setActiveMobileIndex(index);
                      }}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-gray-50 cursor-pointer ${
                        (selectedImage || product.image) === imgUrl
                          ? 'border-brand-green ring-2 ring-brand-green/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.name} gallery ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Specs & Buy Controls */}
          <div className="space-y-6">
            
            <div>
              {/* Category tag */}
              <span className="text-xs font-bold text-brand-blue bg-brand-light-blue px-3 py-1 rounded-md inline-block mb-2 uppercase tracking-wider">
                {product.categoryName}
              </span>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating & Stock */}
              <div className="flex items-center gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Scroll to customer reviews"
                >
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 fill-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-black text-gray-800 ml-0.5">{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                  <span className="text-xs text-emerald-700 font-bold underline decoration-emerald-300">
                    ({product.reviewCount || totalReviewsCount} customer reviews)
                  </span>
                </button>

                <div className="h-4 w-px bg-gray-200" />

                {/* Stock status */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock ({product.stock} left)</span>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">
                ₹{displayPrice.toFixed(2)}
              </span>
              {displayOriginalPrice > displayPrice && (
                <span className="text-lg text-gray-400 line-through">
                  ₹{displayOriginalPrice.toFixed(2)}
                </span>
              )}
              {displayOriginalPrice > displayPrice && (
                <span className="text-xs font-extrabold text-brand-green bg-brand-light-green px-2.5 py-1 rounded-md">
                  You Save ₹{(displayOriginalPrice - displayPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Select Size & Size-Wise Pricing */}
            {((product.sizeVariants && product.sizeVariants.length > 0) || (product.sizes && product.sizes.length > 0)) && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                {(() => {
                  const variants = product.sizeVariants && product.sizeVariants.length > 0
                    ? product.sizeVariants
                    : (product.sizes || []).map((sz) => ({ size: sz, price: product.price || 0, isAvailable: true }));

                  const availableVarList = variants.filter((v) => v.isAvailable !== false);
                  const firstValidPrice = variants.find((v) => v.price > 0)?.price || product.price || 271;
                  const hasDifferentSizePrices = product.isAddPriceEnabled !== undefined
                    ? product.isAddPriceEnabled === true
                    : (variants.length > 1 && variants.some((v) => v.price > 0 && v.price !== firstValidPrice));
                  const allSizesFormatted = availableVarList.map((v) => v.size).join(' / ');

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                          Select Size
                        </span>
                        {!hasDifferentSizePrices && availableVarList.length > 0 ? (
                          <span className="text-xs font-black text-emerald-700">
                            {allSizesFormatted} – ₹{firstValidPrice}
                          </span>
                        ) : selectedSize ? (
                          <span className="text-xs font-extrabold text-[#609f00]">Selected: {selectedSize} (₹{displayPrice})</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {variants.map((sv) => {
                          const isSelected = selectedSize === sv.size;
                          const isAvailable = sv.isAvailable !== false;
                          const svPrice = sv.price > 0 ? sv.price : firstValidPrice;
                          return (
                            <button
                              key={sv.size}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => {
                                if (isAvailable) {
                                  setSelectedSize(sv.size);
                                  setSelectedSizePrice(svPrice);
                                }
                              }}
                              className={`px-3.5 py-2 rounded-2xl border text-center transition-all cursor-pointer min-w-[3.5rem] ${
                                isSelected
                                  ? 'bg-pink-50 border-[#ff477e] text-[#d81b60] ring-2 ring-pink-300 font-black shadow-2xs'
                                  : !isAvailable
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                                  : 'bg-white border-gray-200 text-gray-800 hover:border-gray-400 font-semibold'
                              }`}
                            >
                              <div className="text-xs font-black">{sv.size}</div>
                              {hasDifferentSizePrices && (
                                <div className="text-[11px] font-bold text-gray-500 mt-0.5">₹{svPrice}</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Short Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity Selector + Dynamic Calculation Box */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Quantity:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-2xs">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-l-xl font-bold cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 text-sm font-extrabold text-gray-900 min-w-[2.5rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3.5 py-1.5 text-gray-600 hover:bg-gray-100 rounded-r-xl font-bold cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-xs text-gray-500 font-semibold">
                  Unit Price: <span className="font-extrabold text-gray-900">₹{displayPrice.toFixed(2)}</span>
                </span>
              </div>

              {/* Dynamic Calculation Box */}
              <div className="bg-[#f0f9e8]/90 border border-[#d2ea9d] rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-semibold">Calculation Breakdown:</span>
                  <span className="font-bold text-gray-900">
                    ₹{displayPrice.toFixed(2)} × {quantity} unit{quantity > 1 ? 's' : ''} {selectedSize ? `(${selectedSize})` : ''}
                  </span>
                </div>

                {displayOriginalPrice > displayPrice && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                    <span>Total Discount Savings:</span>
                    <span>-₹{((displayOriginalPrice - displayPrice) * quantity).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#d2ea9d]/60">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                    Total Amount:
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#488710]">
                      ₹{(displayPrice * quantity).toFixed(2)}
                    </span>
                    {displayOriginalPrice > displayPrice && (
                      <span className="text-xs text-gray-400 line-through block">
                        ₹{(displayOriginalPrice * quantity).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Store Cash Buy Now Benefit Pill */}
              <div className="bg-[#f4fbf0] border border-[#d8f2c8] rounded-2xl p-2.5 px-3 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#64A901] text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    ₹
                  </span>
                  <span className="text-[11px] font-bold text-gray-800">
                    {customerUser
                      ? `Available Store Cash: ₹${customerWalletBalance || (customerUser as any).walletBalance || 0} • Redeem ₹30+ on Buy Now`
                      : 'Store Cash Available • 1,000 Points = ₹1 Store Cash'}
                  </span>
                </div>
                <Link
                  to="/points"
                  className="text-[11px] font-black text-[#488710] hover:underline shrink-0"
                >
                  {customerUser ? 'Convert Points' : 'Learn More'}
                </Link>
              </div>

              {/* Action Buttons: Add to Cart, Buy Now */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  icon={<ShoppingBag className="w-5 h-5" />}
                >
                  Add to Cart 
                </Button>

                <Button
                  onClick={handleBuyNow}
                  variant="secondary"
                  size="lg"
                  className="flex-1 cursor-pointer"
                >
                  Buy Now 
                </Button>

                {(product.tryOnEnabled || product.tryOn) && (
                  <Button
                    onClick={() => setIsTryOnOpen(true)}
                    variant="secondary"
                    size="lg"
                    className="flex-1 cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border-amber-400 shadow-md"
                    icon={<Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />}
                  >
                    Try On
                  </Button>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-gray-600">
              <div className="flex items-center gap-2 p-3 bg-brand-light-green/40 rounded-xl">
                <Truck className="w-4 h-4 text-brand-green" />
                <span>Fast Express Delivery in 2-4 days</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-brand-light-blue/40 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-brand-blue" />
                <span>100% Genuine Certified Quality</span>
              </div>
            </div>

          </div>

        </div>

        {/* Product Highlights & Extended Tabs */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-6 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('highlights')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 shrink-0 ${
                activeTab === 'highlights'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Product Highlights &amp; Details
            </button>
            <button
              onClick={() => {
                setActiveTab('reviews');
                document.getElementById('customer-reviews')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`pb-3 text-sm font-bold transition-all border-b-2 shrink-0 flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'border-[#609f00] text-[#609f00]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Customer Reviews ({totalReviewsCount})</span>
            </button>
          </div>

          {activeTab === 'highlights' && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 max-w-3xl space-y-6">
              {/* Product Highlights Card (Screenshot 2) */}
              {product.highlights && product.highlights.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <h4 className="text-sm font-black text-gray-900">Product Highlights</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const text = product.highlights?.join('\n');
                        navigator.clipboard.writeText(text || '');
                        addToast('Copied', 'Product highlights copied to clipboard', 'success');
                      }}
                      className="text-xs font-black text-[#609f00] uppercase tracking-wider hover:underline cursor-pointer"
                    >
                      COPY
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    {product.highlights.map((hl, idx) => {
                      const parts = hl.includes(':') ? hl.split(':') : ['', hl];
                      const key = parts[0].trim();
                      const val = parts.slice(1).join(':').trim();
                      return (
                        <div key={idx} className="space-y-0.5">
                          {key && <div className="text-xs text-gray-400 font-medium">{key}</div>}
                          <div className="font-black text-gray-900">{val}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Details Card (Screenshot 2) */}
              {product.additionalDetails && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3">
                  <h4 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">Additional Details</h4>
                  <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                    {product.additionalDetails.split('\n').filter(Boolean).map((line, idx) => {
                      const parts = line.includes(':') ? line.split(':') : ['', line];
                      return (
                        <div key={idx} className="flex justify-between sm:justify-start gap-4 border-b border-gray-50 pb-1.5">
                          <span className="text-gray-500 font-semibold min-w-[130px]">{parts[0].trim()}</span>
                          <span className="font-black text-gray-900">{parts.slice(1).join(':').trim()}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* More Information Button matching Screenshot 3 */}
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsMoreInfoOpen(true)}
                      className="text-xs font-black text-gray-600 underline hover:text-[#609f00] cursor-pointer"
                    >
                      More Information
                    </button>
                  </div>
                </div>
              )}

              {(!product.highlights || product.highlights.length === 0) && !product.additionalDetails && (
                <p className="text-xs text-gray-500 italic">No specific highlights added for this product.</p>
              )}
            </div>
          )}

          {/* INFORMATION Modal matching Screenshot 3 */}
          {isMoreInfoOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">INFORMATION</h3>
                  <button
                    type="button"
                    onClick={() => setIsMoreInfoOpen(false)}
                    className="p-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
                  <div className="space-y-1.5 border-b border-gray-100 pb-4">
                    <div className="font-bold text-gray-600">Manufacturer Information</div>
                    <div className="font-black text-gray-900 leading-relaxed uppercase">
                      {product?.moreInformation?.manufacturer || 'AHMAD KHAN 18/1 Sarojini Naidu Park Shastri Nagar East Delhi Gali No.1 Near By Kali Mata Mandir 110031'}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-b border-gray-100 pb-4">
                    <div className="font-bold text-gray-600">Importer Information</div>
                    <div className="font-medium text-gray-500">
                      {product?.moreInformation?.importer || 'No information available'}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-b border-gray-100 pb-4">
                    <div className="font-bold text-gray-600">Packer Information</div>
                    <div className="font-black text-gray-900 leading-relaxed uppercase">
                      {product?.moreInformation?.packer || 'AHMAD KHAN 18/1 Sarojini Naidu Park Shastri Nagar East Delhi Gali No.1 Near By Kali Mata Mandir 110031'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-gray-600">Net Weight(g)</div>
                    <div className="font-black text-gray-900">
                      {product?.moreInformation?.netWeight || '200'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Ratings & Reviews Section */}
        <div id="customer-reviews" className="mt-16 pt-10 border-t border-gray-200 space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#488710] bg-[#f0f9e8] px-3 py-1 rounded-full border border-[#d2ea9d]">
                Customer Feedback
              </span>
              <span className="text-xs font-bold text-gray-500">• Verified Reviews</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
              Ratings &amp; Customer Reviews
            </h2>
          </div>

          {/* Summary Dashboard Banner Card */}
          <div className="bg-gradient-to-br from-amber-50/60 via-emerald-50/40 to-white rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Column 1: Rating Score */}
            <div className="lg:col-span-4 text-center lg:text-left space-y-2 border-b lg:border-b-0 lg:border-r border-amber-200/60 pb-6 lg:pb-0 lg:pr-6">
              <div className="text-5xl font-black text-gray-900 tracking-tight flex items-baseline justify-center lg:justify-start gap-2">
                <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                <span className="text-xl font-bold text-gray-400">/ 5.0</span>
              </div>

              <div className="flex justify-center lg:justify-start text-amber-400 gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(product.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs font-bold text-gray-600">
                Based on <span className="text-gray-900 font-black">{totalReviewsCount} customer review{totalReviewsCount !== 1 ? 's' : ''}</span>
              </p>

              <div className="pt-2 inline-flex items-center gap-1.5 bg-emerald-100/80 text-[#3a6e0c] px-3 py-1 rounded-full text-[11px] font-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>98% Recommended by Buyers</span>
              </div>
            </div>

            {/* Column 2: Breakdown Progress Bars */}
            <div className="lg:col-span-8 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star as keyof typeof starCounts];
                const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : star === 5 ? 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs font-bold text-gray-700">
                    <span className="w-12 flex items-center gap-1 shrink-0 font-extrabold text-amber-600">
                      {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                    </span>

                    <div className="flex-1 h-3 bg-gray-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-14 text-right text-gray-500 font-semibold shrink-0">
                      {pct}% ({count})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Cards List (Default: Display only 3 customer reviews) */}
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-300 space-y-3">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-800">No Customer Reviews Yet</h3>
                <p className="text-xs text-gray-500">
                  There are no customer ratings or reviews for this product yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top 3 Reviews Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.slice(0, 3).map((rev) => renderReviewCard(rev, false))}
              </div>

              {/* View All Reviews Button */}
              {filteredReviews.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAllReviewsOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[#488710] hover:bg-[#3d720e] text-white font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer group"
                  >
                    <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>View All Reviews</span>
                    <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-black">
                      {totalReviewsCount}
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products Section (Same Category) */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#488710] bg-[#f0f9e8] px-3 py-1 rounded-full border border-[#d2ea9d]">
                    Same Category
                  </span>
                  <span className="text-xs font-bold text-gray-500">• {product.categoryName || 'Similar Items'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                  Related Products
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                  Customers who viewed this item also explored these recommendations
                </p>
              </div>

              {product.category && (
                <Link
                  to={`/category/${product.category}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#488710] hover:text-[#3a6e0c] transition-colors self-start sm:self-auto group"
                >
                  <span>Explore More in {product.categoryName || 'Category'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}


      </div>

      {/* Golden Treasure Coin for Product Details Page */}
      <TreasureCoin pageId="product" />

      {/* Virtual Try-On Modal */}
      <TryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        product={product}
        selectedProductImage={selectedImage || product.image}
      />

      {/* Bottom Off-Canvas Panel for All Reviews */}
      <div
        className={`fixed inset-0 z-60 ${
          isAllReviewsOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!isAllReviewsOpen}
      >
        {/* Backdrop overlay */}
        <div
          className={`absolute inset-0 bg-slate-950/60 backdrop-blur-xs bottom-sheet-backdrop cursor-pointer ${
            isAllReviewsOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsAllReviewsOpen(false)}
        />

        {/* Slide-Up Bottom Sheet Drawer */}
        <div
          className={`absolute inset-x-0 bottom-0 flex justify-center pointer-events-none bottom-sheet-slide ${
            isAllReviewsOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-full max-w-4xl max-h-[88vh] sm:max-h-[85vh] bg-white rounded-t-[28px] sm:rounded-t-[36px] shadow-2xl flex flex-col pointer-events-auto border-t border-x border-gray-200/90 overflow-hidden">
            {/* Mobile Drag Indicator Bar */}
            <div
              className="pt-3 pb-1 cursor-pointer flex justify-center group"
              onClick={() => setIsAllReviewsOpen(false)}
              title="Click or drag to close"
            >
              <div className="w-12 h-1.5 bg-gray-300 group-hover:bg-gray-400 rounded-full transition-colors" />
            </div>

            {/* Panel Header */}
            <div className="px-5 sm:px-8 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4 bg-white/95 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#488710] shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900">
                      All Customer Reviews
                    </h3>
                    <span className="bg-[#f0f9e8] text-[#488710] border border-[#d2ea9d] text-xs font-black px-2.5 py-0.5 rounded-full">
                      {totalReviewsCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1 text-amber-500 font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                      {product.rating ? product.rating.toFixed(1) : '5.0'} / 5.0
                    </span>
                    <span>•</span>
                    <span className="text-gray-500 line-clamp-1">{product.name}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsAllReviewsOpen(false)}
                className="p-2 sm:p-2.5 rounded-full text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors cursor-pointer shrink-0"
                aria-label="Close all reviews panel"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter chips inside panel */}
            <div className="px-5 sm:px-8 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2 overflow-x-auto shrink-0 text-xs font-bold">
              <span className="text-gray-400 text-[11px] font-black uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setStarFilter('all')}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  starFilter === 'all'
                    ? 'bg-[#488710] text-white shadow-xs font-black'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
                }`}
              >
                All ({totalReviewsCount})
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStarFilter(s)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                    starFilter === s
                      ? 'bg-amber-500 text-white shadow-xs font-black'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <span>{s}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  <span className="opacity-75">({starCounts[s as keyof typeof starCounts]})</span>
                </button>
              ))}
              {photoReviewsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStarFilter('photos')}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
                    starFilter === 'photos'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>With Photos ({photoReviewsCount})</span>
                </button>
              )}
            </div>

            {/* Vertically Scrollable Reviews List */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-3">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-800">No Reviews Found</h4>
                    <p className="text-xs text-gray-500">
                      No customer reviews match your selected rating filter.
                    </p>
                  </div>
                  {starFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setStarFilter('all')}
                      className="text-xs font-black text-[#488710] underline cursor-pointer"
                    >
                      Reset filter to show all
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((rev) => renderReviewCard(rev, true))}
                </div>
              )}
            </div>

            {/* Bottom Panel Footer */}
            <div className="px-5 sm:px-8 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs shrink-0">
              <span className="text-gray-500 font-bold">
                Showing <strong className="text-gray-900">{filteredReviews.length}</strong> of {totalReviewsCount} reviews
              </span>
              <button
                type="button"
                onClick={() => setIsAllReviewsOpen(false)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-70 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white z-10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-full flex items-center justify-center p-4 bg-slate-950 rounded-2xl overflow-hidden">
              <img src={lightboxImage} alt="Enlarged review photo" className="max-h-[80vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
      {/* Mobile Image Fullscreen Modal */}
      {isMobileFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in lg:hidden">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between text-white pb-2 z-10">
            <span className="text-xs font-bold text-gray-300 bg-white/10 px-3 py-1 rounded-full">
              {activeMobileIndex + 1} / {galleryList.length}
            </span>
            <button
              type="button"
              onClick={() => setIsMobileFullscreenOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fullscreen Image Display */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-auto">
            <img
              src={galleryList[activeMobileIndex] || selectedImage || product.image}
              alt={`${product.name} fullscreen view`}
              className="max-h-[78vh] max-w-[95vw] object-contain mx-auto select-none rounded-lg"
            />

            {/* Navigation arrows inside fullscreen modal if > 1 image */}
            {galleryList.length > 1 && (
              <>
                {activeMobileIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollMobileToIndex(activeMobileIndex - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {activeMobileIndex < galleryList.length - 1 && (
                  <button
                    type="button"
                    onClick={() => scrollMobileToIndex(activeMobileIndex + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Fullscreen Pagination Dots */}
          {galleryList.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-3 z-10">
              {galleryList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollMobileToIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === activeMobileIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
