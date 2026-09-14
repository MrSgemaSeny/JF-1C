import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { useTranslation } from 'react-i18next';
import { useEscapeKey } from '@/shared/lib/hooks/useEscapeKey';

interface ServiceModalProps {
  item: ServiceDto;
  isOpen?: boolean;
  onClose: () => void;
  onConsult?: () => void;
}

export function ServiceModal({
  item,
  onClose,
  onConsult,
}: ServiceModalProps) {
  const { t } = useTranslation(['common', 'landing']);

  useEscapeKey(onClose);

  const handleConsult = () => {
    onClose();
    if (onConsult) {
      onConsult();
    } else {
      (document.getElementById('contact') || document.getElementById('footer'))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[680px] overflow-hidden rounded-[28px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-white/90 backdrop-blur px-6 sm:px-8 py-5 sticky top-0 z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/60 mb-1">
                {t('serviceModal.service', { defaultValue: 'Услуга' })}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-brand-green tracking-tight leading-tight">
                {t(`service.${item.id}.title`, { defaultValue: item.title })}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100 px-4 py-2 text-xs sm:text-sm font-bold text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-800"
            >
              {t('serviceModal.close', { defaultValue: 'Закрыть' })}
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {item.imageUrl && (
              <div className="overflow-hidden rounded-2xl bg-gray-50 aspect-video w-full shadow-inner border border-gray-100">
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-lg font-black text-brand-green uppercase tracking-tight">
                {t('serviceModal.about', { defaultValue: 'О сервисе' })}
              </h4>
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                {t(`service.${item.id}.description`, { defaultValue: item.description })}
              </p>
            </div>

            <div className="rounded-2xl border border-brand-green/10 bg-brand-beige/30 p-5 sm:p-6">
              <h5 className="font-bold text-brand-green mb-3 flex items-center gap-2">
                {t('serviceModal.includes', { defaultValue: 'Что входит в стоимость:' })}
              </h5>
              <ul className="space-y-2.5 text-brand-green/85 font-medium">
                {item.features.map((feature, featureIndex) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm sm:text-base">
                    <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      {t(`service.${item.id}.features.${featureIndex}`, { defaultValue: feature })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-xs hover:bg-gray-50 transition-all text-center"
              >
                {t('serviceModal.close', { defaultValue: 'Закрыть' })}
              </button>
              <button
                type="button"
                onClick={handleConsult}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-green text-brand-beige font-bold uppercase tracking-wider text-xs hover:bg-brand-green/90 transition-all text-center shadow-md shadow-brand-green/20"
              >
                {t('serviceModal.consult', { defaultValue: 'Получить консультацию' })}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
