// Centralized API configuration and safe fetch wrapper for production & local

export const getApiUrl = (path: string = ''): string => {
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    return path;
  }

  let base = '';
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  const storedUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem('chokku_live_api_url') || '').trim() : '';

  if (envUrl) {
    base = envUrl;
  } else if (storedUrl) {
    base = storedUrl;
  } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production live website fallback to origin /api
    base = `${window.location.origin}/api`;
  } else {
    base = 'http://localhost:5000/api';
  }

  // Strip trailing slashes
  base = base.replace(/\/+$/, '');

  // If path is empty, return normalized base ending in /api
  if (!path) {
    if (!base.endsWith('/api') && !base.includes('/api/')) {
      return `${base}/api`;
    }
    return base;
  }

  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If base already ends with /api and cleanPath starts with /api/, remove /api from cleanPath
  if (base.endsWith('/api')) {
    if (cleanPath === '/api') {
      cleanPath = '';
    } else if (cleanPath.startsWith('/api/')) {
      cleanPath = cleanPath.substring(4);
    }
  } else if (!base.includes('/api/')) {
    // Base does not have /api, check if cleanPath already starts with /api
    if (!cleanPath.startsWith('/api/')) {
      base = `${base}/api`;
    }
  }

  return `${base}${cleanPath}`;
};

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  isJson: boolean;
  data: T | null;
  text: string;
  error?: string;
}

export const safeFetch = async <T = any>(
  urlOrPath: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> => {
  const fullUrl = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')
    ? urlOrPath
    : getApiUrl(urlOrPath);

  try {
    const res = await fetch(fullUrl, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    if (!text || !text.trim()) {
      return {
        ok: res.ok,
        status: res.status,
        isJson: false,
        data: null,
        text: '',
      };
    }

    const trimmed = text.trim();
    const looksLikeJson = contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[');

    if (looksLikeJson) {
      try {
        const data = JSON.parse(text);
        return {
          ok: res.ok,
          status: res.status,
          isJson: true,
          data,
          text,
        };
      } catch (parseErr: any) {
        return {
          ok: false,
          status: res.status,
          isJson: false,
          data: null,
          text,
          error: `JSON parse error: ${parseErr.message}`,
        };
      }
    }

    let customErrorMessage = `Server returned non-JSON response (status ${res.status}): ${text.substring(0, 100)}`;
    if (res.status === 404 && text.includes('<!DOCTYPE html>')) {
      customErrorMessage = `API endpoint not found (404). Please ensure the backend live service is deployed and VITE_API_URL is configured. Target: ${fullUrl}`;
    }

    return {
      ok: res.ok,
      status: res.status,
      isJson: false,
      data: null,
      text,
      error: res.ok ? undefined : customErrorMessage,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      isJson: false,
      data: null,
      text: '',
      error: netErr.message || 'Network request failed',
    };
  }
};
