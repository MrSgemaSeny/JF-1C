import { useEffect, useState } from 'react';
import { fetchServices, requestService, fetchMyServiceRequests } from '@/entities/service/api/servicesApi';
import type { ServiceDto, ServiceRequestDto } from '@/entities/service/api/servicesApi';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { clsx } from 'clsx';
import { Briefcase, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  NEW: { label: 'Новый', color: 'bg-blue-100 text-blue-800', icon: Clock },
  IN_PROGRESS: { label: 'В работе', color: 'bg-yellow-100 text-yellow-800', icon: Briefcase },
  COMPLETED: { label: 'Выполнено', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELED: { label: 'Отменено', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function ClientServicesPage() {
  const { user } = useAuth();
  
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
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
      const [servicesData, requestsData] = await Promise.all([
        fetchServices(),
        fetchMyServiceRequests()
      ]);
      setServices(servicesData);
      setRequests(requestsData);
    } catch (err) {
      setError('Не удалось загрузить данные об услугах');
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
      await requestService({
        serviceId: selectedService.id,
        message,
        preferredContactDate: preferredDate || undefined
      });
      setSuccessMessage(`Ваш запрос на услугу «${selectedService.title}» принят!`);
      setSelectedService(null);
      setMessage('');
      setPreferredDate('');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert('Ошибка при отправке запроса. Попробуйте позже.');
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Услуги</h1>
        <p className="text-gray-500 text-sm mt-1">Каталог услуг и история ваших запросов</p>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Доступные услуги</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-3">{service.description}</p>
              </div>
              
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="font-bold text-gray-900">
                  {service.price ? `${service.price} ₸` : 'По запросу'}
                </span>
                <button
                  onClick={() => setSelectedService(service)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Запросить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Request History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">История запросов</h2>
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium mb-1">Нет запросов</h3>
              <p className="text-gray-500 text-sm">Вы еще не заказывали услуги</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Услуга</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Статус</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Дата запроса</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Желаемая дата связи</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(req => {
                    const statusConfig = STATUS_CONFIG[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-800', icon: Clock };
                    const StatusIcon = statusConfig.icon;
                    return (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">{req.serviceTitle}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold", statusConfig.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {req.preferredContactDate ? (
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(req.preferredContactDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Запрос услуги</h3>
              <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRequestService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Выбранная услуга</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 font-medium border border-gray-100">
                  {selectedService.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Желаемая дата связи</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Комментарий (необязательно)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Опишите вашу ситуацию..."
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-brand-green text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmitting ? <Spinner size="sm" className="text-white" /> : 'Отправить запрос'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
