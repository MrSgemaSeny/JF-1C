import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { ROUTES } from '@/shared/config/routes';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchHighlightedServices } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { requestTask } from '@/entities/task/api/taskApi';
import { uploadDocument } from '@/entities/document/api/documentApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { SuccessModal } from '@/shared/ui/SuccessModal';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from '@/shared/ui/Toast/ToastContext';
import { ApiError, apiRequest } from '@/shared/api/http';
import { useTranslation, Trans } from 'react-i18next';

export function HomeServices() {
  const { t } = useTranslation('common');
  const { data: services, isLoading } = useApiData(fetchHighlightedServices);
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | React.ReactNode | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [restoredMessage, setRestoredMessage] = useState('');
  const [restoredDate, setRestoredDate] = useState('');

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
          setSelectedService(service);
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
        title: `${t('homeServices.orderPrefix')} ${service.title}`,
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

      setSuccessMessage(t('homeServices.successMessage', { title: service.title }));
      setSelectedService(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('homeServices.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section className="bg-white py-32 relative">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green mb-6">
              <Trans i18nKey="homeServices.title" ns="common" components={{ br: <br />, 1: <span className="text-brand-green/40" /> }} />
            </h2>
            <p className="text-xl text-brand-green/80 font-medium leading-relaxed">
              {t('homeServices.subtitle')}
            </p>
          </div>
          <Link
            to={ROUTES.SERVICES}
            className="hidden md:inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider hover:bg-brand-green hover:text-brand-beige transition-all group"
          >
            {t('homeServices.allServices')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Success banner */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 rounded-2xl bg-green-50 border border-green-200 p-4 text-green-800 font-medium text-center"
          >
            {successMessage}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green/40" />
          </div>
        ) : (() => {
          // Столбец 1: Разовые услуги (включая расчет зп, сдачу отчетов, восстановление, проверку контрагентов)
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

          // Дополняем аутсорс блоком про полный контроль и SLA, если в базе только базовые записи
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

          const renderCard = (service: ServiceDto, i: number, isOutsourceCol: boolean) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="bg-brand-beige/20 p-8 rounded-[32px] border border-brand-green/10 hover:border-brand-green/30 hover:bg-brand-beige transition-all group flex flex-col cursor-pointer justify-between shadow-sm hover:shadow-md"
              onClick={() => {
                setSelectedService(service);
                setRestoredMessage('');
                setRestoredDate('');
              }}
            >
              <div>
                <h3 className="text-2xl font-black uppercase text-brand-green mb-3 leading-tight">
                  {t(`service.${service.id}.title`, { defaultValue: service.title })}
                </h3>
                <p className="text-sm text-brand-green/75 mb-6 leading-relaxed">
                  {t(`service.${service.id}.description`, { defaultValue: service.description })}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs font-bold text-brand-green/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1 shrink-0 opacity-60" />
                      <span>{t(`service.${service.id}.features.${featureIndex}`, { defaultValue: feature })}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-brand-green/10 flex items-center justify-between">
                <span className="text-brand-green font-black uppercase tracking-wider text-xs inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                  {t('homeServices.more')} <ArrowRight className="w-4 h-4" />
                </span>
                {isOutsourceCol && (
                  <span className="text-xs font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                    По подписке
                  </span>
                )}
              </div>
            </motion.div>
          );

          return (
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Column 1: One-time services */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-5 bg-brand-beige rounded-2xl border border-brand-green/10">
                  <div className="w-9 h-9 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-green">Разовые услуги</h3>
                    <p className="text-xs text-brand-green/70 font-medium">Сдача отчетности, расчет зарплаты, восстановление учета и проверка контрагентов</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {oneTimeList.map((service, i) => renderCard(service, i, false))}
                </div>
              </div>

              {/* Column 2: Outsource accounting */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-5 bg-brand-beige rounded-2xl border border-brand-green/10">
                  <div className="w-9 h-9 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-green">Аутсорс-бухгалтерия</h3>
                    <p className="text-xs text-brand-green/70 font-medium">Полный контроль, 100% ответственность по SLA и регулярное ведение</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {fullOutsourceList.map((service, i) => renderCard(service, i, true))}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="mt-12 text-center md:hidden">
          <Link
            to={ROUTES.SERVICES}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider hover:bg-brand-green hover:text-brand-beige transition-all"
          >
            {t('homeServices.allServices')}
          </Link>
        </div>
      </Container>

      {selectedService && (
        <ServiceModal
          item={selectedService}
          onClose={() => setSelectedService(null)}
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
                  setSuccessMessage(t('homeServices.successMessageFiles', { defaultValue: 'Ваша заявка отправлена!\n\nФайлы успешно прикреплены. Ожидайте звонка от нашего специалиста.' }));
                } catch (fileErr) {
                  console.error('Failed to upload guest request files:', fileErr);
                  setSuccessMessage(t('homeServices.successMessage', { title: service.title }));
                }
              } else {
                setSuccessMessage(t('homeServices.successMessage', { title: service.title }));
              }
              setSelectedService(null);
            } catch (err) {
              toast.error(t('homeServices.errorMessage'));
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

      <SuccessModal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage(null)}
        title={t('homeServices.modalTitle')}
        message={successMessage || ''}
      />
    </Section>
  );
}
