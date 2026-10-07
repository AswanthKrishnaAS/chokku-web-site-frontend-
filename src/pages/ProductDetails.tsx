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
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const { customerUser } = useAuth();

  const allProducts = storeProducts.length > 0 ? storeProducts : PRODUCTS;
  const product = allProducts.find((p) => p.id === id);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedSizePrice, setSelectedSizePrice] = useState<number>(0);
  const [isMoreInfoOpen, setIsMoreInfoOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'highlights' | 'description' | 'reviews'>('highlights');
  const [isTryOnOpen, setIsTryOnOpen] = useState<boolean>(false);

  // Review Filtering & Lightbox & Write Review Modal State
  const [starFilter, setStarFilter] = useState<number | 'all' | 'photos'>('all');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

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
    }
  }, [product]);

  // Auto-resume Buy Now checkout if returning after Login/Signup
  React.useEffect(() => {
    if (!product || !customerUser) return;
    const searchParams = new URLSearchParams(window.location.search);
    const isAutoBuy = searchParams.get('autoBuy') === 'true';

    if (isAutoBuy) {
      window.history.replaceState({}, '', window.location.pathname);
      addToCart(product, quantity);
      addToast('Continuing Checkout', `Resuming purchase for ${product.name}`, 'success');
      navigate('/checkout');
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
  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const displayPrice = selectedSizePrice > 0 ? selectedSizePrice : (product?.price || 0);
  const displayOriginalPrice = (product?.originalPrice && product.originalPrice > displayPrice) ? product.originalPrice : Math.round(displayPrice * 1.25);

  const activeProductPayload = product ? {
    ...product,
    price: displayPrice,
    originalPrice: displayOriginalPrice,
  } : null;

  const handleBuyNow = () => {
    if (!product) return;
    if (!customerUser) {
      addToast('Login Required', 'Please log in or sign up to complete your purchase.', 'info');
      sessionStorage.setItem('chokku_redirect_after_login', `/product/${product.id}?autoBuy=true`);
      sessionStorage.setItem('chokku_buy_now_product_id', product.id);
      sessionStorage.setItem('chokku_buy_now_qty', String(quantity));
      navigate('/login', {
        state: {
          returnUrl: `/product/${product.id}?autoBuy=true`,
          buyNowProductId: product.id,
          buyNowQuantity: quantity,
        },
      });
      return;
    }

    addToCart(activeProductPayload || product, quantity);
    navigate('/checkout');
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
          <div className="space-y-4">
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
                  className="absolute bottom-4 right-4 bg-gradient-to-r from-brand-green via-teal-600 to-brand-blue hover:from-brand-green-hover hover:to-brand-blue-hover text-white text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-full shadow-lg shadow-brand-green/20 backdrop-blur-md flex items-center gap-2 border border-white/30 transition-all hover:scale-105 cursor-pointer z-10"
                  title="Virtual Try On"
                >
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-200" />
                  <Camera className="w-4 h-4 text-white" />
                  <span>Try On</span>
                </button>
              )}
            </div>

            {/* Thumbnail Carousel / List */}
            {galleryList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {galleryList.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-gray-50 ${
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

              {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => addToCart(activeProductPayload || product, quantity)}
                  variant="primary"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  icon={<ShoppingBag className="w-5 h-5" />}
                >
                  Add to Cart (₹{(displayPrice * quantity).toFixed(2)})
                </Button>

                <Button
                  onClick={handleBuyNow}
                  variant="secondary"
                  size="lg"
                  className="flex-1 cursor-pointer"
                >
                  Buy Now (₹{(displayPrice * quantity).toFixed(2)})
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

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
                    isWishlisted
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 bg-white'
                  }`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
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
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 shrink-0 ${
                activeTab === 'description'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Full Description &amp; Info
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

          {activeTab === 'highlights' ? (
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
          ) : activeTab === 'description' ? (
            <div className="prose max-w-3xl text-sm text-gray-600 leading-relaxed space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              {(() => {
                const cleanedDesc = (product.description || '')
                  .replace(/Imported from Meesho catalog link \([^)]*\)\.?/gi, '')
                  .replace(/Imported from Meesho[^\n.]*\.?/gi, '')
                  .replace(/https?:\/\/(?:www\.)?meesho\.com[^\s)]*/gi, '')
                  .trim();

                const fallbackText =
                  'Crafted using premium materials to ensure continuous reliability, sleek aesthetics, and superior satisfaction. Designed to match modern lifestyles with ease.';
                const finalDesc = cleanedDesc || fallbackText;

                return <p className="whitespace-pre-line">{finalDesc}</p>;
              })()}
            </div>
          ) : null}

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

          {/* Review Cards List */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-3xl p-6 border border-gray-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
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
                          <div className="flex items-center gap-1.5">
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
                              className="group relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer hover:border-[#609f00] transition-colors shrink-0"
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
                      onClick={() => toggleHelpful(rev.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-xl transition-all cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful ({helpfulVotes[rev.id] || 0})</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-100">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
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
    </div>
  );
};
