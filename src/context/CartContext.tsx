import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CartItem, Product } from '../types';
import { useToast } from './ToastContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  couponCode: string;
  isCouponApplied: boolean;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ecoblue_cart_v1';
const COUPON_STORAGE_KEY = 'ecoblue_coupon_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    try {
      return localStorage.getItem(COUPON_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
    } catch (e) {
      console.error('Failed to save coupon to localStorage', e);
    }
  }, [couponCode]);

  const addToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        addToast('Updated Cart', `Increased ${product.name} quantity to ${newQty}.`, 'success');
        return updated;
      } else {
        addToast('Added to Cart', `${product.name} has been added to your shopping cart.`, 'success');
        return [...prev, { product, quantity, selectedColor: color, selectedSize: size }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    const target = cartItems.find((i) => i.product.id === productId);
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    if (target) {
      addToast('Removed from Cart', `${target.product.name} removed.`, 'info');
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'SAVE10' || cleanCode === 'WELCOME20' || cleanCode === 'ECOBLUE') {
      setCouponCode(cleanCode);
      addToast('Coupon Applied!', `Discount code "${cleanCode}" successfully applied.`, 'success');
      return true;
    } else {
      addToast('Invalid Coupon', 'Please enter a valid discount code (e.g. SAVE10 or WELCOME20).', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    addToast('Coupon Removed', 'Discount code removed from cart.', 'info');
  };

  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!couponCode) return 0;
    if (couponCode === 'SAVE10') return subtotal * 0.10;
    if (couponCode === 'WELCOME20') return subtotal * 0.20;
    if (couponCode === 'ECOBLUE') return subtotal * 0.15;
    return 0;
  }, [subtotal, couponCode]);

  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal > 50 ? 0 : 5.99;
  }, [subtotal]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + deliveryFee);
  }, [subtotal, discountAmount, deliveryFee]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        couponCode,
        isCouponApplied: Boolean(couponCode),
        applyCoupon,
        removeCoupon,
        totalItems,
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
