import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small timeout so it doesn't jarringly pop on immediate page load
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Согласие на использование файлов cookie"
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md border border-brand-green/15 text-brand-green shadow-2xl rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4 text-brand-green" />
            </div>
            <h4 className="font-bold text-sm tracking-tight">Мы используем файлы cookie</h4>
          </div>
          <button
            onClick={handleEssentialOnly}
            aria-label="Закрыть уведомление о cookie"
            className="text-brand-green/40 hover:text-brand-green p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-brand-green/80 leading-relaxed mb-4">
          Мы используем обязательные технические cookies для безопасности и авторизации, а также функциональные для сохранения языка.{' '}
          <Link
            to={ROUTES.COOKIE_POLICY}
            className="font-bold underline hover:text-brand-green transition-colors"
          >
            Подробнее в Политике cookies
          </Link>
          .
        </p>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-2.5 px-4 bg-brand-green text-brand-beige hover:bg-brand-green/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            Принять всё
          </button>
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="py-2.5 px-3 bg-brand-green/5 hover:bg-brand-green/10 text-brand-green border border-brand-green/15 rounded-xl text-xs font-semibold transition-colors"
          >
            Только обязательные
          </button>
        </div>
      </div>
    </aside>
  );
}
