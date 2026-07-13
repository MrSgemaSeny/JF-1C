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

export function AdminInvoicesPage() {
  const { t } = useTranslation(['common']);
  const { data: invoices, isLoading, error, refetch } = useApiData<InvoiceDto[]>(billingApi.getInvoices);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                    <td className="p-3 text-sm">${invoice.amount.toFixed(2)}</td>
                    <td className="p-3 text-sm">
                      {invoice.status === 'PAID' ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">PAID</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium">{invoice.status}</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </Container>
  );
}
