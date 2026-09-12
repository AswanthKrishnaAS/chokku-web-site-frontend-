import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top Image Container */}
      <div className="relative aspect-4/3 w-full bg-gray-50 overflow-hidden">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Discount Badge */}
        {product.discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-brand-green text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Icon Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? 'bg-red-50 text-red-500 hover:bg-red-100'
              : 'bg-white/80 text-gray-500 hover:text-red-500 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag */}
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-blue bg-brand-light-blue px-2 py-0.5 rounded-md inline-block mb-1 sm:mb-1.5">
            {product.categoryName}
          </span>

          {/* Title */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-brand-blue transition-colors">
            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-800">{product.rating}</span>
            <span className="text-[11px] sm:text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        </div>

        {/* Price & Add To Cart Button Footer */}
        <div className="mt-3 pt-2.5 sm:pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-sm sm:text-base md:text-lg font-extrabold text-gray-900 truncate">
                ₹{product.price.toFixed(2)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through truncate">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="shrink-0 inline-flex items-center justify-center gap-1 bg-[#488710] hover:bg-[#386b0c] text-white text-xs font-bold p-2 sm:px-3 sm:py-2 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Add to Cart"
            aria-label="Add to Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
