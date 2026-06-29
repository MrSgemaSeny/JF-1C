import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROUTES } from '@/shared/config/routes';
import type { UserRole } from './authApi';

export function roleHome(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return ROUTES.ADMIN;
    case 'EMPLOYEE':
      return ROUTES.EMPLOYEE;
    case 'CLIENT':
      return ROUTES.CLIENT;
    case 'LEARNER':
      return ROUTES.LEARNER_COURSES;
    default:
      return ROUTES.HOME;
  }
}

export function RoleProtectedRoute({ allow }: { allow: UserRole[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Could use a spinner here
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <Outlet />;
}
