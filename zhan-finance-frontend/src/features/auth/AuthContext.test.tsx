import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApiModule from './authApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./authApi', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  logoutUser: vi.fn(),
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

  it('handles login and logout flow', async () => {
    vi.mocked(authApiModule.getMe).mockRejectedValue(new Error('unauth'));
    vi.mocked(authApiModule.login).mockResolvedValue({ id: 1, email: 'logged@in.com', role: 'CLIENT' } as any);
    vi.mocked(authApiModule.logoutUser).mockResolvedValue(undefined as any);

    const TestLoginComponent = () => {
      const { user, login, logout } = useAuth();
      return (
        <div>
          <div>User: {user ? user.email : 'None'}</div>
          <button onClick={() => login('test@test.com', 'pwd')}>Login</button>
          <button onClick={() => logout()}>Logout</button>
        </div>
      );
    };

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('User: None')).toBeInTheDocument();
    
    const loginBtn = await screen.findByText('Login');
    loginBtn.click();
    
    expect(await screen.findByText('User: logged@in.com')).toBeInTheDocument();
    
    const logoutBtn = await screen.findByText('Logout');
    logoutBtn.click();
    
    expect(await screen.findByText('User: None')).toBeInTheDocument();
  });

  it('handles login with 2FA requirement', async () => {
    vi.mocked(authApiModule.getMe).mockRejectedValue(new Error('unauth'));
    vi.mocked(authApiModule.login).mockResolvedValue({ requires2FA: true, preAuthToken: 'token123' } as any);
    
    const Test2FAComponent = () => {
      const { login } = useAuth();
      return <button onClick={async () => {
        const res = await login('test@test.com', 'pwd');
        if (res?.requires2FA) {
          document.body.dataset.requires2FA = 'true';
        }
      }}>Login2FA</button>;
    };

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Test2FAComponent />
        </AuthProvider>
      </QueryClientProvider>
    );

    const btn = await screen.findByText('Login2FA');
    btn.click();
    
    // We can't use waitFor without importing it, but we can just use a simple setTimeout or findByText trick if possible,
    // or just import waitFor at the top. Let's just import waitFor at the top first, or we can use findBy instead.
    // Let's use a small helper or just await a microtask since login is mocked to resolve immediately.
    await new Promise(r => setTimeout(r, 0));
    expect(document.body.dataset.requires2FA).toBe('true');
  });
});
