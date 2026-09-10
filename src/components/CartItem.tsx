import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Product info */}
      <div className="flex items-center gap-4 flex-1">
        <Link to={`/product/${product.id}`} className="shrink-0">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-20 h-20 object-cover rounded-xl border border-gray-100 bg-gray-50"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">
            {product.categoryName}
          </span>
          <Link to={`/product/${product.id}`} className="block hover:text-brand-blue transition-colors">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h4>
          </Link>
          <div className="text-xs text-gray-500 mt-1">
            Unit Price: <span className="font-medium text-gray-700">₹{product.price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Quantity & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <button
            onClick={() => updateQuantity(product.id, quantity - 1)}
            className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 text-sm font-semibold text-gray-800 min-w-[2rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => updateQuantity(product.id, quantity + 1)}
            className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"
            title="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Item Total Price */}
        <div className="text-right min-w-[5rem]">
          <span className="font-bold text-gray-900 text-base">
            ₹{(product.price * quantity).toFixed(2)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => removeFromCart(product.id)}
          className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
