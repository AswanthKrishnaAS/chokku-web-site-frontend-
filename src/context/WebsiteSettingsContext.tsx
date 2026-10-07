import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HomeSlideItem {
  id: string;
  _id?: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  linkUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTag: string;
  heading: string;
  subheading: string;
  buttonText?: string;
  buttonLink?: string;
  status?: 'Active' | 'Inactive';
  sortOrder?: number;
}

interface WebsiteSettingsContextType {
  navbarLogo: string;
  setNavbarLogo: (logoUrl: string) => void;
  homeSliders: HomeSlideItem[];
  setHomeSliders: (sliders: HomeSlideItem[]) => void;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  uploadNavbarLogo: (file: File) => Promise<{ success: boolean; message: string; navbarLogo?: string }>;
  uploadSliderImage: (file: File) => Promise<{ success: boolean; message: string; imageUrl?: string }>;
  saveHomeSliders: (sliders: HomeSlideItem[]) => Promise<{ success: boolean; message: string }>;
  createSlider: (slideData: Partial<HomeSlideItem>) => Promise<{ success: boolean; message: string; slider?: HomeSlideItem }>;
  updateSlider: (id: string, slideData: Partial<HomeSlideItem>) => Promise<{ success: boolean; message: string; slider?: HomeSlideItem }>;
  deleteSlider: (id: string) => Promise<{ success: boolean; message: string }>;
  toggleSliderStatus: (id: string, status?: 'Active' | 'Inactive') => Promise<{ success: boolean; message: string; slider?: HomeSlideItem }>;
}

const WebsiteSettingsContext = createContext<WebsiteSettingsContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SLIDERS_STORAGE_KEY = 'chokku_home_sliders_v1';

export const WebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navbarLogo, setNavbarLogoState] = useState<string>(() => {
    return localStorage.getItem('chokku_navbar_logo') || '';
  });

  const [homeSliders, setHomeSlidersState] = useState<HomeSlideItem[]>(() => {
    try {
      const saved = localStorage.getItem(SLIDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setNavbarLogo = (logoUrl: string) => {
    setNavbarLogoState(logoUrl);
    if (logoUrl) {
      localStorage.setItem('chokku_navbar_logo', logoUrl);
    } else {
      localStorage.removeItem('chokku_navbar_logo');
    }
  };

  const setHomeSliders = (sliders: HomeSlideItem[]) => {
    setHomeSlidersState(sliders);
    try {
      localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(sliders));
    } catch (e) {
      console.error('Failed to update sliders storage', e);
    }
  };

  const fetchHomepageSliders = async () => {
    try {
      // Try admin endpoint to get all slides (including inactive)
      const res = await fetch(`${API_URL}/homepage-sliders/admin`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sliders)) {
          setHomeSliders(data.sliders);
          return;
        }
      }
      // Fallback endpoint
      const fallbackRes = await fetch(`${API_URL}/homepage-sliders`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data.success && Array.isArray(data.sliders)) {
          setHomeSliders(data.sliders);
        }
      }
    } catch (err) {
      console.warn('Could not fetch homepage sliders from homepageSlider collection API:', err);
    }
  };

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/website-settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings && data.settings.navbarLogo) {
          setNavbarLogo(data.settings.navbarLogo);
        }
      }
      await fetchHomepageSliders();
    } catch (err) {
      console.warn('Could not fetch website settings from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const uploadNavbarLogo = async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch(`${API_URL}/website-settings/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.navbarLogo) {
        setNavbarLogo(data.navbarLogo);
        return {
          success: true,
          message: data.message || 'Navbar logo updated successfully',
          navbarLogo: data.navbarLogo,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to upload navbar logo',
        };
      }
    } catch (err: any) {
      console.error('Navbar logo upload error:', err);
      return {
        success: false,
        message: err.message || 'Network error during logo upload',
      };
    }
  };

  const uploadSliderImage = async (file: File) => {
    const formData = new FormData();
    formData.append('sliderImage', file);

    try {
      const res = await fetch(`${API_URL}/homepage-sliders/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        return {
          success: true,
          message: data.message || 'Banner image uploaded successfully',
          imageUrl: data.imageUrl,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to upload banner image',
        };
      }
    } catch (err: any) {
      console.error('Slider image upload error:', err);
      return {
        success: false,
        message: err.message || 'Network error during slider image upload',
      };
    }
  };

  const createSlider = async (slideData: Partial<HomeSlideItem>) => {
    try {
      const res = await fetch(`${API_URL}/homepage-sliders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.slider) {
        await fetchHomepageSliders();
        return {
          success: true,
          message: data.message || 'Homepage slider created successfully',
          slider: data.slider,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to create slider',
        };
      }
    } catch (err: any) {
      console.error('Create slider error:', err);
      return {
        success: false,
        message: err.message || 'Error creating slider in homepageSlider collection',
      };
    }
  };

  const updateSlider = async (id: string, slideData: Partial<HomeSlideItem>) => {
    try {
      const res = await fetch(`${API_URL}/homepage-sliders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.slider) {
        await fetchHomepageSliders();
        return {
          success: true,
          message: data.message || 'Homepage slider updated successfully',
          slider: data.slider,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to update slider',
        };
      }
    } catch (err: any) {
      console.error('Update slider error:', err);
      return {
        success: false,
        message: err.message || 'Error updating slider',
      };
    }
  };

  const toggleSliderStatus = async (id: string, status?: 'Active' | 'Inactive') => {
    try {
      const res = await fetch(`${API_URL}/homepage-sliders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.slider) {
        await fetchHomepageSliders();
        return {
          success: true,
          message: data.message || 'Slider status updated',
          slider: data.slider,
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to update slider status',
        };
      }
    } catch (err: any) {
      console.error('Toggle slider status error:', err);
      return {
        success: false,
        message: err.message || 'Error updating slider status',
      };
    }
  };

  const deleteSlider = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/homepage-sliders/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchHomepageSliders();
        return {
          success: true,
          message: data.message || 'Slider banner deleted successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to delete slider banner',
        };
      }
    } catch (err: any) {
      console.error('Delete slider error:', err);
      return {
        success: false,
        message: err.message || 'Error deleting slider',
      };
    }
  };

  const saveHomeSliders = async (sliders: HomeSlideItem[]) => {
    setHomeSliders(sliders);
    try {
      for (const slide of sliders) {
        if (slide.id && slide.id.length === 24 && !slide.id.startsWith('slide-')) {
          await updateSlider(slide.id, slide);
        } else {
          await createSlider(slide);
        }
      }
      await fetchHomepageSliders();
      return {
        success: true,
        message: 'Homepage sliders saved to homepageSlider collection',
      };
    } catch (err: any) {
      console.error('Save home sliders error:', err);
      return {
        success: true,
        message: 'Saved sliders locally (Offline Mode)',
      };
    }
  };

  return (
    <WebsiteSettingsContext.Provider
      value={{
        navbarLogo,
        setNavbarLogo,
        homeSliders,
        setHomeSliders,
        isLoading,
        refreshSettings,
        uploadNavbarLogo,
        uploadSliderImage,
        saveHomeSliders,
        createSlider,
        updateSlider,
        deleteSlider,
        toggleSliderStatus,
      }}
    >
      {children}
    </WebsiteSettingsContext.Provider>
  );
};

export const useWebsiteSettings = () => {
  const context = useContext(WebsiteSettingsContext);
  if (!context) {
    throw new Error('useWebsiteSettings must be used within a WebsiteSettingsProvider');
  }
  return context;
};
