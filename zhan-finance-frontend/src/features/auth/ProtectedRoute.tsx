import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}