import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from '@/pages/home/HomePage';
import { AboutPage } from '@/pages/about/AboutPage';
import { ServicesPage } from '@/pages/services/ServicesPage';
import { LoginPage } from '@/pages/auth/login/LoginPage';
import { RegisterPage } from '@/pages/auth/register/RegisterPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}