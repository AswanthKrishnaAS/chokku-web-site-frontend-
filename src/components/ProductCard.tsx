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
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag */}
          <span className="text-xs font-medium uppercase tracking-wider text-brand-blue bg-brand-light-blue px-2 py-0.5 rounded-md inline-block mb-1.5">
            {product.categoryName}
          </span>

          {/* Title */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-brand-blue transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold text-gray-800">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        </div>

        {/* Price & Add To Cart Button Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-gray-900">
                ₹{product.price.toFixed(2)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="inline-flex items-center gap-1.5 bg-brand-green hover:bg-brand-green-hover text-white text-xs font-medium px-3 py-2 rounded-lg transition-all shadow-sm active:scale-95"
            title="Add to Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
