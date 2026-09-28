import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle2, Clock, XCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { PaymentReceiptDto, paymentReceiptApi, PaymentReceiptStatus } from '@/entities/billing/api/paymentReceiptApi';

type FilterTab = 'ALL' | PaymentReceiptStatus;

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
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
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

  const stats = useMemo(() => {
    const total = receipts.length;
    const awaiting = receipts.filter(r => r.status === 'AWAITING_REVIEW').length;
    const rejected = receipts.filter(r => r.status === 'REJECTED').length;
    const confirmed = receipts.filter(r => r.status === 'CONFIRMED').length;
    return { total, awaiting, rejected, confirmed };
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    if (activeTab === 'ALL') return receipts;
    return receipts.filter(r => r.status === activeTab);
  }, [receipts, activeTab]);

  const getStatusBadge = (status: PaymentReceiptDto['status'], rejectNote?: string | null) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('billing.status.confirmed', 'Подтвержден')}
          </span>
        );
      case 'REJECTED':
        return (
          <div className="flex flex-col gap-0.5 items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              {t('billing.status.rejected', 'Отклонен')}
            </span>
            {rejectNote && (
              <span className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {rejectNote}
              </span>
            )}
          </div>
        );
      case 'AWAITING_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
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
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-xs">
        <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
        <span className="text-sm font-medium">{t('billing.loading', 'Загрузка истории платежей...')}</span>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-300 rounded-xl bg-white shadow-xs">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-gray-800">
          {t('billing.noReceipts', 'История оплат пока пуста')}
        </p>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          {t('billing.noReceiptsDesc', 'После отправки чека об оплате он появится здесь со статусом проверки.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Client Tabs: Сначала ВСЕ -> затем фильтры (На проверке -> Отклоненные -> Подтвержденные) */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2 rounded-xl border border-gray-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {t('billing.admin.tabAll', 'Все')} ({stats.total})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AWAITING_REVIEW')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'AWAITING_REVIEW'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t('billing.admin.tabPending', 'На проверке')} ({stats.awaiting})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REJECTED')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'REJECTED'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          {t('billing.admin.tabRejected', 'Отклоненные')} ({stats.rejected})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONFIRMED')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'CONFIRMED'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('billing.admin.tabConfirmed', 'Подтвержденные')} ({stats.confirmed})
        </button>
      </div>

      {filteredReceipts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
          {t('billing.noReceiptsForFilter', 'По выбранному фильтру записей не найдено')}
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-xl bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{t('billing.table.date', 'Дата')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.amount', 'Сумма')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.status', 'Статус')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.receipt', 'Чек')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-700 whitespace-nowrap">
                      {formatDate(receipt.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-gray-900 text-base whitespace-nowrap">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {openingId === receipt.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
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
      )}
    </div>
  );
};
