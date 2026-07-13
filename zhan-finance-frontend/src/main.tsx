import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@/shared/i18n/i18n';
import { App } from '@/app/App';
import { ToastProvider } from '@/shared/ui/Toast/ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);