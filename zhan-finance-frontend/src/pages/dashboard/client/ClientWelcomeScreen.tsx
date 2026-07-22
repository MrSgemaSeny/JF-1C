import { Plus, CheckCircle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';

interface ClientWelcomeScreenProps {
  onCreateRequest: () => void;
}

export function ClientWelcomeScreen({ onCreateRequest }: ClientWelcomeScreenProps) {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-700 zoom-in-95 mt-4">
      <div className="bg-white p-8 md:p-12 border-b border-gray-100">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {t('clientDashboard.welcomeNew', { defaultValue: `Добро пожаловать в Zhan Finance, ${user?.fullName || 'Гость'}!` })}
          </h1>
          <p className="text-gray-500 text-base mb-8 max-w-xl leading-relaxed">
            {t('clientDashboard.welcomeDesc', { defaultValue: 'Мы помогаем вашему бизнесу расти, берем на себя бухгалтерию, налоги и финансы. Создайте свою первую заявку прямо сейчас, и наша команда приступит к работе.' })}
          </p>

          <button
            onClick={onCreateRequest}
            className="bg-brand-green text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-green-dark transition-colors flex items-center gap-2 group w-fit"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            {t('clientDashboard.createFirstRequest', { defaultValue: 'Заказать услугу' })}
          </button>
        </div>
      </div>

      <div className="p-8 md:p-12">
        <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">
          {t('clientDashboard.howItWorks', { defaultValue: 'Как работает процесс?' })}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-gray-100 z-0"></div>

          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-1 transition-transform duration-300">
              <Plus size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{t('clientDashboard.step1Title', { defaultValue: '1. Оставьте заявку' })}</h4>
            <p className="text-sm text-gray-500">{t('clientDashboard.step1Desc', { defaultValue: 'Опишите задачу или выберите нужную услугу в личном кабинете.' })}</p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-1 transition-transform duration-300">
              <Clock size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{t('clientDashboard.step2Title', { defaultValue: '2. Мы берем в работу' })}</h4>
            <p className="text-sm text-gray-500">{t('clientDashboard.step2Desc', { defaultValue: 'Наш специалист изучит запрос и оперативно приступит к выполнению.' })}</p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-1 transition-transform duration-300">
              <CheckCircle size={24} />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{t('clientDashboard.step3Title', { defaultValue: '3. Готовый результат' })}</h4>
            <p className="text-sm text-gray-500">{t('clientDashboard.step3Desc', { defaultValue: 'Вы получаете уведомление и готовые документы, когда задача выполнена.' })}</p>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-green shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{t('clientDashboard.securityGuarantee', { defaultValue: 'Конфиденциальность и безопасность' })}</h4>
              <p className="text-sm text-gray-500">{t('clientDashboard.securityDesc', { defaultValue: 'Ваши данные под надежной защитой на каждом этапе работы.' })}</p>
            </div>
          </div>
          <button 
            onClick={onCreateRequest}
            className="flex items-center gap-2 text-brand-green font-medium hover:text-brand-green-dark transition-colors"
          >
            {t('common.start', { defaultValue: 'Начать' })} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
