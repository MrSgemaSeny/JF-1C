import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchServices, requestService } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { useAuth } from '@/features/auth/AuthContext';
import { ROUTES } from '@/shared/config/routes';

export function ServicesCatalog() {
  const { data: services, isLoading } = useApiData(fetchServices);
  const [active, setActive] = useState<ServiceDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [restoredMessage, setRestoredMessage] = useState('');
  const [restoredDate, setRestoredDate] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Восстанавливаем заявку из sessionStorage при логине
  useEffect(() => {
    if (!user) return; // Юзер не авторизован, ничего не делаем

    const pending = sessionStorage.getItem('pendingServiceOrder');
    if (!pending) return; // Нет отложенной заявки

    try {
      const order = JSON.parse(pending);
      if (services) {
        const service = services.find((s) => s.id === order.serviceId);
        if (service) {
          setActive(service);
          setRestoredMessage(order.message || '');
          setRestoredDate(order.preferredDate || '');
          sessionStorage.removeItem('pendingServiceOrder');
        }
      }
    } catch (error) {
      console.error('Failed to restore pending order:', error);
      sessionStorage.removeItem('pendingServiceOrder');
    }
  }, [user, services]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    document.body.style.overflow = active ? 'hidden' : '';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [active]);

  const handleRequestService = async (service: ServiceDto, message?: string, preferredDate?: string) => {
    if (!user) {
      const pendingOrder = {
        serviceId: service.id,
        message,
        preferredDate,
        returnUrl: location.pathname, // Откуда пришли
      };
      sessionStorage.setItem('pendingServiceOrder', JSON.stringify(pendingOrder));
      navigate(`${ROUTES.LOGIN}?from=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await requestService({ 
        serviceId: service.id, 
        message,
        preferredContactDate: preferredDate 
      });
      setSuccessMessage(`Запрос на услугу «${service.title}» отправлен!`);
      setActive(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      alert('Ошибка при отправке запроса. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Section id="services-list" className="bg-brand-green pt-28 pb-12">
        {/* Success banner */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800 font-medium text-center"
          >
            ✅ {successMessage}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {(services ?? []).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02, boxShadow: '0 24px 48px rgba(67,133,86,0.15)' }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25, delay: i * 0.06 }}
                viewport={{ once: true }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActive(s);
                  setRestoredMessage('');
                  setRestoredDate('');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(s); setRestoredMessage(''); setRestoredDate(''); } }}
                className="flex gap-6 bg-white rounded-2xl p-6 items-start shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green border border-brand-green/20 hover:border-brand-green/60 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-brand-green mb-2">{s.title}</h4>
                  <p className="text-lg text-brand-green/70 mb-3">{s.description}</p>
                  <ul className="text-base text-brand-green/60 space-y-2 mb-4">
                    {s.features.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-2 rounded-full bg-brand-green shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActive(s); }}
                      className="px-4 py-2 border border-brand-green text-brand-green rounded-full text-sm"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      {active && (
        <ServiceModal
          item={active}
          onClose={() => setActive(null)}
          onRequest={handleRequestService}
          isSubmitting={isSubmitting}
          isLoggedIn={!!user}
          initialMessage={restoredMessage}
          initialPreferredDate={restoredDate}
        />
      )}
    </>
  );
}
