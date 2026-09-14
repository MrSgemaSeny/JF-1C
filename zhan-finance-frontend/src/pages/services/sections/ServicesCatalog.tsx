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
import { ApiError, apiRequest } from '@/shared/api/http';
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
        const failedFiles: string[] = [];
        for (const file of files) {
          try {
            await uploadDocument(file, undefined, createdTask.id);
          } catch (fileErr) {
            console.error('Failed to upload file attachment:', file.name, fileErr);
            failedFiles.push(file.name);
          }
        }
        if (failedFiles.length > 0) {
          toast.warning(`Заявка создана, но не удалось загрузить файлы: ${failedFiles.join(', ')}`);
        }
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
        ) : (() => {
          const isOneTime = (s: ServiceDto) => {
            const id = Number(s.id);
            if (id === 2 || id === 3 || id === 4 || id === 6) return true;
            const title = (s.title || '').toLowerCase();
            return (
              title.includes('сдача') ||
              title.includes('кадров') ||
              title.includes('зарплат') ||
              title.includes('восстановление') ||
              title.includes('проверка') ||
              title.includes('разов')
            );
          };
          const oneTimeList = (services ?? []).filter(isOneTime);
          const outsourceList = (services ?? []).filter((s) => !isOneTime(s));

          const fullOutsourceList: ServiceDto[] = [
            ...outsourceList,
            {
              id: 99,
              title: 'Полный контроль и ответственность',
              description: '100% финансовая ответственность по договору SLA. Штрафы по нашей вине компенсируем мы.',
              price: 'По подписке',
              imageUrl: null,
              isHighlighted: true,
              features: [
                'Финансовая гарантия по SLA',
                'Контроль лицевых счетов в КГД 24/7',
                'Защита при камеральном контроле',
              ],
              createdAt: new Date().toISOString(),
            },
          ];

          const renderCard = (s: ServiceDto, i: number, isOutsourceCol: boolean) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.01, boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              viewport={{ once: true }}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActive(s);
                setRestoredMessage('');
                setRestoredDate('');
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(s); setRestoredMessage(''); setRestoredDate(''); } }}
              className="flex flex-col bg-white rounded-3xl p-8 items-start shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green border border-brand-green/10 hover:border-brand-green/40 transition-all justify-between"
            >
              <div className="w-full">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="text-2xl font-black text-brand-green leading-tight">{t(`service.${s.id}.title`, { defaultValue: s.title })}</h4>
                  {isOutsourceCol && (
                    <span className="text-xs font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                      По подписке
                    </span>
                  )}
                </div>
                <p className="text-base text-brand-green/75 mb-4 leading-relaxed">{t(`service.${s.id}.description`, { defaultValue: s.description })}</p>
                <ul className="text-sm text-brand-green/70 space-y-2 mb-6">
                  {s.features.map((b, bIndex) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 mt-2 rounded-full bg-brand-green shrink-0 opacity-60" />
                      <span>{t(`service.${s.id}.features.${bIndex}`, { defaultValue: b })}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setActive(s); }}
                className="px-6 py-2.5 bg-brand-green text-brand-beige font-bold uppercase tracking-wider rounded-xl text-xs hover:bg-brand-green/90 transition-all"
              >
                {t('services.catalog.details', { defaultValue: 'Подробнее' })}
              </button>
            </motion.div>
          );

          return (
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Column 1: One-time */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/10 border border-white/15 text-brand-beige flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-beige text-brand-green flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">Разовые услуги</h3>
                    <p className="text-xs text-brand-beige/80 font-medium">Сдача отчетности, расчет зарплаты, восстановление учета и проверка контрагентов</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {oneTimeList.map((s, i) => renderCard(s, i, false))}
                </div>
              </div>

              {/* Column 2: Outsource */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/10 border border-white/15 text-brand-beige flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-beige text-brand-green flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">Аутсорс-бухгалтерия</h3>
                    <p className="text-xs text-brand-beige/80 font-medium">Полный контроль, 100% ответственность по SLA и регулярное ведение</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {fullOutsourceList.map((s, i) => renderCard(s, i, true))}
                </div>
              </div>
            </div>
          );
        })()}
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
              
              const res = await apiRequest<{ id: number }>('/api/v1/contact-requests', {
                method: 'POST',
                body: JSON.stringify({ name, phone, message: fullMessage, source: 'landing' })
              });

              if (files && files.length > 0 && res.id) {
                try {
                  const formData = new FormData();
                  files.forEach(file => formData.append('files', file));
                  await apiRequest(`/api/v1/contact-requests/${res.id}/files`, {
                    method: 'POST',
                    body: formData,
                  });
                  toast.success(t('services.catalog.successFiles', { defaultValue: 'Заявка отправлена! Ваши файлы прикреплены. Ожидайте звонка от нашего специалиста.' }));
                } catch (fileErr) {
                  console.error('Failed to upload guest request files:', fileErr);
                  toast.success(t('services.catalog.success', { title: service.title, defaultValue: `Запрос на услугу «${service.title}» отправлен!` }));
                }
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
