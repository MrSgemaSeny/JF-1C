import React, { useState } from 'react';
import { useApiData } from '@/shared/hooks/useApiData';
import { billingApi, InvoiceDto } from '@/entities/billing/api/billingApi';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useEscapeKey } from '@/shared/lib/hooks/useEscapeKey';
import { toast } from '@/shared/ui/Toast/ToastContext';

export function AdminInvoicesPage() {
  const { t } = useTranslation(['common']);
  const { data: invoices, isLoading, error, refetch } = useApiData<InvoiceDto[]>(billingApi.getInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientId, setClientId] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEscapeKey(() => setIsModalOpen(false), isModalOpen);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await billingApi.createInvoice({
        clientId: Number(clientId),
        title,
        amount: Number(amount),
        status: 'ISSUED',
        dueDate: dueDate || new Date().toISOString().split('T')[0]
      });
      toast.success(t('adminInvoices.createdSuccess', { defaultValue: 'Счёт успешно выписан!' }));
      setIsModalOpen(false);
      setTitle('');
      setAmount('');
      setDueDate('');
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(t('adminInvoices.createError', { defaultValue: 'Ошибка при выписке счёта' }));
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
            <h1 className="text-2xl font-bold text-gray-900">{t('adminInvoices.title')}</h1>
            <p className="text-gray-500 text-sm">{t('adminInvoices.subtitle')}</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>{t('adminInvoices.createBtn')}</Button>
        </div>

        {!invoices || invoices.length === 0 ? (
          <Empty label={t('adminInvoices.noInvoices')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="p-3 text-sm font-medium text-gray-500">ID</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminInvoices.invoiceTitle')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminInvoices.clientId')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminInvoices.amount')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminInvoices.status')}</th>
                  <th className="p-3 text-sm font-medium text-gray-500">{t('adminInvoices.dueDate')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-sm">#{invoice.id}</td>
                    <td className="p-3 text-sm font-medium">{invoice.title}</td>
                    <td className="p-3 text-sm text-gray-500">{invoice.clientId}</td>
                    <td className="p-3 text-sm font-semibold">{invoice.amount.toLocaleString()} ₸</td>
                    <td className="p-3 text-sm">
                      {invoice.status === 'PAID' ? (
                        <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-md text-xs font-semibold">Оплачен</span>
                      ) : invoice.status === 'OVERDUE' ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-md text-xs font-semibold">Просрочен</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-semibold">Выставлен</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd.MM.yyyy') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Modal for creating invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900">Выписать новый счёт</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Назначение платежа</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                  placeholder="Бухгалтерское сопровождение за Июль"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Сумма (₸)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ID Клиента</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Срок оплаты (Due Date)</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" /> : 'Выставить счёт'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Container>
  );
}
