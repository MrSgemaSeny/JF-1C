import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Mail, CheckCircle2, Copy } from 'lucide-react';
import { useConvertLead, LeadDto } from '@/features/leads/useLeads';
import { fetchServices, ServiceDto } from '@/entities/service/api/servicesApi';

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: LeadDto | null;
}

export function ConvertLeadModal({ isOpen, onClose, lead }: ConvertLeadModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const { mutate: convertLead, isPending } = useConvertLead();
  const [successData, setSuccessData] = useState<{ password?: string; taskId: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSelectedServiceIds([]);
      setSuccessData(null);
      fetchServices().then(setServices).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !lead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedServiceIds.length === 0) return;

    convertLead(
      { id: lead.id, data: { email, serviceIds: selectedServiceIds } },
      {
        onSuccess: (data) => {
          setSuccessData({ password: data.generatedPassword, taskId: data.task?.id });
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              {t('admin.leads.convert.title', { defaultValue: 'Взять в работу' })}
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {successData ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-brand-green" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t('admin.leads.convert.success', { defaultValue: 'Клиент и Задача созданы!' })}
                </h3>
                {successData.password && (
                  <div className="w-full mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                      {t('admin.leads.convert.passwordInfo', { defaultValue: 'Новый клиент создан. Передайте ему этот временный пароль для входа:' })}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white rounded border border-gray-200 font-mono text-center text-lg font-bold text-gray-900">
                        {successData.password}
                      </code>
                      <button
                        onClick={() => copyToClipboard(successData.password!)}
                        className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                        title="Копировать"
                      >
                        <Copy size={20} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="w-full mt-6 flex justify-center">
                  <button onClick={onClose} className="px-6 py-2.5 bg-brand-green text-brand-beige font-semibold rounded-lg w-full">
                    {t('common.close', { defaultValue: 'Закрыть' })}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="text-sm text-gray-600 mb-2">
                  {t('admin.leads.convert.description', { defaultValue: 'Для создания задачи необходимо указать Email клиента и выбрать услуги.' })}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('admin.leads.convert.email', { defaultValue: 'Email клиента' })}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('admin.leads.convert.services', { defaultValue: 'Услуги (выберите одну или несколько)' })}
                  </label>
                  <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2 flex flex-col gap-1 custom-scrollbar">
                    {services.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <label key={service.id} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-brand-green/10' : 'hover:bg-gray-100'}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedServiceIds(prev =>
                                isSelected ? prev.filter(id => id !== service.id) : [...prev, service.id]
                              );
                            }}
                            className="mt-0.5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                          />
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isSelected ? 'text-brand-green' : 'text-gray-900'}`}>{service.title}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel', { defaultValue: 'Отмена' })}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !email || selectedServiceIds.length === 0}
                    className="flex-1 py-2.5 text-sm font-semibold text-brand-beige bg-brand-green rounded-xl hover:bg-brand-green/90 transition-colors disabled:opacity-50"
                  >
                    {isPending ? t('common.loading', { defaultValue: 'Загрузка...' }) : t('admin.leads.convert.submit', { defaultValue: 'Создать Задачу' })}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
