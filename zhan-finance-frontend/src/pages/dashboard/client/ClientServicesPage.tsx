import { useEffect, useState } from 'react';
import { fetchServices } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { requestTask } from '@/entities/task/api/taskApi';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { clsx } from 'clsx';
import { Briefcase, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { TaskCreateModal } from '@/widgets/task-create/TaskCreateModal';
import { useTranslation } from 'react-i18next';
import { translateServiceName, translateServiceDesc } from '@/shared/i18n/taskTranslator';

export function ClientServicesPage() {
  const { t, i18n } = useTranslation(['common']);
  const { user } = useAuth();
  
  const [services, setServices] = useState<ServiceDto[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.userId) {
      loadData();
    }
  }, [user?.userId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const servicesData = await fetchServices();
      setServices(servicesData);
    } catch (err) {
      setError(t('clientServices.loadError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSubmitting(true);
    try {
      await requestTask({
        clientId: user!.userId,
        title: `Заказ услуги: ${selectedService.title}`,
        description: message,
        dueDate: undefined,
        serviceIds: [selectedService.id]
      });
      setSuccessMessage(t('clientServices.requestSuccess'));
      setSelectedService(null);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert(t('clientServices.requestError', { defaultValue: 'Ошибка при отправке запроса. Попробуйте позже.' }));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && services.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('clientServices.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('clientServices.subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50/80 border border-red-100 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50/80 border border-green-100 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800 text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Services Catalog */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('clientServices.availableServices')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{translateServiceName(service, t, i18n)}</h3>
                <p className="text-gray-500 text-sm line-clamp-3">{translateServiceDesc(service, t, i18n)}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {service.price ? service.price : t('clientServices.onDemand')}
                </span>
                <button
                  onClick={() => setSelectedService(service)}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {t('clientServices.requestBtn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Request Modal */}
      {selectedService && (
        <TaskCreateModal 
          initialServiceId={selectedService.id}
          onClose={() => setSelectedService(null)}
          onCreated={() => {
            setSelectedService(null);
            setSuccessMessage(t('clientServices.requestSuccess'));
            loadData();
            setTimeout(() => setSuccessMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
}
