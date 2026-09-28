import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle2, Clock, XCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { PaymentReceiptDto, paymentReceiptApi } from '@/entities/billing/api/paymentReceiptApi';

interface PaymentHistoryTableProps {
  receipts: PaymentReceiptDto[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  receipts,
  isLoading,
}) => {
  const { t } = useTranslation(['common']);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const handleOpenFile = async (receiptId: number) => {
    try {
      setOpeningId(receiptId);
      const res = await paymentReceiptApi.getReceiptFileUrl(receiptId);
      if (res && res.url && (res.url.startsWith('http://') || res.url.startsWith('https://'))) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        const downloadPath = res?.url || `/api/v1/billing/receipts/${receiptId}/download`;
        const blob = await paymentReceiptApi.downloadReceiptFile(downloadPath);
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      try {
        const blob = await paymentReceiptApi.downloadReceiptFile(`/api/v1/billing/receipts/${receiptId}/download`);
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.error('Failed to open receipt:', err);
      }
    } finally {
      setOpeningId(null);
    }
  };

  const getStatusBadge = (status: PaymentReceiptDto['status'], rejectNote?: string | null) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('billing.status.confirmed', 'Подтвержден')}
          </span>
        );
      case 'REJECTED':
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" />
              {t('billing.status.rejected', 'Отклонен')}
            </span>
            {rejectNote && (
              <span className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {rejectNote}
              </span>
            )}
          </div>
        );
      case 'AWAITING_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            {t('billing.status.awaitingReview', 'На проверке')}
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${Number(amount).toLocaleString('ru-RU')} ${currency === 'KZT' ? '₸' : currency}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 dark:text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <span className="text-sm">{t('billing.loading', 'Загрузка истории платежей...')}</span>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
        <FileText className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3" />
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {t('billing.noReceipts', 'История оплат пока пуста')}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
          {t('billing.noReceiptsDesc', 'После отправки чека об оплате он появится здесь со статусом проверки.')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">{t('billing.table.date', 'Дата')}</th>
              <th className="py-3.5 px-4">{t('billing.table.amount', 'Сумма')}</th>
              <th className="py-3.5 px-4">{t('billing.table.status', 'Статус')}</th>
              <th className="py-3.5 px-4">{t('billing.table.receipt', 'Чек')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {receipts.map((receipt) => (
              <tr
                key={receipt.id}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {formatDate(receipt.createdAt)}
                </td>
                <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {formatCurrency(receipt.amount, receipt.currency)}
                </td>
                <td className="py-3.5 px-4">
                  {getStatusBadge(receipt.status, receipt.rejectNote)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleOpenFile(receipt.id)}
                    disabled={openingId === receipt.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {openingId === receipt.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                    {t('billing.viewReceipt', 'Открыть чек')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
