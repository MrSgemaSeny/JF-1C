import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from '@/pages/home/HomePage';
import { AboutPage } from '@/pages/about/AboutPage';
import { ServicesPage } from '@/pages/services/ServicesPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
