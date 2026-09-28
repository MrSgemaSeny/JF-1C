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
      setError(t('billing.errors.receiptRequired', { defaultValue: 'Прикрепите PDF-файл квитанции' }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {t('billing.modalTitle', { defaultValue: 'Оплата тарифа' })}
            </h3>
            {planName && (
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                {planName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">
                {t('billing.successTitle', { defaultValue: 'Чек успешно отправлен' })}
              </h4>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {t('billing.successDesc', {
                  defaultValue: 'Чек передан администратору на проверку. После подтверждения подписка будет активирована автоматически.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition shadow-xs cursor-pointer"
            >
              {t('common.close', { defaultValue: 'Закрыть' })}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="flex rounded-lg bg-gray-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivePaymentMethod('kaspi')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePaymentMethod === 'kaspi'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-rose-500" />
                <span>Kaspi Перевод / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePaymentMethod('bank')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activePaymentMethod === 'bank'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-blue-500" />
                <span>Банковский перевод</span>
              </button>
            </div>

            {/* Step 1: Requisites */}
            {requisites && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>{t('billing.recipient', { defaultValue: 'Получатель' })}:</span>
                  <span className="font-semibold text-gray-900">{requisites.recipientName}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>{t('billing.bin', { defaultValue: 'БИН' })}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-gray-900">{requisites.bin}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(requisites.bin, 'bin')}
                      className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                      title="Копировать БИН"
                    >
                      {copiedField === 'bin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>{t('billing.iban', { defaultValue: 'IBAN (счет)' })}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-gray-900">{requisites.iban}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(requisites.iban, 'iban')}
                      className="p-1 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                      title="Копировать IBAN"
                    >
                      {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>{t('billing.bank', { defaultValue: 'Банк' })}:</span>
                  <span className="font-semibold text-gray-900">{requisites.bankName} (КБе {requisites.kbe})</span>
                </div>
              </div>
            )}

            {/* Step 2: Amount input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  ₸
                </span>
              </div>
            </div>

            {/* Step 3: File dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t('billing.uploadReceipt', { defaultValue: 'Чек об оплате (PDF)' })}
              </label>
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : file
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
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
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate max-w-[220px]">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-gray-100 transition cursor-pointer"
                      title="Удалить файл"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-xs font-medium text-gray-700">
                      {t('billing.dragFile', { defaultValue: 'Выберите PDF-файл чека или перетащите сюда' })}
                    </p>
                    <p className="text-[10px] text-gray-400">
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
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition cursor-pointer"
              >
                {t('common.cancel', { defaultValue: 'Отмена' })}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition shadow-xs cursor-pointer"
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
