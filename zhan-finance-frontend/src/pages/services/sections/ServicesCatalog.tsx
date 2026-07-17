import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchServices } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { requestTask } from '@/entities/task/api/taskApi';
import { uploadDocument } from '@/entities/document/api/documentApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { SuccessModal } from '@/shared/ui/SuccessModal';
import { useAuth } from '@/features/auth/AuthContext';
import { ROUTES } from '@/shared/config/routes';
import { toast } from '@/shared/ui/Toast/ToastContext';
import { ApiError } from '@/shared/api/http';
import { useTranslation } from 'react-i18next';

export function ServicesCatalog() {
  const { t } = useTranslation('common');
  const { data: services, isLoading } = useApiData(fetchServices);
  const [active, setActive] = useState<ServiceDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleRequestService = async (service: ServiceDto, message?: string, preferredDate?: string, files?: File[]) => {
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
      const createdTask = await requestTask({ 
        clientId: user.userId,
        title: `${t('services.catalog.orderTaskPrefix', { defaultValue: 'Заказ услуги: ' })}${service.title}`,
        description: message,
        dueDate: preferredDate,
        serviceIds: [service.id]
      });

      // Upload attached files to the created task
      if (files && files.length > 0 && createdTask?.id) {
        await Promise.all(files.map(file => uploadDocument(file, undefined, createdTask.id)));
      }

      toast.success(t('services.catalog.success', { title: service.title, defaultValue: `Запрос на услугу «${service.title}» отправлен!` }));
      setActive(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('services.catalog.error', { defaultValue: 'Ошибка при отправке запроса. Попробуйте позже.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Section id="services-list" className="bg-brand-green pt-28 pb-12">

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
                  <h4 className="text-2xl font-black text-brand-green mb-2">{t(`service.${s.id}.title`, { defaultValue: s.title })}</h4>
                  <p className="text-lg text-brand-green/70 mb-3">{t(`service.${s.id}.description`, { defaultValue: s.description })}</p>
                  <ul className="text-base text-brand-green/60 space-y-2 mb-4">
                    {s.features.map((b, bIndex) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-2 rounded-full bg-brand-green shrink-0" />
                        <span>{t(`service.${s.id}.features.${bIndex}`, { defaultValue: b })}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActive(s); }}
                      className="px-4 py-2 border border-brand-green text-brand-green rounded-full text-sm"
                    >
                      {t('services.catalog.details', { defaultValue: 'Подробнее' })}
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
          onGuestRequest={async (service, name, phone, message, preferredDate, files) => {
            setIsSubmitting(true);
            try {
              let fullMessage = `Услуга: ${service.title}`;
              if (message) fullMessage += `\nКомментарий: ${message}`;
              if (preferredDate) fullMessage += `\nЖелаемая дата: ${preferredDate}`;
              
              await fetch('/api/contact-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, message: fullMessage, source: 'landing' })
              });

              if (files && files.length > 0) {
                toast.success('Заявка отправлена! Войдите, чтобы сохранить выбранные файлы', {
                  duration: 10000,
                  action: {
                    label: 'Войти',
                    onClick: () => navigate('/login')
                  }
                });
              } else {
                toast.success(t('services.catalog.success', { title: service.title, defaultValue: `Запрос на услугу «${service.title}» отправлен!` }));
              }
              setActive(null);
            } catch (err) {
              toast.error(t('services.catalog.error', { defaultValue: 'Ошибка при отправке запроса. Попробуйте позже.' }));
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
          isLoggedIn={!!user}
          initialMessage={restoredMessage}
          initialPreferredDate={restoredDate}
        />
      )}

    </>
  );
}
