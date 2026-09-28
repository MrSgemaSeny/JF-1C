import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Search,
  Loader2,
  TrendingUp,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { 
  paymentReceiptApi, 
  PaymentReceiptDto, 
  PaymentReceiptStatus 
} from '@/entities/billing/api/paymentReceiptApi';
import { RejectReceiptModal } from '@/features/billing/ui/RejectReceiptModal';
import { toast } from '@/shared/ui/Toast/ToastContext';

type FilterTab = 'ALL' | PaymentReceiptStatus;

export function AdminPaymentReceiptsPage() {
  const { t } = useTranslation(['common']);
  const [receipts, setReceipts] = useState<PaymentReceiptDto[]>([]);
  const [allReceiptsForStats, setAllReceiptsForStats] = useState<PaymentReceiptDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('AWAITING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // Reject modal state
  const [rejectModalReceiptId, setRejectModalReceiptId] = useState<number | null>(null);

  const loadReceipts = useCallback(async (statusFilter?: FilterTab, refreshOnly = false) => {
    if (refreshOnly) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const statusParam = (!statusFilter || statusFilter === 'ALL') ? undefined : statusFilter;
      const [filteredData, allData] = await Promise.all([
        paymentReceiptApi.getAllReceipts(statusParam),
        paymentReceiptApi.getAllReceipts(),
      ]);
      setReceipts(filteredData || []);
      setAllReceiptsForStats(allData || []);
    } catch (err) {
      console.error(err);
      toast.error(t('billing.admin.loadError', { defaultValue: 'Не удалось загрузить чеки оплат' }));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadReceipts(activeTab);
  }, [activeTab, loadReceipts]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
  };

  const handleConfirm = async (receiptId: number) => {
    try {
      setActionInProgressId(receiptId);
      await paymentReceiptApi.confirmReceipt(receiptId);
      toast.success(t('billing.admin.confirmSuccess', { defaultValue: 'Чек подтвержден, подписка активирована на 30 дней' }));
      loadReceipts(activeTab, true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('billing.admin.confirmError', { defaultValue: 'Ошибка при подтверждении чека' });
      toast.error(message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleViewReceipt = async (receiptId: number) => {
    try {
      const res = await paymentReceiptApi.getReceiptFileUrl(receiptId);
      if (res && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        window.open(`/api/v1/billing/receipts/${receiptId}/download`, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(`/api/v1/billing/receipts/${receiptId}/download`, '_blank', 'noopener,noreferrer');
    }
  };

  const stats = useMemo(() => {
    const total = allReceiptsForStats.length;
    const awaiting = allReceiptsForStats.filter(r => r.status === 'AWAITING_REVIEW').length;
    const confirmed = allReceiptsForStats.filter(r => r.status === 'CONFIRMED').length;
    const rejected = allReceiptsForStats.filter(r => r.status === 'REJECTED').length;
    const totalConfirmedAmount = allReceiptsForStats
      .filter(r => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return { total, awaiting, confirmed, rejected, totalConfirmedAmount };
  }, [allReceiptsForStats]);

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return receipts;
    const q = searchQuery.toLowerCase();
    return receipts.filter((r) => {
      const matchClient = r.clientName?.toLowerCase().includes(q) || r.clientEmail?.toLowerCase().includes(q);
      const matchAmount = String(r.amount).includes(q);
      const matchId = String(r.id).includes(q);
      return matchClient || matchAmount || matchId;
    });
  }, [receipts, searchQuery]);

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

  const renderStatusBadge = (status: PaymentReceiptStatus, rejectNote?: string | null) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('billing.status.confirmed', 'Подтвержден')}
          </span>
        );
      case 'REJECTED':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" />
              {t('billing.status.rejected', 'Отклонен')}
            </span>
            {rejectNote && (
              <span className="text-[11px] text-rose-500 dark:text-rose-400 max-w-xs truncate" title={rejectNote}>
                {rejectNote}
              </span>
            )}
          </div>
        );
      case 'AWAITING_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            {t('billing.status.awaitingReview', 'На проверке')}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            {t('billing.admin.title', 'Модерация платежей')}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('billing.admin.subtitle', 'Проверка чеков об оплате через Kaspi / банковский перевод и активация подписок')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReceipts(activeTab, true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Обновить')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Awaiting Review */}
        <div 
          onClick={() => handleTabChange('AWAITING_REVIEW')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'AWAITING_REVIEW'
              ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Ожидают проверки
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
            {stats.awaiting}
          </p>
        </div>

        {/* Confirmed */}
        <div 
          onClick={() => handleTabChange('CONFIRMED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'CONFIRMED'
              ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Подтверждено
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
            {stats.confirmed}
          </p>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => handleTabChange('REJECTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'REJECTED'
              ? 'border-rose-400 dark:border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Отклонено
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
            {stats.rejected}
          </p>
        </div>

        {/* Total Confirmed Amount */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Сумма оплат (KZT)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2 truncate">
            {stats.totalConfirmedAmount.toLocaleString('ru-RU')} ₸
          </p>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('AWAITING_REVIEW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'AWAITING_REVIEW'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t('billing.admin.tabPending', 'На проверке')}
            {stats.awaiting > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'AWAITING_REVIEW'
                  ? 'bg-amber-400 text-zinc-900'
                  : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              }`}>
                {stats.awaiting}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {t('billing.admin.tabAll', 'Все')} ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('CONFIRMED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'CONFIRMED'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {t('billing.admin.tabConfirmed', 'Подтвержденные')} ({stats.confirmed})
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('REJECTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'REJECTED'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {t('billing.admin.tabRejected', 'Отклоненные')} ({stats.rejected})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('billing.admin.searchPlaceholder', 'Поиск по клиенту, сумме...')}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition"
          />
        </div>
      </div>

      {/* Receipts Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="text-sm">{t('billing.loading', 'Загрузка чеков...')}</span>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <Inbox className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3" />
          <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            {t('billing.admin.emptyList', 'Чеки не найдены')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            {activeTab === 'AWAITING_REVIEW'
              ? t('billing.admin.emptyAwaiting', 'Нет чеков, ожидающих рассмотрения.')
              : t('billing.admin.emptyFiltered', 'По выбранным фильтрам записей нет.')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">{t('billing.table.client', 'Клиент')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.amount', 'Сумма')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.date', 'Дата')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.status', 'Статус')}</th>
                  <th className="py-3.5 px-4">{t('billing.table.receipt', 'Чек')}</th>
                  <th className="py-3.5 px-4 text-right">{t('common.actions', 'Действия')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredReceipts.map((receipt) => {
                  const isActing = actionInProgressId === receipt.id;
                  return (
                    <tr
                      key={receipt.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">
                        {receipt.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {receipt.clientName || `ID ${receipt.clientId}`}
                          </span>
                          {receipt.clientEmail && (
                            <span className="text-xs text-zinc-400">
                              {receipt.clientEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {Number(receipt.amount).toLocaleString('ru-RU')} {receipt.currency === 'KZT' ? '₸' : receipt.currency}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                        {formatDate(receipt.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(receipt.status, receipt.rejectNote)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(receipt.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('billing.viewReceipt', 'Открыть чек')}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {receipt.status === 'AWAITING_REVIEW' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirm(receipt.id)}
                              disabled={isActing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-xs"
                            >
                              {isActing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              {t('billing.admin.confirmBtn', 'Подтвердить')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectModalReceiptId(receipt.id)}
                              disabled={isActing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {t('billing.admin.rejectBtn', 'Отклонить')}
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-400">
                            {(receipt.reviewedByName || receipt.reviewedById) && (
                              <span>
                                {t('billing.admin.reviewedBy', 'Проверил')}: {receipt.reviewedByName || receipt.reviewedById}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <RejectReceiptModal
        isOpen={rejectModalReceiptId !== null}
        receiptId={rejectModalReceiptId}
        onClose={() => setRejectModalReceiptId(null)}
        onSuccess={() => {
          toast.info(t('billing.admin.rejectedSuccess', { defaultValue: 'Чек отклонен' }));
          loadReceipts(activeTab, true);
        }}
      />
    </div>
  );
}
