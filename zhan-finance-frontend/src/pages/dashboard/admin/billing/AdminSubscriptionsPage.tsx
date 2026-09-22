import React, { useState } from 'react';
import { useApiData } from '@/shared/hooks/useApiData';
import { billingApi, SubscriptionDto } from '@/entities/billing/api/billingApi';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useEscapeKey } from '@/shared/lib/hooks/useEscapeKey';
import { toast } from '@/shared/ui/Toast/ToastContext';
import { Input } from '@/shared/ui/Input/Input';

export function AdminSubscriptionsPage() {
  const { t } = useTranslation(['common']);
  const { data: subscriptions, isLoading, error, refetch } = useApiData<SubscriptionDto[]>(billingApi.getSubscriptions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planName, setPlanName] = useState(() => t('adminSubscriptions.defaultPlan'));
  const [monthlyPrice, setMonthlyPrice] = useState('45000');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ planName?: string; monthlyPrice?: string; startsAt?: string }>({});

  useEscapeKey(() => setIsModalOpen(false), isModalOpen);

  const validate = () => {
    const errs: typeof formErrors = {};
    if (!planName.trim()) {
      errs.planName = t('common:required', { defaultValue: 'Введите название плана' });
    }
    if (!monthlyPrice || Number(monthlyPrice) < 1) {
      errs.monthlyPrice = t('adminSubscriptions.errors.pricePositive', { defaultValue: 'Цена должна быть больше 0' });
    }
    if (!startsAt) {
      errs.startsAt = t('common:required', { defaultValue: 'Укажите дату начала' });
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      await billingApi.createSubscription({
        planName: planName.trim(),
        monthlyPrice: Number(monthlyPrice),
        status: 'ACTIVE',
        startsAt: startsAt || new Date().toISOString().split('T')[0],
        endsAt: endsAt || null
      });
      toast.success(t('adminSubscriptions.createdSuccess', { defaultValue: 'Подписка успешно создана!' }));
      setIsModalOpen(false);
      setStartsAt('');
      setEndsAt('');
      setFormErrors({});
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(t('adminSubscriptions.createError', { defaultValue: 'Ошибка при создании подписки' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-10">Error: {error.message}</div>;
  }

  return (
    <Container className="py-8">
      <Section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('adminSubscriptions.title')}</h1>
            <p className="text-gray-500 text-sm">{t('adminSubscriptions.subtitle')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>{t('adminSubscriptions.createBtn')}</Button>
        </div>

        {!subscriptions || subscriptions.length === 0 ? (
          <Empty label={t('adminSubscriptions.noSubscriptions')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-3 text-sm font-medium text-gray-500">ID</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminSubscriptions.planName')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminSubscriptions.monthlyPrice')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminSubscriptions.status')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminSubscriptions.startsAt')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminSubscriptions.endsAt')}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm">#{sub.id}</td>
                    <td className="p-3 text-sm font-medium">{sub.planName}</td>
                    <td className="p-3 text-sm font-semibold">{sub.monthlyPrice.toLocaleString()} {t('adminSubscriptions.perMonth')}</td>
                    <td className="p-3 text-sm">
                      {sub.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold">{t('adminSubscriptions.statusActive')}</span>
                      ) : sub.status === 'CANCELLED' ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md text-xs font-semibold">{t('adminSubscriptions.statusCancelled')}</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-xs font-semibold">{sub.status}</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {sub.startsAt ? format(new Date(sub.startsAt), 'dd.MM.yyyy') : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {sub.endsAt ? format(new Date(sub.endsAt), 'dd.MM.yyyy') : t('adminSubscriptions.indefinite')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Modal for creating subscription */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900">{t('adminSubscriptions.newSubscriptionTitle')}</h2>
            <form onSubmit={handleCreateSubscription} noValidate className="space-y-4">
              <Input
                label={t('adminSubscriptions.planNameLabel')}
                type="text"
                value={planName}
                onChange={(e) => {
                  setPlanName(e.target.value);
                  if (formErrors.planName) setFormErrors(prev => ({ ...prev, planName: undefined }));
                }}
                placeholder={t('adminSubscriptions.planNamePlaceholder')}
                error={formErrors.planName}
              />
              <Input
                label={t('adminSubscriptions.monthlyPriceLabel')}
                type="number"
                value={monthlyPrice}
                onChange={(e) => {
                  setMonthlyPrice(e.target.value);
                  if (formErrors.monthlyPrice) setFormErrors(prev => ({ ...prev, monthlyPrice: undefined }));
                }}
                placeholder="45000"
                error={formErrors.monthlyPrice}
              />
              <Input
                label={t('adminSubscriptions.startsAtLabel')}
                type="date"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  if (formErrors.startsAt) setFormErrors(prev => ({ ...prev, startsAt: undefined }));
                }}
                error={formErrors.startsAt}
              />
              <Input
                label={t('adminSubscriptions.endsAtLabel')}
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : t('adminSubscriptions.createSubscriptionBtn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  );
}
