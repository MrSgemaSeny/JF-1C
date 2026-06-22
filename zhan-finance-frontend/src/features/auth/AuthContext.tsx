import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { configureAuth } from '@/shared/api/http';
import * as authApi from './authApi';
import type { AuthResponse, UserRole } from './authApi';

const STORAGE_KEY = 'zhan_finance_auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: StoredAuth | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    // Битый JSON в localStorage (ручное редактирование, старый несовместимый формат) -
    // лучше тихо считать пользователя разлогиненным, чем уронить всё приложение.
    return null;
  }
}

function toStoredAuth(response: AuthResponse): StoredAuth {
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    userId: response.id,
    email: response.email,
    role: response.role
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredAuth | null>(() => readStoredAuth());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    // http.ts не должен импортировать AuthContext напрямую (циклическая
    // зависимость), поэтому регистрируем geter/refresh здесь, один раз.
    configureAuth(
      () => user?.accessToken ?? null,
      async () => {
        const current = readStoredAuth();
        if (!current) {
          return null;
        }
        try {
          const response = await authApi.refresh({ refreshToken: current.refreshToken });
          const next = toStoredAuth(response);
          setUser(next);
          return next.accessToken;
        } catch {
          setUser(null);
          return null;
        }
      }
    );
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    async login(email, password) {
      setIsLoading(true);
      try {
        const response = await authApi.login({ email, password });
        setUser(toStoredAuth(response));
      } finally {
        setIsLoading(false);
      }
    },
    async register(fullName, email, password) {
      setIsLoading(true);
      try {
        const response = await authApi.register({ fullName, email, password });
        setUser(toStoredAuth(response));
      } finally {
        setIsLoading(false);
      }
    },
    logout() {
      setUser(null);
    }
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}