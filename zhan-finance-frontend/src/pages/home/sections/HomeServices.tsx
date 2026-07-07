import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { ROUTES } from '@/shared/config/routes';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchHighlightedServices, requestService } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { useAuth } from '@/features/auth/AuthContext';

export function HomeServices() {
  const { data: services, isLoading } = useApiData(fetchHighlightedServices);
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      setSuccessMessage(`Ваш запрос на услугу «${service.title}» принят! Мы свяжемся с вами в ближайшее время.`);
      setSelectedService(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      alert('Ошибка при отправке запроса. Попробуйте позже.');
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
              Решения для <br />
              <span className="text-brand-green/40">вашего бизнеса</span>
            </h2>
            <p className="text-xl text-brand-green/80 font-medium leading-relaxed">
              От разовых консультаций до полного аутсорсинга бухгалтерии и кадров. Мы подберем идеальный формат работы.
            </p>
          </div>
          <Link
            to={ROUTES.SERVICES}
            className="hidden md:inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider hover:bg-brand-green hover:text-brand-beige transition-all group"
          >
            Все услуги
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
            ✅ {successMessage}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green/40" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(services ?? []).map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-brand-beige/20 p-8 rounded-[32px] border border-brand-green/5 hover:border-brand-green/20 hover:bg-brand-beige transition-all group flex flex-col cursor-pointer"
                onClick={() => {
                  setSelectedService(service);
                  setRestoredMessage('');
                  setRestoredDate('');
                }}
              >
                <h3 className="text-2xl font-black uppercase text-brand-green mb-4 leading-tight">
                  {service.title}
                </h3>
                <p className="text-brand-green/70 mb-8 leading-relaxed flex-1">
                  {service.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm font-bold text-brand-green/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 opacity-50" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className="inline-flex items-center gap-2 text-brand-green font-black uppercase tracking-wider group-hover:gap-4 transition-all"
                >
                  Подробнее <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center md:hidden">
          <Link
            to={ROUTES.SERVICES}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider hover:bg-brand-green hover:text-brand-beige transition-all"
          >
            Все услуги
          </Link>
        </div>
      </Container>

      {selectedService && (
        <ServiceModal
          item={selectedService}
          onClose={() => setSelectedService(null)}
          onRequest={handleRequestService}
          isSubmitting={isSubmitting}
          isLoggedIn={!!user}
          initialMessage={restoredMessage}
          initialPreferredDate={restoredDate}
        />
      )}
    </Section>
  );
}
