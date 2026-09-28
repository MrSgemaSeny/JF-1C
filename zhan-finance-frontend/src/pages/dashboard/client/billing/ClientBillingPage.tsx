import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { billingApi, SubscriptionDto } from '@/entities/billing/api/billingApi';
import { paymentReceiptApi, PaymentReceiptDto } from '@/entities/billing/api/paymentReceiptApi';
import { PaymentModal } from '@/features/billing/ui/PaymentModal';
import { PaymentHistoryTable } from '@/features/billing/ui/PaymentHistoryTable';

export const ClientBillingPage: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceiptDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadData = async (refreshOnly = false) => {
    if (refreshOnly) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [subsRes, receiptsRes] = await Promise.allSettled([
        billingApi.getSubscriptions(),
        paymentReceiptApi.getMyReceipts(),
      ]);

      if (subsRes.status === 'fulfilled') {
        setSubscriptions(subsRes.value || []);
      }
      if (receiptsRes.status === 'fulfilled') {
        setReceipts(receiptsRes.value || []);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentSubscription = subscriptions.length > 0 ? subscriptions[0] : null;

  const calculateDaysLeft = (endsAt: string | null): number | null => {
    if (!endsAt) return null;
    const now = new Date();
    const end = new Date(endsAt);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = currentSubscription ? calculateDaysLeft(currentSubscription.endsAt) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isPendingReview = receipts.some((r) => r.status === 'AWAITING_REVIEW') || currentSubscription?.status === 'PENDING';

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            {t('billing.title', 'Тариф и оплата')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('billing.subtitle', 'Управление подпиской на бухгалтерское сопровождение и история платежей')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isLoading || isRefreshing}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title={t('common.refresh', 'Обновить')}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {currentSubscription?.status === 'ACTIVE'
              ? t('billing.renewSubscription', 'Продлить подписку')
              : t('billing.paySubscription', 'Оплатить подписку')}
          </button>
        </div>
      </div>

      {/* Expiring Soon Banner */}
      {isExpiringSoon && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {t('billing.expiringWarningTitle', 'Ваша подписка скоро истекает')}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {t('billing.expiringWarningDesc', 'Осталось дней: {{days}}. Рекомендуем заблаговременно отправить платеж, чтобы бухгалтерское сопровождение не прерывалось.', { days: daysLeft })}
            </p>
          </div>
        </div>
      )}

      {/* Pending Review Banner */}
      {isPendingReview && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {t('billing.pendingReviewTitle', 'Чек находится на проверке')}
            </p>
            <p className="text-xs opacity-90 mt-0.5">
              {t('billing.pendingReviewDesc', 'Мы получили вашу квитанцию. Администратор сверит поступление средств и активирует подписку в ближайшее время.')}
            </p>
          </div>
        </div>
      )}

      {/* Active Subscription Card & Plan Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {t('billing.currentPlan', 'Текущий тариф')}
              </span>
              {currentSubscription?.status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('billing.status.active', 'Активна')}
                </span>
              )}
              {currentSubscription?.status === 'PENDING' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  {t('billing.status.pending', 'На модерации')}
                </span>
              )}
              {(!currentSubscription || currentSubscription.status === 'CANCELLED' || isExpired) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                  {t('billing.status.inactive', 'Неактивна')}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
              {currentSubscription?.planName || t('billing.defaultPlanName', 'Бухгалтерское обслуживание')}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {t('billing.planDescription', 'Комплексный учет, расчет налогов, сдача статотчетов и интеграция с 1С')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  {t('billing.price', 'Стоимость')}
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {currentSubscription?.monthlyPrice
                    ? `${Number(currentSubscription.monthlyPrice).toLocaleString('ru-RU')} ₸ / мес`
                    : '45 000 ₸ / мес'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  {t('billing.activeUntil', 'Действует до')}
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatDate(currentSubscription?.endsAt || null)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  {t('billing.daysRemaining', 'Осталось дней')}
                </span>
                <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {daysLeft !== null && daysLeft > 0 ? daysLeft : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              {t('billing.payViaKaspi', 'Оплатить через Kaspi / Банк')}
            </button>
          </div>
        </div>

        {/* Feature List Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {t('billing.whatsIncluded', 'Что входит в тариф')}
            </h3>
            <ul className="mt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('billing.feature1', 'Полное ведение бухгалтерии ТОО / ИП')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('billing.feature2', 'Выписка и обработка ЭСФ, СНТ и актов')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('billing.feature3', 'Расчет зарплаты, налогов и отчислений')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('billing.feature4', 'Своевременная сдача 910, 200, 300 форм')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{t('billing.feature5', 'Личный куратор и онлайн-чат с бухгалтером')}</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('billing.supportNotice', 'Нужен индивидуальный расчет тарифа? Напишите куратору в чат.')}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-zinc-500" />
            {t('billing.historyTitle', 'История платежей и чеков')}
          </h2>
        </div>

        <PaymentHistoryTable
          receipts={receipts}
          isLoading={isLoading}
          onRefresh={() => loadData(true)}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        subscriptionId={currentSubscription?.id}
        planName={currentSubscription?.planName}
        defaultAmount={currentSubscription?.monthlyPrice || 45000}
        onSuccess={() => {
          loadData(true);
        }}
      />
    </div>
  );
};
