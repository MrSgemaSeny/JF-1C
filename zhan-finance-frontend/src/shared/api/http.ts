const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

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
    ...init?.headers
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  try {
    return await rawRequest<T>(path, init, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (!refreshPromise) {
        refreshPromise = onUnauthorized().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        return await rawRequest<T>(path, init, newToken);
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

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
    throw new ApiError(errorMessage, response.status, code, details, requestId);
  }

  return response.blob();
}

export async function apiDownload(path: string, init?: RequestInit): Promise<Blob> {
  const token = getAccessToken();
  try {
    return await rawDownload(path, init, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (!refreshPromise) {
        refreshPromise = onUnauthorized().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        return await rawDownload(path, init, newToken);
      }
    }
    throw error;
  }
}

export { API_BASE_URL, getAccessToken };