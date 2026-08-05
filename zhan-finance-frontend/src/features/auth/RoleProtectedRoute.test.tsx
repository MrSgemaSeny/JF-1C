import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleProtectedRoute, roleHome } from './RoleProtectedRoute';
import * as AuthContextModule from './AuthContext';
import type { AuthContextValue, StoredAuth } from './AuthContext';
import { ROUTES } from '@/shared/config/routes';

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

const baseAuth: AuthContextValue = {
  user: null,
  isLoading: false,
  setUser: vi.fn(),
  updateUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  completeAuth: vi.fn(),
  loginWithGoogle: vi.fn(),
};

const mockAuth = (overrides: Partial<AuthContextValue> = {}) => {
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({ ...baseAuth, ...overrides });
};

const makeUser = (role: StoredAuth['role']): StoredAuth => ({
  userId: 1,
  email: 'test@test.com',
  fullName: 'Test User',
  role,
});

describe('roleHome', () => {
  it('returns correct home routes for roles', () => {
    expect(roleHome('ADMIN')).toBe(ROUTES.ADMIN);
    expect(roleHome('ADVISOR')).toBe(ROUTES.ADVISOR);
    expect(roleHome('EMPLOYEE')).toBe(ROUTES.EMPLOYEE);
    expect(roleHome('CLIENT')).toBe(ROUTES.CLIENT);
    expect(roleHome('LEARNER')).toBe(ROUTES.LEARNER_COURSES);
    expect(roleHome('CURATOR')).toBe(ROUTES.CURATOR);
    expect(roleHome('UNKNOWN' as any)).toBe(ROUTES.HOME);
  });
});

describe('RoleProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (allowRoles: StoredAuth['role'][]) => {
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
    mockAuth({ isLoading: true, user: null });
    renderComponent(['ADMIN']);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login if user is not authenticated', () => {
    mockAuth({ isLoading: false, user: null });
    renderComponent(['ADMIN']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to role home if user does not have allowed role', () => {
    mockAuth({ isLoading: false, user: makeUser('CLIENT') });
    renderComponent(['ADMIN', 'EMPLOYEE']);
    expect(screen.getByText('Client Home')).toBeInTheDocument();
  });

  it('renders Outlet (protected content) if user has allowed role', () => {
    mockAuth({ isLoading: false, user: makeUser('ADMIN') });
    renderComponent(['ADMIN', 'EMPLOYEE']);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});