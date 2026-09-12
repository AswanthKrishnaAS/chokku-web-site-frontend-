import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Truck, ShieldCheck, ArrowLeft, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { TreasureCoin } from '../components/TreasureCoin';

import { useAuth } from '../context/AuthContext';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products: storeProducts } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const { customerUser } = useAuth();

  const allProducts = storeProducts.length > 0 ? storeProducts : PRODUCTS;
  const product = allProducts.find((p) => p.id === id);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'description'>('specs');

  // Sync main image when product changes
  React.useEffect(() => {
    if (product) {
      setSelectedImage(product.image);
      setQuantity(1);
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

  const handleBuyNow = () => {
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

    addToCart(product, quantity);
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
            <div className="relative aspect-4/3 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
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
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-current'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-800 ml-1">{product.rating}</span>
                  <span className="text-xs text-gray-400">({product.reviewCount} customer reviews)</span>
                </div>

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
                ₹{product.price.toFixed(2)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
              {product.discountPercent > 0 && (
                <span className="text-xs font-extrabold text-brand-green bg-brand-light-green px-2.5 py-1 rounded-md">
                  You Save ₹{(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>

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
                  Unit Price: <span className="font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
                </span>
              </div>

              {/* Dynamic Calculation Box */}
              <div className="bg-[#f0f9e8]/90 border border-[#d2ea9d] rounded-2xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-semibold">Calculation Breakdown:</span>
                  <span className="font-bold text-gray-900">
                    ₹{product.price.toFixed(2)} × {quantity} unit{quantity > 1 ? 's' : ''}
                  </span>
                </div>

                {product.originalPrice > product.price && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                    <span>Total Discount Savings:</span>
                    <span>-₹{((product.originalPrice - product.price) * quantity).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#d2ea9d]/60">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                    Total Amount:
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#488710]">
                      ₹{(product.price * quantity).toFixed(2)}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through block">
                        ₹{(product.originalPrice * quantity).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Add to Cart, Buy Now, Wishlist */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  onClick={() => addToCart(product, quantity)}
                  variant="primary"
                  size="lg"
                  className="flex-1 cursor-pointer"
                  icon={<ShoppingBag className="w-5 h-5" />}
                >
                  Add to Cart (₹{(product.price * quantity).toFixed(2)})
                </Button>

                <Button
                  onClick={handleBuyNow}
                  variant="secondary"
                  size="lg"
                  className="flex-1 cursor-pointer"
                >
                  Buy Now (₹{(product.price * quantity).toFixed(2)})
                </Button>

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

        {/* Specifications & Extended Tabs */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'specs'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'description'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Full Description & Info
            </button>
          </div>

          {activeTab === 'specs' ? (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 max-w-3xl">
              <table className="w-full text-xs sm:text-sm text-left">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 font-bold text-gray-700 w-1/3 border-b border-gray-100">
                        {key}
                      </td>
                      <td className="py-3 px-4 text-gray-600 border-b border-gray-100">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="prose max-w-3xl text-sm text-gray-600 leading-relaxed space-y-3">
              <p>{product.description}</p>
              <p>
                Crafted using premium materials to ensure continuous reliability, sleek aesthetics, and superior satisfaction. Designed to match modern lifestyles with ease.
              </p>
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
    </div>
  );
};
