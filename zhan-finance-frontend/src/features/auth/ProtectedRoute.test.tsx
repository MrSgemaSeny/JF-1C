import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from './AuthContext';
import { ROUTES } from '@/shared/config/routes';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<div>Login Page</div>} />
          <Route path="/protected" element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('redirects to login if user is not authenticated', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    renderComponent();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders Outlet (protected content) if user is authenticated', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoading: false,
      user: { id: 1, email: 'test@test.com' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as any);

    renderComponent();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
