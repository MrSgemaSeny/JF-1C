import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { paymentReceiptApi, PaymentRequisitesDto } from '@/entities/billing/api/paymentReceiptApi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId?: number;
  planName?: string;
  defaultAmount?: number;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
  planName,
  defaultAmount,
  onSuccess,
}) => {
  const { t } = useTranslation(['common']);
  const [requisites, setRequisites] = useState<PaymentRequisitesDto | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      paymentReceiptApi.getRequisites()
        .then(setRequisites)
        .catch(() => {
          setRequisites({
            recipientName: 'ТОО ЖАН FINANCE',
            bin: '240140012345',
            iban: 'KZ123456789012345678',
            kbe: '17',
            bankName: 'АО Каспий Банк',
          });
        });
      if (defaultAmount) {
        setAmount(String(defaultAmount));
      }
      setFile(null);
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen, defaultAmount]);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
      setError(t('billing.errors.pdfOnly', { defaultValue: 'Разрешены только файлы формата PDF' }));
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError(t('billing.errors.fileTooLarge', { defaultValue: 'Размер файла не должен превышать 10 МБ' }));
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('billing.errors.invalidAmount', { defaultValue: 'Укажите корректную сумму оплаты' }));
      return;
    }

    if (!file) {
      setError(t('billing.errors.fileRequired', { defaultValue: 'Прикрепите PDF-чек об оплате' }));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('amount', String(numAmount));
      formData.append('currency', 'KZT');
      if (subscriptionId) {
        formData.append('subscriptionId', String(subscriptionId));
      }
      formData.append('file', file);

      await paymentReceiptApi.submitReceipt(formData);
      setIsSuccess(true);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('billing.errors.submitFailed', { defaultValue: 'Ошибка при отправке чека' });
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('billing.modalTitle', { defaultValue: 'Оплата тарифа' })}
            </h3>
            {planName && (
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {planName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('billing.successTitle', { defaultValue: 'Чек успешно отправлен' })}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {t('billing.successDesc', {
                defaultValue: 'Чек передан администратору на проверку. После подтверждения подписка будет активирована автоматически.',
              })}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white font-medium rounded-xl transition shadow-sm"
            >
              {t('common.close', { defaultValue: 'Закрыть' })}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Requisites */}
            {requisites && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('billing.requisitesTitle', { defaultValue: 'Реквизиты для оплаты:' })}
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('billing.recipient', { defaultValue: 'Получатель' })}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{requisites.recipientName}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('billing.bin', { defaultValue: 'БИН' })}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{requisites.bin}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(requisites.bin, 'bin')}
                      className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Копировать БИН"
                    >
                      {copiedField === 'bin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('billing.iban', { defaultValue: 'IBAN (счет)' })}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{requisites.iban}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(requisites.iban, 'iban')}
                      className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      title="Копировать IBAN"
                    >
                      {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('billing.bank', { defaultValue: 'Банк' })}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{requisites.bankName} (КБе {requisites.kbe})</span>
                </div>
              </div>
            )}

            {/* Step 2: Amount input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('billing.amountToPay', { defaultValue: 'Сумма перевода (KZT)' })}
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
              />
            </div>

            {/* Step 3: File dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('billing.uploadReceipt', { defaultValue: 'Чек об оплате (PDF)' })}
              </label>
              <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-4 text-center transition bg-gray-50/50 dark:bg-gray-800/30">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="truncate max-w-[260px]">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-7 h-7 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t('billing.dragFile', { defaultValue: 'Выберите PDF-файл чека или перетащите сюда' })}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {t('billing.maxSize', { defaultValue: 'Максимальный размер: 10 МБ' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                {t('common.cancel', { defaultValue: 'Отмена' })}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition shadow-sm"
              >
                {isSubmitting
                  ? t('billing.submitting', { defaultValue: 'Отправка...' })
                  : t('billing.submitReceiptBtn', { defaultValue: 'Отправить чек на проверку' })}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
