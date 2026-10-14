import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, Check } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity, selectedColor, selectedSize } = item;
  const [imageError, setImageError] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=400&q=80';
  const itemTotal = product.price * quantity;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);

  return (
    <div className="py-4 sm:py-5 transition-all duration-200">
      <div className="flex items-start gap-3.5 sm:gap-5">
        {/* Product Thumbnail */}
        <Link
          to={`/product/${product.id}`}
          className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group shadow-2xs hover:border-brand-blue/30 transition-all"
        >
          <img
            src={imageError ? fallbackImage : (product.image || fallbackImage)}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          {product.discountPercent > 0 && (
            <span className="absolute top-1 left-1 bg-brand-green text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
              {product.discountPercent}% OFF
            </span>
          )}
        </Link>

        {/* Product Details & Main Column */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4">
            <div className="min-w-0 flex-1">
              {/* Category tag & Variants */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-brand-blue bg-brand-light-blue px-2 py-0.5 rounded-md">
                  {product.categoryName || 'Product'}
                </span>
                {(selectedSize || selectedColor) && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                    {selectedSize ? `Size: ${selectedSize}` : ''}
                    {selectedSize && selectedColor ? ' • ' : ''}
                    {selectedColor ? `Color: ${selectedColor}` : ''}
                  </span>
                )}
              </div>

              {/* Title */}
              <Link
                to={`/product/${product.id}`}
                className="block font-bold text-gray-900 text-sm sm:text-base hover:text-brand-blue transition-colors line-clamp-2 leading-snug"
              >
                {product.name}
              </Link>

              {/* Unit Price Details */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">
                  ₹{product.price.toFixed(2)}
                </span>
                {hasDiscount && product.originalPrice && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      ₹{product.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-brand-green">
                      Save ₹{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Only: Item Total & Remove */}
            <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
              <span className="font-extrabold text-gray-900 text-base sm:text-lg">
                ₹{itemTotal.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => removeFromCart(product.id)}
                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Remove</span>
              </button>
            </div>
          </div>

          {/* Controls Bar: Mobile & Desktop */}
          <div className="flex items-center justify-between mt-3 pt-2.5 sm:pt-3 border-t border-gray-100">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-medium text-gray-500 sm:hidden mr-1">Qty:</span>
              <div className="inline-flex items-center bg-gray-50/90 border border-gray-200/90 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    quantity === 1
                      ? 'text-red-500 hover:bg-red-50 active:scale-95'
                      : 'text-gray-600 hover:bg-gray-200/80 active:scale-95'
                  }`}
                  title={quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                >
                  {quantity === 1 ? (
                    <Trash2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="w-8 sm:w-9 text-center text-xs sm:text-sm font-bold text-gray-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200/80 active:scale-95 transition-all cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Only: Total Price + Remove button */}
            <div className="flex sm:hidden items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block leading-tight">Subtotal</span>
                <span className="font-extrabold text-gray-900 text-sm">
                  ₹{itemTotal.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(product.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-colors border border-gray-100 cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Left: Stock status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-green font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>In Stock • Ready to dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

