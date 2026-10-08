import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductReview } from '../types';
import { safeFetch } from '../utils/api';

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
      const res = await safeFetch('/products');
      if (res.ok && res.isJson && res.data?.success && Array.isArray(res.data?.products)) {
        saveProductsLocal(res.data.products);
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
    const formData = new FormData();
    files.forEach((file) => formData.append('productImages', file));

    try {
      const res = await safeFetch('/products/upload-images', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.isJson && res.data?.success && Array.isArray(res.data?.imageUrls)) {
        return {
          success: true,
          message: res.data.message || 'Images uploaded successfully',
          imageUrls: res.data.imageUrls,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to upload product images',
        };
      }
    } catch (err: any) {
      console.error('Upload product images error:', err);
      return {
        success: false,
        message: err.message || 'Network error during image upload',
      };
    }
  };

  const uploadTryOnImages = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('tryOnImages', file));

    try {
      const res = await safeFetch('/products/upload-tryon-images', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.isJson && res.data?.success && Array.isArray(res.data?.imageUrls)) {
        return {
          success: true,
          message: res.data.message || 'Try-On images uploaded successfully',
          imageUrls: res.data.imageUrls,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to upload Try-On images',
        };
      }
    } catch (err: any) {
      console.error('Upload Try-On images error:', err);
      return {
        success: false,
        message: err.message || 'Network error during Try-On upload',
      };
    }
  };

  const addProductOrUpdate = async (productData: Partial<Product>) => {
    try {
      const res = await safeFetch('/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok && res.isJson && res.data?.success) {
        if (Array.isArray(res.data.products)) {
          saveProductsLocal(res.data.products);
        } else {
          await refreshProducts();
        }
        return {
          success: true,
          message: res.data.message || 'Product saved successfully',
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to save product',
        };
      }
    } catch (err: any) {
      console.error('Save product error:', err);
      return {
        success: false,
        message: err.message || 'Error saving product',
      };
    }
  };

  const deleteProduct = async (productId: string) => {
    const updatedLocal = products.filter((p) => p.id !== productId);
    saveProductsLocal(updatedLocal);

    try {
      const res = await safeFetch(`/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok && res.isJson && res.data?.success && Array.isArray(res.data?.products)) {
        saveProductsLocal(res.data.products);
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  };

  const addOrUpdateReview = async (productId: string, reviewData: Partial<ProductReview>) => {
    try {
      const endpoint = reviewData.id
        ? `/products/${productId}/reviews/${reviewData.id}`
        : `/products/${productId}/reviews`;
      const method = reviewData.id ? 'PUT' : 'POST';

      const res = await safeFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (res.ok && res.isJson && res.data?.success) {
        if (res.data.product) {
          const updatedProds = products.map((p) => (p.id === productId ? res.data.product : p));
          saveProductsLocal(updatedProds);
        } else {
          await refreshProducts();
        }
        return {
          success: true,
          message: res.data.message || 'Review saved successfully',
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to save review',
        };
      }
    } catch (err: any) {
      console.error('Save review error:', err);
      return {
        success: false,
        message: err.message || 'Error saving review',
      };
    }
  };

  const deleteReview = async (productId: string, reviewId: string) => {
    try {
      const res = await safeFetch(`/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (res.ok && res.isJson && res.data?.success) {
        if (res.data.product) {
          const updatedProds = products.map((p) => (p.id === productId ? res.data.product : p));
          saveProductsLocal(updatedProds);
        } else {
          await refreshProducts();
        }
        return {
          success: true,
          message: res.data.message || 'Review deleted successfully',
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
      const res = await safeFetch('/products/fetch-meesho-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok && res.isJson && res.data?.success) {
        return {
          success: true,
          message: res.data.message || 'Product details fetched successfully',
          data: res.data.data,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to fetch Meesho product details',
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
      const res = await safeFetch('/products/fetch-meesho-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, count }),
      });

      if (res.ok && res.isJson && res.data?.success) {
        return {
          success: true,
          message: res.data.message || 'Product reviews fetched successfully',
          data: res.data.data,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to fetch Meesho product reviews',
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
      const res = await safeFetch(`/products/${productId}/import-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewsToImport }),
      });

      if (res.ok && res.isJson && res.data?.success) {
        if (res.data.product) {
          const updatedProds = products.map((p) => (p.id === productId ? res.data.product : p));
          saveProductsLocal(updatedProds);
        } else {
          await refreshProducts();
        }
        return {
          success: true,
          message: res.data.message || `Successfully imported ${reviewsToImport.length} reviews!`,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to import reviews',
        };
      }
    } catch (err: any) {
      console.error('Import reviews error:', err);
      return {
        success: false,
        message: err.message || 'Error importing reviews',
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
