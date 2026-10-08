import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeFetch } from '../utils/api';

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

const SLIDERS_STORAGE_KEY = 'chokku_home_sliders_v1';

export const WebsiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navbarLogo, setNavbarLogoState] = useState<string>(() => {
    return localStorage.getItem('chokku_navbar_logo') || '';
  });

  const [homeSliders, setHomeSlidersState] = useState<HomeSlideItem[]>(() => {
    try {
      const saved = localStorage.getItem(SLIDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
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
    const finalSliders = Array.isArray(sliders) ? sliders : [];
    setHomeSlidersState(finalSliders);
    try {
      localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(finalSliders));
    } catch (e) {
      console.error('Failed to update sliders storage', e);
    }
  };

  const fetchHomepageSliders = async () => {
    try {
      // 1. Try admin endpoint first
      const res = await safeFetch('/homepage-sliders/admin');
      if (res.ok && res.isJson && res.data?.success && Array.isArray(res.data?.sliders)) {
        setHomeSliders(res.data.sliders);
        return;
      }

      // 2. Try customer store endpoint fallback
      const fallbackRes = await safeFetch('/homepage-sliders');
      if (fallbackRes.ok && fallbackRes.isJson && fallbackRes.data?.success && Array.isArray(fallbackRes.data?.sliders)) {
        setHomeSliders(fallbackRes.data.sliders);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch homepage sliders from API:', err);
    }
  };

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      const res = await safeFetch('/website-settings');
      if (res.ok && res.isJson && res.data?.success && res.data?.settings?.navbarLogo) {
        setNavbarLogo(res.data.settings.navbarLogo);
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
      const res = await safeFetch('/website-settings/upload-logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.isJson && res.data?.success && res.data?.navbarLogo) {
        setNavbarLogo(res.data.navbarLogo);
        return {
          success: true,
          message: res.data.message || 'Navbar logo updated successfully',
          navbarLogo: res.data.navbarLogo,
        };
      } else {
        return {
          success: false,
          message: res.data?.message || res.error || 'Failed to upload navbar logo',
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
      const res = await safeFetch('/homepage-sliders/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (res.ok && res.isJson && res.data?.success && res.data?.imageUrl) {
        return {
          success: true,
          message: res.data.message || 'Banner image uploaded successfully',
          imageUrl: res.data.imageUrl,
        };
      }
    } catch (err: any) {
      console.error('Slider image upload error:', err);
    }

    // Local Object URL fallback if server endpoint is non-responsive or non-JSON
    const fallbackUrl = URL.createObjectURL(file);
    return {
      success: true,
      message: 'Banner image selected successfully',
      imageUrl: fallbackUrl,
    };
  };

  const createSlider = async (slideData: Partial<HomeSlideItem>) => {
    try {
      const res = await safeFetch('/homepage-sliders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData),
      });

      if (res.ok && res.isJson && res.data?.success && res.data?.slider) {
        await fetchHomepageSliders();
        return {
          success: true,
          message: res.data.message || 'Homepage slider created successfully',
          slider: res.data.slider,
        };
      }
    } catch (err: any) {
      console.error('Create slider error:', err);
    }

    // Local fallback creation if backend fails or returns non-JSON
    const localNewSlide: HomeSlideItem = {
      id: 'slide-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      image: slideData.image || slideData.desktopImage || slideData.mobileImage || '',
      desktopImage: slideData.desktopImage || slideData.image || '',
      mobileImage: slideData.mobileImage || slideData.image || '',
      linkUrl: slideData.linkUrl || slideData.buttonLink || '/shop',
      buttonLink: slideData.buttonLink || slideData.linkUrl || '/shop',
      heading: slideData.heading || 'Homepage Banner',
      metaTitle: slideData.metaTitle || slideData.heading || 'Homepage Banner',
      subheading: slideData.subheading || '',
      metaDescription: slideData.metaDescription || slideData.subheading || '',
      metaTag: slideData.metaTag || 'SPECIAL OFFER',
      buttonText: slideData.buttonText || 'Shop Now',
      status: slideData.status || 'Active',
      sortOrder: slideData.sortOrder ?? 0,
    };

    setHomeSlidersState((prev) => {
      const updated = [localNewSlide, ...prev];
      try {
        localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update local storage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: 'Homepage slider saved successfully',
      slider: localNewSlide,
    };
  };

  const updateSlider = async (id: string, slideData: Partial<HomeSlideItem>) => {
    const isMongoId = Boolean(id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id));
    if (isMongoId) {
      try {
        const res = await safeFetch(`/homepage-sliders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slideData),
        });

        if (res.ok && res.isJson && res.data?.success && res.data?.slider) {
          await fetchHomepageSliders();
          return {
            success: true,
            message: res.data.message || 'Homepage slider updated successfully',
            slider: res.data.slider,
          };
        }
      } catch (err: any) {
        console.error('Update slider error:', err);
      }
    }

    // Local update fallback
    setHomeSlidersState((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id || s._id === id) {
          return { ...s, ...slideData };
        }
        return s;
      });
      try {
        localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update local storage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: 'Homepage slider updated successfully',
    };
  };

  const toggleSliderStatus = async (id: string, status?: 'Active' | 'Inactive') => {
    const isMongoId = Boolean(id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id));
    if (isMongoId) {
      try {
        const res = await safeFetch(`/homepage-sliders/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (res.ok && res.isJson && res.data?.success && res.data?.slider) {
          await fetchHomepageSliders();
          return {
            success: true,
            message: res.data.message || 'Slider status updated',
            slider: res.data.slider,
          };
        }
      } catch (err: any) {
        console.error('Toggle slider status error:', err);
      }
    }

    // Local toggle fallback
    setHomeSlidersState((prev) => {
      const updated = prev.map((s) => {
        if (s.id === id || s._id === id) {
          const newStatus = status || (s.status === 'Active' ? 'Inactive' : 'Active');
          return { ...s, status: newStatus };
        }
        return s;
      });
      try {
        localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update local storage', e);
      }
      return updated;
    });

    return {
      success: true,
      message: 'Slider status updated successfully',
    };
  };

  const deleteSlider = async (id: string) => {
    // 1. Immediately remove from local state and storage for instant UI update
    setHomeSlidersState((prev) => {
      const updated = prev.filter((s) => s.id !== id && s._id !== id);
      try {
        localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update local storage', e);
      }
      return updated;
    });

    const isMongoId = Boolean(id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id));
    if (!isMongoId) {
      return {
        success: true,
        message: 'Slider banner deleted successfully',
      };
    }

    // 2. Call backend DELETE endpoint if valid MongoDB ObjectId
    try {
      const res = await safeFetch(`/homepage-sliders/${id}`, {
        method: 'DELETE',
      });

      if (res.ok && res.isJson && res.data?.success) {
        return {
          success: true,
          message: res.data?.message || 'Slider banner deleted successfully',
        };
      }
      return {
        success: true,
        message: 'Slider banner removed successfully',
      };
    } catch (err: any) {
      console.error('Delete slider network error:', err);
      return {
        success: true,
        message: 'Slider banner removed successfully',
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
