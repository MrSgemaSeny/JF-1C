import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, setAccessToken, getAccessToken, ApiError, configureAuth } from './http';

describe('http.ts', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    setAccessToken(null);
    global.fetch = mockFetch;
    configureAuth(async () => false); // reset
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('injects Authorization header when token is present', async () => {
    setAccessToken('fake-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });

    await apiRequest('/api/protected', { method: 'GET' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchArgs = mockFetch.mock.calls[0];
    const headers = fetchArgs[1].headers;
    expect(headers).toHaveProperty('Authorization', 'Bearer fake-token');
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: 'Bad request', code: 'BAD_REQUEST' }),
    });

    await expect(apiRequest('/api/test')).rejects.toThrow(ApiError);
  });

  it('triggers onUnauthorized and retries on 401 if refresh succeeds', async () => {
    setAccessToken('old-token');

    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Unauthorized' }),
    });

    // Second call (retry) returns 200
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });

    const refreshMock = vi.fn().mockImplementation(async () => {
      setAccessToken('new-token');
      return true;
    });

    configureAuth(refreshMock);

    await apiRequest('/api/test');

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Assert retry used new token
    const retryHeaders = mockFetch.mock.calls[1][1].headers;
    expect(retryHeaders).toHaveProperty('Authorization', 'Bearer new-token');
  });

  it('throws ApiError if 401 refresh fails', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Unauthorized' }),
    });

    const refreshMock = vi.fn().mockResolvedValue(false);
    configureAuth(refreshMock);

    await expect(apiRequest('/api/test')).rejects.toThrow(ApiError);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not trigger refresh or retry for isAuthRoute on 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Unauthorized' }),
    });

    const refreshMock = vi.fn().mockResolvedValue(true);
    configureAuth(refreshMock);

    await expect(apiRequest('/auth/login', { method: 'POST' })).rejects.toThrow(ApiError);
    
    // Refresh should not be called because it is an auth route
    expect(refreshMock).not.toHaveBeenCalled();
    // Fetch should only be called once, no retry
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
