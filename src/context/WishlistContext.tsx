import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { PRODUCTS } from '../data/products';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_KEY = 'ecoblue_wishlist_v1';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlistIds]);

  const toggleWishlist = (productId: string, nameOverride?: string) => {
    let productName = nameOverride;
    if (!productName) {
      try {
        const saved = localStorage.getItem('chokku_products_v2');
        if (saved) {
          const prods = JSON.parse(saved);
          const found = prods.find((p: any) => p.id === productId);
          if (found) productName = found.name;
        }
      } catch {}
    }
    if (!productName) {
      const product = PRODUCTS.find((p) => p.id === productId);
      productName = product ? product.name : 'Product';
    }

    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        addToast('Removed from Wishlist', `${productName} removed from your saved items.`, 'info');
        return prev.filter((id) => id !== productId);
      } else {
        addToast('Saved to Wishlist', `${productName} added to your wishlist.`, 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistIds.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
