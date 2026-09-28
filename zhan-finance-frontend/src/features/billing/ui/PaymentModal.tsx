import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, UploadCloud, FileText, X, AlertCircle, Building, QrCode, CheckCircle2, Loader2 } from 'lucide-react';
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
  const [activePaymentMethod, setActivePaymentMethod] = useState<'kaspi' | 'bank'>('kaspi');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : '');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
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

  const validateAndSetFile = (selected: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t('billing.modalTitle', { defaultValue: 'Оплата тарифа' })}
            </h3>
            {planName && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {planName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {t('billing.successTitle', { defaultValue: 'Чек успешно отправлен' })}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                {t('billing.successDesc', {
                  defaultValue: 'Чек передан администратору на проверку. После подтверждения подписка будет активирована автоматически.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-semibold text-xs rounded-xl transition shadow-xs"
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

            {/* Payment Method Selector */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActivePaymentMethod('kaspi')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === 'kaspi'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-rose-500" />
                <span>Kaspi Перевод / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePaymentMethod('bank')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === 'bank'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-blue-500" />
                <span>Банковский перевод</span>
              </button>
            </div>

            {/* Step 1: Requisites */}
            {requisites && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>{t('billing.recipient', { defaultValue: 'Получатель' })}:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{requisites.recipientName}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>{t('billing.bin', { defaultValue: 'БИН' })}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{requisites.bin}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(requisites.bin, 'bin')}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                      title="Копировать БИН"
                    >
                      {copiedField === 'bin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>{t('billing.iban', { defaultValue: 'IBAN (счет)' })}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{requisites.iban}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(requisites.iban, 'iban')}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                      title="Копировать IBAN"
                    >
                      {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>{t('billing.bank', { defaultValue: 'Банк' })}:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{requisites.bankName} (КБе {requisites.kbe})</span>
                </div>
              </div>
            )}

            {/* Step 2: Amount input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t('billing.amountToPay', { defaultValue: 'Сумма перевода (KZT)' })}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="45000"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                  ₸
                </span>
              </div>
            </div>

            {/* Step 3: File dropzone */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t('billing.uploadReceipt', { defaultValue: 'Чек об оплате (PDF)' })}
              </label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : file
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 bg-zinc-50/50 dark:bg-zinc-800/30'
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required={!file}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-zinc-400 hover:text-rose-500 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                      title="Удалить файл"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-7 h-7 mx-auto text-zinc-400 dark:text-zinc-500" />
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {t('billing.dragFile', { defaultValue: 'Выберите PDF-файл чека или перетащите сюда' })}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {t('billing.maxSize', { defaultValue: 'Максимальный размер: 10 МБ' })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
              >
                {t('common.cancel', { defaultValue: 'Отмена' })}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50 rounded-xl transition shadow-xs"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
