const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  timestamp: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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
    try {
      const body = await response.json();
      if (body && body.message) {
        errorMessage = body.message;
      }
    } catch (_) {
      // Ignore JSON parse error for error responses
    }
    throw new ApiError(errorMessage, response.status);
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
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  try {
    return await rawRequest<T>(path, init, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const newToken = await onUnauthorized();
      if (newToken) {
        return await rawRequest<T>(path, init, newToken);
      }
    }
    throw error;
  }
}

export { API_BASE_URL, getAccessToken };