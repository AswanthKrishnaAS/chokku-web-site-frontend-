// Centralized API configuration and safe fetch wrapper for production & local

export const getApiUrl = (path: string = ''): string => {
  let base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
  
  // Remove trailing slashes
  base = base.replace(/\/+$/, '');
  
  // Ensure base ends with /api if not present
  if (!base.endsWith('/api') && !base.includes('/api/')) {
    base = `${base}/api`;
  }
  
  if (!path) return base;

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
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

    return {
      ok: res.ok,
      status: res.status,
      isJson: false,
      data: null,
      text,
      error: res.ok ? undefined : `Server returned non-JSON response (status ${res.status}): ${text.substring(0, 100)}`,
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
