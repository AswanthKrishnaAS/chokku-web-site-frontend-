import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProductOrUpdate: (productData: Partial<Product>) => Promise<{ success: boolean; message: string }>;
  uploadProductImages: (files: File[]) => Promise<{ success: boolean; message: string; imageUrls?: string[] }>;
  deleteProduct: (productId: string) => Promise<{ success: boolean; message: string }>;
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
        specifications: productData.specifications || {},
        isFeatured: productData.isFeatured || false,
        isNewArrival: productData.isNewArrival || false,
        isBestSeller: productData.isBestSeller || false,
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

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        addProductOrUpdate,
        uploadProductImages,
        deleteProduct,
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
