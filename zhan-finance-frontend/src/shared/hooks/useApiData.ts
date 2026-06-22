import { useEffect, useState, useCallback } from 'react';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options?: {
    retries?: number;
    retryDelay?: number;
  }
): ApiDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setRetryCount(0);
    } catch (err: any) {
      const statusCode = err.response?.status || err.statusCode || 500;
      const message = err.response?.data?.message || err.message || 'Unknown error';
      // 401 and 403 usually are not retryable
      const isRetryable = err.isRetryable ?? (statusCode !== 401 && statusCode !== 403 && statusCode < 500);

      const apiError = err instanceof ApiError ? err : new ApiError(statusCode, message, isRetryable);

      if (apiError.isRetryable && retryCount < (options?.retries || 3)) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchData();
        }, options?.retryDelay || 1000);
      } else {
        setError(apiError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, retryCount, options]);

  useEffect(() => {
    fetchData();
  }, []); // Only run once on mount

  return { data, isLoading, error, refetch: fetchData };
}
