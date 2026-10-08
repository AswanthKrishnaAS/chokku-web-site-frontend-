import React, { createContext, useContext, useState, useEffect } from 'react';
import { Category } from '../types';
import { safeFetch } from '../utils/api';

interface CategoryContextType {
  categories: Category[];
  sectionMetaTag: string;
  sectionTitle: string;
  sectionDescription: string;
  isLoading: boolean;
  addOrUpdateCategory: (categoryData: {
    id?: string;
    name: string;
    description: string;
    image: string;
    itemCount?: number;
    status?: 'Active' | 'Inactive';
  }) => Promise<{ success: boolean; message: string }>;
  uploadCategoryImage: (file: File) => Promise<{ success: boolean; message: string; imageUrl?: string }>;
  updateSectionHeadings: (
    metaTag: string,
    title: string,
    description: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; message: string }>;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const CATEGORIES_STORAGE_KEY = 'chokku_categories_v2';
const CATEGORY_SETTINGS_KEY = 'chokku_category_settings_v2';

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategoriesState] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sectionMetaTag, setSectionMetaTag] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_SETTINGS_KEY);
      return saved ? JSON.parse(saved).categoryMetaTag : 'EXPLORE DEPARTMENTS';
    } catch {
      return 'EXPLORE DEPARTMENTS';
    }
  });

  const [sectionTitle, setSectionTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_SETTINGS_KEY);
      return saved ? JSON.parse(saved).categorySectionTitle : 'Shop by Category';
    } catch {
      return 'Shop by Category';
    }
  });

  const [sectionDescription, setSectionDescription] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_SETTINGS_KEY);
      return saved ? JSON.parse(saved).categorySectionDescription : 'Discover our curated range of premium products';
    } catch {
      return 'Discover our curated range of premium products';
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveCategoriesLocal = (newCats: Category[]) => {
    setCategoriesState(newCats);
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(newCats));
    } catch (e) {
      console.error('Failed to save categories to local storage', e);
    }
  };

  const refreshCategories = async () => {
    try {
      setIsLoading(true);
      const res = await safeFetch('/categories');
      if (res.ok && res.isJson && res.data?.success) {
        if (Array.isArray(res.data.categories)) {
          saveCategoriesLocal(res.data.categories);
        }
        if (res.data.sectionSettings) {
          setSectionMetaTag(res.data.sectionSettings.categoryMetaTag || 'EXPLORE DEPARTMENTS');
          setSectionTitle(res.data.sectionSettings.categorySectionTitle || 'Shop by Category');
          setSectionDescription(res.data.sectionSettings.categorySectionDescription || 'Discover our curated range of premium products');
          localStorage.setItem(
            CATEGORY_SETTINGS_KEY,
            JSON.stringify(res.data.sectionSettings)
          );
        }
      }
    } catch (err) {
      console.warn('Could not fetch categories from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  const uploadCategoryImage = async (file: File) => {
    const formData = new FormData();
    formData.append('categoryImage', file);

    try {
      const res = await safeFetch('/categories/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.isJson && res.data?.success && res.data?.imageUrl) {
        return {
          success: true,
          message: res.data.message || 'Category image uploaded successfully',
          imageUrl: res.data.imageUrl,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to upload category image',
        };
      }
    } catch (err: any) {
      console.error('Category image upload error:', err);
      return {
        success: false,
        message: err.message || 'Network error during image upload',
      };
    }
  };

  const addOrUpdateCategory = async (categoryData: {
    id?: string;
    name: string;
    description: string;
    image: string;
    itemCount?: number;
    status?: 'Active' | 'Inactive';
  }) => {
    try {
      const res = await safeFetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });

      if (res.ok && res.isJson && res.data?.success) {
        if (Array.isArray(res.data.categories)) {
          saveCategoriesLocal(res.data.categories);
        }
        return {
          success: true,
          message: res.data.message || 'Category saved successfully',
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to save category to server',
        };
      }
    } catch (err: any) {
      console.error('Save category error:', err);
      // Fallback local save
      const categoryId = categoryData.id || 'cat-' + Date.now();
      const slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const updated = categories.filter((c) => c.id !== categoryId);
      const newCat: Category = {
        id: categoryId,
        name: categoryData.name,
        slug,
        description: categoryData.description,
        image: categoryData.image,
        itemCount: categoryData.itemCount || 0,
      };
      saveCategoriesLocal([newCat, ...updated]);
      return {
        success: true,
        message: 'Category saved locally (Offline mode)',
      };
    }
  };

  const updateSectionHeadings = async (
    metaTag: string,
    title: string,
    description: string
  ) => {
    setSectionMetaTag(metaTag);
    setSectionTitle(title);
    setSectionDescription(description);

    try {
      const res = await safeFetch('/categories/section-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryMetaTag: metaTag,
          categorySectionTitle: title,
          categorySectionDescription: description,
        }),
      });

      if (res.ok && res.isJson && res.data?.success) {
        return {
          success: true,
          message: res.data.message || 'Section headings updated successfully',
        };
      }
    } catch (err) {
      console.error('Error saving category section headings:', err);
    }
    return {
      success: true,
      message: 'Section headings updated locally',
    };
  };

  const deleteCategory = async (categoryId: string) => {
    const updated = categories.filter((c) => c.id !== categoryId);
    saveCategoriesLocal(updated);

    try {
      const res = await safeFetch(`/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (res.ok && res.isJson && res.data?.success) {
        if (Array.isArray(res.data.categories)) {
          saveCategoriesLocal(res.data.categories);
        }
        return {
          success: true,
          message: res.data.message || 'Category deleted successfully',
        };
      }
    } catch (err) {
      console.error('Delete category error:', err);
    }

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        sectionMetaTag,
        sectionTitle,
        sectionDescription,
        isLoading,
        addOrUpdateCategory,
        uploadCategoryImage,
        updateSectionHeadings,
        deleteCategory,
        refreshCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
