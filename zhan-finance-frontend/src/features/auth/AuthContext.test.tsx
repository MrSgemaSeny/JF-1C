import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApiModule from './authApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./authApi', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  googleLogin: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { changeLanguage: vi.fn() } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const TestComponent = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading Auth...</div>;
  if (!user) return <div>No User</div>;
  return <div>User: {user.email}</div>;
};

describe('AuthContext', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderWithAuth = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it('provides loading state initially', async () => {
    vi.mocked(authApiModule.getMe).mockImplementation(() => new Promise(() => {})); // hang
    renderWithAuth();
    expect(await screen.findByText('Loading...')).toBeInTheDocument();
  });

  it('fetches user and provides it', async () => {
    vi.mocked(authApiModule.getMe).mockResolvedValue({
      id: 1,
      email: 'test@test.com',
      role: 'CLIENT',
    } as any);

    renderWithAuth();
    expect(await screen.findByText('User: test@test.com')).toBeInTheDocument();
  });

  it('handles unauth state', async () => {
    vi.mocked(authApiModule.getMe).mockRejectedValue(new Error('unauth'));
    
    renderWithAuth();
    expect(await screen.findByText('No User')).toBeInTheDocument();
  });
});
