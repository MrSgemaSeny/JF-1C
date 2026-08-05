import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleProtectedRoute, roleHome } from './RoleProtectedRoute';
import * as AuthContextModule from './AuthContext';
import { ROUTES } from '@/shared/config/routes';
import type { UserDto } from './authApi';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('roleHome', () => {
  it('returns correct home routes for roles', () => {
    expect(roleHome('ADMIN')).toBe(ROUTES.ADMIN);
    expect(roleHome('ADVISOR')).toBe(ROUTES.ADVISOR);
    expect(roleHome('EMPLOYEE')).toBe(ROUTES.EMPLOYEE);
    expect(roleHome('CLIENT')).toBe(ROUTES.CLIENT);
    expect(roleHome('LEARNER')).toBe(ROUTES.LEARNER_COURSES);
    expect(roleHome('CURATOR')).toBe(ROUTES.CURATOR);
    // fallback
    expect(roleHome('UNKNOWN' as any)).toBe(ROUTES.HOME);
  });
});

describe('RoleProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (allowRoles: Array<UserDto['role']>) => {
    return render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/client" element={<div>Client Home</div>} />
          <Route path="/protected" element={<RoleProtectedRoute allow={allowRoles} />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state when isLoading is true', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderComponent(['ADMIN']);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login if user is not authenticated', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderComponent(['ADMIN']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to role home if user does not have allowed role', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoading: false,
      user: { id: 1, role: 'CLIENT' } as UserDto,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderComponent(['ADMIN', 'EMPLOYEE']);
    expect(screen.getByText('Client Home')).toBeInTheDocument();
  });

  it('renders Outlet (protected content) if user has allowed role', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoading: false,
      user: { id: 1, role: 'ADMIN' } as UserDto,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    });

    renderComponent(['ADMIN', 'EMPLOYEE']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
