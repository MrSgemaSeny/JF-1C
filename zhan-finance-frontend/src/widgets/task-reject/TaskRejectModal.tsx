import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle, Send, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { useEscapeKey } from '@/shared/lib/hooks/useEscapeKey';

interface TaskRejectModalProps {
  taskTitle?: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

const PREDEFINED_REASONS = [
  { key: 'changedMind', default: 'Передумал' },
  { key: 'tooExpensive', default: 'Слишком дорого' },
  { key: 'noTime', default: 'Нет времени' },
  { key: 'foundAnother', default: 'Нашел другого исполнителя' },
];

export function TaskRejectModal({ taskTitle, onClose, onSubmit, isLoading = false }: TaskRejectModalProps) {

  const { t } = useTranslation(['modals', 'crm']);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  useEscapeKey(() => onClose(), true);

  const handleReasonClick = (reason: string) => {
    setSelectedReason(reason === selectedReason ? null : reason);
  };

  // Комбинируем причину
  const finalReason = selectedReason 
    ? (customReason.trim() ? `${t(`modals:reject.reasons.${selectedReason}`)}. ${customReason.trim()}` : t(`modals:reject.reasons.${selectedReason}`))
    : customReason.trim();

  const isSubmitDisabled = !finalReason || isLoading;

  const handleSubmit = () => {
    if (!isSubmitDisabled) {
      onSubmit(finalReason);
    }
  };


  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-[1200px] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-red-50/80">
          <div>
            <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle size={24} className="text-red-500" />
              {t('modals:reject.title', { defaultValue: 'Отказ от задачи' })}
            </h2>
            {taskTitle && (
              <p className="text-sm font-medium text-red-900/60 mt-1 ml-8">
                {taskTitle}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full transition-colors self-start"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-red-50/50 border border-red-100 rounded-xl p-4 flex gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">{t('modals:reject.warningTitle', { defaultValue: 'Внимание! Это действие необратимо.' })}</p>
              <p className="text-red-700/80">
                {t('modals:reject.warningDesc', { defaultValue: 'После отказа задача будет перемещена в архив. Статус задачи нельзя будет изменить в будущем.' })}
              </p>
            </div>
          </div>

          <p className="text-gray-700 font-medium mb-3">
            {t('modals:reject.reasonPrompt', { defaultValue: 'Пожалуйста, укажите причину отказа:' })}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {PREDEFINED_REASONS.map(reason => (
              <button
                key={reason.key}
                onClick={() => handleReasonClick(reason.key)}
                className={twMerge(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                  selectedReason === reason.key 
                    ? "bg-red-50 text-red-600 border-red-200 ring-2 ring-red-100" 
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {t(`modals:reject.reasons.${reason.key}`, { defaultValue: reason.default })}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">
              {selectedReason 
                ? t('modals:reject.additionalComments', { defaultValue: 'Дополнительные комментарии (необязательно)' }) 
                : t('modals:reject.customReason', { defaultValue: 'Или напишите свой вариант (обязательно)' })}
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t('modals:reject.placeholder', { defaultValue: 'Расскажите подробнее, почему вы решили отказаться от задачи...' })}
              className="w-full h-28 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all resize-none bg-gray-50/50 focus:bg-white"
            />
          </div>
        </div>

        <div className="p-5 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <XCircle size={18} />
            {t('modals:reject.cancel', { defaultValue: 'Отмена' })}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-200 hover:shadow-md hover:shadow-red-200 flex items-center gap-2"
          >
            {isLoading ? t('modals:reject.submitting', { defaultValue: 'Отправка...' }) : t('modals:reject.submit', { defaultValue: 'Отправить отказ' })}
            {!isLoading && <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
