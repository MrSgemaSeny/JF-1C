import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { paymentReceiptApi } from '@/entities/billing/api/paymentReceiptApi';

interface RejectReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId: number | null;
  onSuccess: () => void;
}

export const RejectReceiptModal: React.FC<RejectReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptId,
  onSuccess,
}) => {
  const { t } = useTranslation(['common']);
  const [rejectNote, setRejectNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || receiptId === null) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectNote.trim()) {
      setError(t('billing.rejectReasonRequired', 'Укажите причину отклонения чека'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await paymentReceiptApi.rejectReceipt(receiptId, rejectNote.trim());
      setRejectNote('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('billing.rejectFailed', 'Ошибка при отклонении чека');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t('billing.rejectReceiptTitle', 'Отклонить чек')} #{receiptId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t('billing.rejectReasonLabel', 'Причина отклонения')} *
            </label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('billing.rejectReasonPlaceholder', 'Например: неверная сумма, не читается квитанция, платеж не поступил на расчетный счет')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              required
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t('billing.rejectReasonHint', 'Клиент увидит эту причину в личном кабинете и в Telegram-уведомлении.')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {t('common.cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t('billing.rejectConfirmBtn', 'Подтвердить отклонение')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
