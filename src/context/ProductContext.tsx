import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductReview } from '../types';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProductOrUpdate: (productData: Partial<Product>) => Promise<{ success: boolean; message: string }>;
  uploadProductImages: (files: File[]) => Promise<{ success: boolean; message: string; imageUrls?: string[] }>;
  uploadTryOnImages: (files: File[]) => Promise<{ success: boolean; message: string; imageUrls?: string[] }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; message: string }>;
  addOrUpdateReview: (productId: string, reviewData: Partial<ProductReview>) => Promise<{ success: boolean; message: string }>;
  deleteReview: (productId: string, reviewId: string) => Promise<{ success: boolean; message: string }>;
  fetchMeeshoProductDetails: (url: string) => Promise<{ success: boolean; message: string; data?: any }>;
  fetchMeeshoReviews: (url: string, count?: number | string) => Promise<{ success: boolean; message: string; data?: any }>;
  importReviews: (productId: string, reviews: ProductReview[]) => Promise<{ success: boolean; message: string }>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PRODUCTS_STORAGE_KEY = 'chokku_products_v2';

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProductsState] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveProductsLocal = (newProds: Product[]) => {
    setProductsState(newProds);
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProds));
    } catch (e) {
      console.error('Failed to save products to local storage', e);
    }
  };

  const refreshProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          saveProductsLocal(data.products);
        }
      }
    } catch (err) {
      console.warn('Could not fetch products from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const uploadProductImages = async (files: File[]) => {
    if (!files || files.length === 0) {
      return { success: false, message: 'No image files selected' };
    }

    const formData = new FormData();
    // Allow up to 7 images
    const limitFiles = files.slice(0, 7);
    limitFiles.forEach((file) => {
      formData.append('productImages', file);
    });

    try {
      const res = await fetch(`${API_URL}/products/upload-images`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.imageUrls)) {
        return {
          success: true,
          message: data.message || 'Product images uploaded successfully',
          imageUrls: data.imageUrls,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to upload product images',
        };
      }
    } catch (err: any) {
      console.error('Product images upload error:', err);
      return {
        success: false,
        message: err.message || 'Network error during images upload',
      };
    }
  };

  const uploadTryOnImages = async (files: File[]) => {
    if (!files || files.length === 0) {
      return { success: false, message: 'No Try On image files selected' };
    }

    const formData = new FormData();
    // Allow up to 5 PNG images
    const limitFiles = files.slice(0, 5);
    limitFiles.forEach((file) => {
      formData.append('tryOnImages', file);
    });

    try {
      const res = await fetch(`${API_URL}/products/upload-tryon-images`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.imageUrls)) {
        return {
          success: true,
          message: data.message || 'Try On PNG images uploaded successfully',
          imageUrls: data.imageUrls,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to upload Try On PNG images',
        };
      }
    } catch (err: any) {
      console.error('Try On images upload error:', err);
      return {
        success: false,
        message: err.message || 'Network error during Try On images upload',
      };
    }
  };

  const addProductOrUpdate = async (productData: Partial<Product>) => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.products)) {
          saveProductsLocal(data.products);
        }
        return {
          success: true,
          message: data.message || 'Product saved successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to save product to server',
        };
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      // Offline fallback
      const prodId = productData.id || 'prod-' + Date.now();
      const slug = (productData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const updated = products.filter((p) => p.id !== prodId);
      const newProd: Product = {
        id: prodId,
        name: productData.name || 'New Product',
        slug,
        category: productData.category || 'general',
        categoryName: productData.categoryName || 'General',
        price: productData.price || 0,
        originalPrice: productData.originalPrice || productData.price || 0,
        discountPercent: productData.discountPercent || 0,
        discountTag: productData.discountTag || '',
        rating: productData.rating || 5.0,
        reviewCount: productData.reviewCount || 0,
        image: productData.image || (productData.galleryImages && productData.galleryImages[0]) || '',
        galleryImages: productData.galleryImages || [],
        description: productData.description || '',
        stock: productData.stock || 0,
        highlights: productData.highlights || [],
        additionalDetails: productData.additionalDetails || '',
        sizes: productData.sizes || [],
        isFeatured: productData.isFeatured || false,
        isNewArrival: productData.isNewArrival || false,
        isBestSeller: productData.isBestSeller || false,
        tryOn: productData.tryOn || false,
        tryOnImages: productData.tryOnImages || [],
      };
      saveProductsLocal([newProd, ...updated]);
      return {
        success: true,
        message: 'Product saved locally (Offline mode)',
      };
    }
  };

  const deleteProduct = async (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    saveProductsLocal(updated);

    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.products)) {
          saveProductsLocal(data.products);
        }
        return {
          success: true,
          message: data.message || 'Product deleted successfully',
        };
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }

    return {
      success: true,
      message: 'Product deleted locally',
    };
  };

  const addOrUpdateReview = async (productId: string, reviewData: Partial<ProductReview>) => {
    try {
      const isEdit = Boolean(reviewData.id);
      const url = isEdit
        ? `${API_URL}/products/${productId}/reviews/${reviewData.id}`
        : `${API_URL}/products/${productId}/reviews`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.products)) {
          saveProductsLocal(data.products);
        }
        return {
          success: true,
          message: data.message || 'Review saved successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to save review',
        };
      }
    } catch (err: any) {
      console.error('Save review error:', err);
      // Local fallback
      const targetProd = products.find((p) => p.id === productId);
      if (!targetProd) return { success: false, message: 'Product not found' };

      const reviewsList = targetProd.reviews ? [...targetProd.reviews] : [];
      if (reviewData.id) {
        const idx = reviewsList.findIndex((r) => r.id === reviewData.id);
        if (idx !== -1) {
          reviewsList[idx] = { ...reviewsList[idx], ...reviewData } as ProductReview;
        }
        const newRev: ProductReview = {
          id: 'rev-' + Date.now(),
          customerName: reviewData.customerName || 'Customer',
          rating: reviewData.rating || 5,
          comment: reviewData.comment || '',
          date: reviewData.date || new Date().toISOString().split('T')[0],
          image: reviewData.image || (reviewData.images && reviewData.images[0]) || '',
          images: reviewData.images || (reviewData.image ? [reviewData.image] : []),
        };
        reviewsList.push(newRev);
      }

      const total = reviewsList.reduce((sum, r) => sum + r.rating, 0);
      const updatedProd: Product = {
        ...targetProd,
        reviews: reviewsList,
        rating: Number((total / reviewsList.length).toFixed(1)),
        reviewCount: reviewsList.length,
      };

      const updatedProds = products.map((p) => (p.id === productId ? updatedProd : p));
      saveProductsLocal(updatedProds);

      return {
        success: true,
        message: 'Review saved locally (Offline mode)',
      };
    }
  };

  const deleteReview = async (productId: string, reviewId: string) => {
    // Optimistic local update
    const targetProd = products.find((p) => p.id === productId);
    if (targetProd && Array.isArray(targetProd.reviews)) {
      const filteredReviews = targetProd.reviews.filter((r) => r.id !== reviewId);
      const total = filteredReviews.reduce((sum, r) => sum + r.rating, 0);
      const updatedProd: Product = {
        ...targetProd,
        reviews: filteredReviews,
        rating: filteredReviews.length > 0 ? Number((total / filteredReviews.length).toFixed(1)) : 5.0,
        reviewCount: filteredReviews.length,
      };
      const updatedProds = products.map((p) => (p.id === productId ? updatedProd : p));
      saveProductsLocal(updatedProds);
    }

    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.products)) {
        saveProductsLocal(data.products);
        return {
          success: true,
          message: data.message || 'Review deleted successfully',
        };
      }
    } catch (err) {
      console.error('Delete review error:', err);
    }

    return {
      success: true,
      message: 'Review deleted',
    };
  };

  const fetchMeeshoProductDetails = async (url: string) => {
    try {
      const res = await fetch(`${API_URL}/products/fetch-meesho-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Product details fetched successfully',
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to fetch Meesho product details',
        };
      }
    } catch (err: any) {
      console.error('Fetch Meesho product details error:', err);
      return {
        success: false,
        message: err.message || 'Network error while fetching Meesho product details',
      };
    }
  };

  const fetchMeeshoReviews = async (url: string, count: number | string = 30) => {
    try {
      const res = await fetch(`${API_URL}/products/fetch-meesho-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, count }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Product reviews fetched successfully',
          data: data.data,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to fetch Meesho product reviews',
        };
      }
    } catch (err: any) {
      console.error('Fetch Meesho reviews error:', err);
      return {
        success: false,
        message: err.message || 'Network error while fetching Meesho product reviews',
      };
    }
  };

  const importReviews = async (productId: string, reviewsToImport: ProductReview[]) => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}/import-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewsToImport }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.product) {
          const updatedProds = products.map((p) => (p.id === productId ? data.product : p));
          saveProductsLocal(updatedProds);
        } else {
          await refreshProducts();
        }
        return {
          success: true,
          message: data.message || `Successfully imported ${reviewsToImport.length} reviews!`,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to import reviews',
        };
      }
    } catch (err: any) {
      console.error('Import reviews error:', err);
      // Offline fallback
      const targetProd = products.find((p) => p.id === productId);
      if (!targetProd) return { success: false, message: 'Product not found' };

      const existing = targetProd.reviews || [];
      const updatedReviews = [...existing, ...reviewsToImport];
      const total = updatedReviews.reduce((sum, r) => sum + r.rating, 0);

      const updatedProd: Product = {
        ...targetProd,
        reviews: updatedReviews,
        rating: Number((total / updatedReviews.length).toFixed(1)),
        reviewCount: updatedReviews.length,
      };

      const updatedProds = products.map((p) => (p.id === productId ? updatedProd : p));
      saveProductsLocal(updatedProds);

      return {
        success: true,
        message: 'Reviews imported locally (Offline mode)',
      };
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        addProductOrUpdate,
        uploadProductImages,
        uploadTryOnImages,
        deleteProduct,
        addOrUpdateReview,
        deleteReview,
        fetchMeeshoProductDetails,
        fetchMeeshoReviews,
        importReviews,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
