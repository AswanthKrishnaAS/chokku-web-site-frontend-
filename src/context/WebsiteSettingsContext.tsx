import React, { createContext, useContext, useState, useEffect } from 'react';

export interface HomeSlideItem {
  id: string;
  image: string;
  metaTag: string;
  heading: string;
  subheading: string;
  buttonText?: string;
  buttonLink?: string;
  status?: 'Active' | 'Inactive';
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

  const refreshSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/website-settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          if (data.settings.navbarLogo) {
            setNavbarLogo(data.settings.navbarLogo);
          }
          if (Array.isArray(data.settings.homeSliders) && data.settings.homeSliders.length > 0) {
            setHomeSliders(data.settings.homeSliders);
          }
        }
      }
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
      const res = await fetch(`${API_URL}/website-settings/upload-slider-image`, {
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

  const saveHomeSliders = async (sliders: HomeSlideItem[]) => {
    setHomeSliders(sliders);
    try {
      const res = await fetch(`${API_URL}/website-settings/home-sliders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sliders }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.homeSliders)) {
          setHomeSliders(data.homeSliders);
        }
        return {
          success: true,
          message: data.message || 'Home sliders saved successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to save sliders to backend database',
        };
      }
    } catch (err: any) {
      console.error('Save home sliders error:', err);
      return {
        success: true,
        message: 'Saved home sliders locally (Offline Mode)',
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
