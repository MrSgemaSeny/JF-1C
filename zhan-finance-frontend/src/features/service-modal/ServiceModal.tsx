import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ServiceDto } from '@/entities/service/api/servicesApi';

interface ServiceModalProps {
  item: ServiceDto;
  onClose: () => void;
  onRequest?: (service: ServiceDto, message?: string, preferredDate?: string) => Promise<void>;
  isSubmitting?: boolean;
  isLoggedIn?: boolean;
  initialMessage?: string;
  initialPreferredDate?: string;
}

export function ServiceModal({ item, onClose, onRequest, isSubmitting = false, isLoggedIn = false, initialMessage = '', initialPreferredDate = '' }: ServiceModalProps) {
  const [message, setMessage] = useState(initialMessage);
  const [preferredDate, setPreferredDate] = useState(initialPreferredDate);
  
  // Синхронизация с props (когда восстанавливаем из sessionStorage)
  useEffect(() => {
    setMessage(initialMessage);
    setPreferredDate(initialPreferredDate);
  }, [initialMessage, initialPreferredDate]);

  const handleRequest = () => {
    onRequest?.(item, message || undefined, preferredDate || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-green/10 bg-brand-beige/10 px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-green/70">Услуга</p>
            <h3 className="mt-2 text-3xl font-black text-brand-green">{item.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-green/20 px-4 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/5"
          >
            Закрыть
          </button>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {item.imageUrl && (
            <div className="overflow-hidden rounded-[28px] bg-brand-beige/10">
              <img src={item.imageUrl} alt={item.title} className="w-full object-cover" />
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <h4 className="text-xl font-black text-brand-green">Описание</h4>
              <p className="text-brand-green/75">{item.description}</p>
              <div className="rounded-[24px] border border-brand-green/10 bg-brand-green/5 p-5">
                <h5 className="font-black text-brand-green">Что входит</h5>
                <ul className="mt-3 space-y-2 text-brand-green/70">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-brand-green shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-4 rounded-[28px] bg-brand-beige/5 p-6">
              <h5 className="font-black text-brand-green">Готовы начать?</h5>
              <p className="text-brand-green/70 text-sm">
                {isLoggedIn
                  ? 'Опишите вашу задачу или нажмите «Заказать услугу», и мы свяжемся с вами.'
                  : 'Заполните данные ниже. Для завершения отправки потребуется войти в систему.'}
              </p>

              {onRequest && (
                <>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Опишите вашу задачу (необязательно)..."
                    rows={3}
                    className="w-full rounded-2xl border border-brand-green/15 bg-white px-4 py-3 text-sm text-brand-green placeholder:text-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none"
                  />
                  <div>
                    <label className="block text-sm font-semibold text-brand-green mb-1 ml-2">
                      Желаемая дата связи (опционально)
                    </label>
                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-full border border-brand-green/15 bg-white px-4 py-3 text-sm text-brand-green placeholder:text-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </div>
                  <button
                    onClick={handleRequest}
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-bold text-brand-beige transition hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Отправляем...
                      </>
                    ) : isLoggedIn ? (
                      'Заказать услугу'
                    ) : (
                      'Войти и заказать'
                    )}
                  </button>
                </>
              )}

              {!onRequest && (
                <a
                  href="/services"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-green px-5 py-3 text-sm font-bold text-brand-beige transition hover:bg-brand-green/90"
                >
                  Узнать подробнее
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
