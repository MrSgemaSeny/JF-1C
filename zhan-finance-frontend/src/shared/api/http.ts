import i18n from '@/shared/i18n/i18n';
import { AUTH_STORAGE_KEY } from '@/shared/constants/storageKeys';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://zhanfinance.fly.dev' : '');

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
}

export interface ApiErrorDetail {
  field: string;
  error: string;
}

import { toast } from '@/shared/ui/Toast/ToastContext';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ApiErrorDetail[];
  requestId?: string;

  constructor(message: string, status: number, code?: string, details?: ApiErrorDetail[], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

type TokenGetter = () => string | null;
type RefreshHandler = () => Promise<string | null>;

let getAccessToken: TokenGetter = () => null;
let onUnauthorized: RefreshHandler = async () => null;

/**
 * Вызывается один раз из AuthProvider, чтобы http-клиент мог брать текущий
 * токен и пытаться обновить его на 401, не зная при этом ничего про
 * React-state или localStorage напрямую.
 */
export function configureAuth(tokenGetter: TokenGetter, refreshHandler: RefreshHandler) {
  getAccessToken = tokenGetter;
  onUnauthorized = refreshHandler;
}

async function rawRequest<T>(path: string, init: RequestInit | undefined, accessToken: string | null): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    'Accept-Language': i18n.language ?? 'ru',
    ...init?.headers
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    });
  } catch (err) {
    toast.error(i18n.t('common.connectionFailed', { defaultValue: 'Ошибка соединения. Проверьте подключение к интернету.' }), { duration: 5000 });
    throw new ApiError('Connection failed', 0);
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let code: string | undefined;
    let details: ApiErrorDetail[] | undefined;
    let requestId: string | undefined;

    try {
      const body = await response.json();
      if (body && body.message) {
        errorMessage = body.message;
      }
      if (body && body.code) {
        code = body.code;
      }
      if (body && Array.isArray(body.details)) {
        details = body.details;
      }
      if (body && body.requestId) {
        requestId = body.requestId;
      }
    } catch (_) {
      // Ignore JSON parse error for error responses
    }

    if (response.status === 403) {
      toast.error(i18n.t('common.accessDenied', { defaultValue: 'У вас нет доступа к этому ресурсу.' }), { duration: 5000 });
    } else if (response.status === 422) {
      toast.warning(errorMessage, { duration: 5000 });
    } else if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const msg = retryAfter
        ? `Превышен лимит запросов. Повторите попытку через ${retryAfter} сек.`
        : 'Превышен лимит запросов. Пожалуйста, подождите.';
      toast.error(msg, { duration: 5000 });
    } else if (response.status !== 401) {
      toast.error(errorMessage, { duration: 6000 });
    }

    throw new ApiError(errorMessage, response.status, code, details, requestId);
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  
  if (!body.success) {
    throw new ApiError(body.message ?? 'Request failed', response.status);
  }

  return body.data;
}

/**
 * На 401 пытается один раз обновить access-токен через refresh-токен
 * и повторяет исходный запрос. Если обновление не удалось - отдаёт
 * исходную 401-ошибку дальше, вызывающий код решает, что делать
 * (обычно: разлогинить и отправить на /login).
 */
let refreshPromise: Promise<string | null> | null = null;
let isRedirectingToLogin = false;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  try {
    return await rawRequest<T>(path, init, token);
  } catch (error) {
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/refresh') || path.includes('/auth/google');
    if (error instanceof ApiError && error.status === 401 && !isAuthRoute) {
      if (!refreshPromise) {
        refreshPromise = onUnauthorized().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshedToken = await refreshPromise;
      if (refreshedToken) {
        return await rawRequest<T>(path, init, refreshedToken);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;
          toast.warning(i18n.t('common.sessionExpired', { defaultValue: 'Сессия истекла, пожалуйста, войдите снова.' }), { duration: 5000 });
          window.location.href = import.meta.env.BASE_URL + 'login';
        }
        throw error;
      }
    }
    throw error;
  }
}

async function rawDownload(path: string, init: RequestInit | undefined, accessToken: string | null): Promise<Blob> {
  const headers = {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...init?.headers
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    });
  } catch (err) {
    toast.error(i18n.t('common.connectionFailed', { defaultValue: 'Ошибка соединения. Проверьте подключение к интернету.' }), { duration: 5000 });
    throw new ApiError('Connection failed', 0);
  }

  if (!response.ok) {
    let errorMessage = `Download failed with status ${response.status}`;
    let code: string | undefined;
    let details: ApiErrorDetail[] | undefined;
    let requestId: string | undefined;

    try {
      const text = await response.text();
      const body = JSON.parse(text);
      if (body && body.message) {
        errorMessage = body.message;
      }
      if (body && body.code) {
        code = body.code;
      }
      if (body && Array.isArray(body.details)) {
        details = body.details;
      }
      if (body && body.requestId) {
        requestId = body.requestId;
      }
    } catch (_) {
      // ignore
    }

    if (response.status === 403) {
      toast.error(i18n.t('common.accessDenied', { defaultValue: 'У вас нет доступа к этому ресурсу.' }), { duration: 5000 });
    } else if (response.status !== 401) {
      toast.error(errorMessage, { duration: 6000 });
    }

    throw new ApiError(errorMessage, response.status, code, details, requestId);
  }

  return response.blob();
}

export async function apiDownload(path: string, init?: RequestInit): Promise<Blob> {
  const token = getAccessToken();
  try {
    return await rawDownload(path, init, token);
  } catch (error) {
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/refresh') || path.includes('/auth/google');
    if (error instanceof ApiError && error.status === 401 && !isAuthRoute) {
      if (!refreshPromise) {
        refreshPromise = onUnauthorized().finally(() => {
          refreshPromise = null;
        });
      }
      const refreshedToken = await refreshPromise;
      if (refreshedToken) {
        return await rawDownload(path, init, refreshedToken);
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        toast.warning(i18n.t('common.sessionExpired', { defaultValue: 'Сессия истекла, пожалуйста, войдите снова.' }), { duration: 5000 });
        window.location.href = import.meta.env.BASE_URL + 'login';
        throw error;
      }
    }
    throw error;
  }
}

export function extractValidationErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.code === 'VALIDATION_ERROR' && error.details) {
    return error.details.reduce((acc, detail) => {
      if (acc[detail.field]) {
        acc[detail.field] += `, ${detail.error}`;
      } else {
        acc[detail.field] = detail.error;
      }
      return acc;
    }, {} as Record<string, string>);
  }
  return {};
}

export function getSecureImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  if (cleanUrl.startsWith('/uploads/') && !cleanUrl.startsWith('/api/')) {
    return `${API_BASE_URL}/api${cleanUrl}`;
  }
  return `${API_BASE_URL}${cleanUrl}`;
}

export function getWsEndpointUrl(token: string): string {
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const wsPath = baseUrl.endsWith('/api') ? '/ws' : '/api/ws';
  return `${baseUrl}${wsPath}?token=${token}`;
}

export { API_BASE_URL, getAccessToken };