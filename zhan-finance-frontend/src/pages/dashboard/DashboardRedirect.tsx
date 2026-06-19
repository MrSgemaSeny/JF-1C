import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHome } from '@/features/auth/RoleProtectedRoute';
import { ROUTES } from '@/shared/config/routes';

export function DashboardRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Navigate to={roleHome(user.role)} replace />;
}
