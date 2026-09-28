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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {t('billing.rejectReceiptTitle', 'Отклонить чек')} #{receiptId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('billing.rejectReasonLabel', 'Причина отклонения')} *
            </label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('billing.rejectReasonPlaceholder', 'Например: неверная сумма, не читается квитанция, платеж не поступил на расчетный счет')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              required
            />
            <p className="mt-1.5 text-xs text-gray-500">
              {t('billing.rejectReasonHint', 'Клиент увидит эту причину в личном кабинете и в Telegram-уведомлении.')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('common.cancel', 'Отмена')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rejectNote.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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
