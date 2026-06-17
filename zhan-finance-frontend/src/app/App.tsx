import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { HomePage } from '@/pages/home';
import { AboutPage } from '@/pages/about';
import { ServicesPage } from '@/pages/services';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-beige text-brand-green font-sans">
        <Routes>
          <Route path={ROUTES.HOME}     element={<HomePage />} />
          <Route path={ROUTES.ABOUT}    element={<AboutPage />} />
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
