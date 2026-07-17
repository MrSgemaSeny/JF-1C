import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Paperclip, X, FileText } from 'lucide-react';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { Input } from '@/shared/ui/Input/Input';
import { Textarea } from '@/shared/ui/Input/Textarea';
import { useTranslation } from 'react-i18next';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.csv'];

interface ServiceModalProps {
  item: ServiceDto;
  onClose: () => void;
  onRequest?: (service: ServiceDto, message?: string, preferredDate?: string, files?: File[]) => Promise<void>;
  onGuestRequest?: (service: ServiceDto, name: string, phone: string, message?: string, preferredDate?: string, files?: File[]) => Promise<void>;
  isSubmitting?: boolean;
  isLoggedIn?: boolean;
  initialMessage?: string;
  initialPreferredDate?: string;
}

export function ServiceModal({ item, onClose, onRequest, onGuestRequest, isSubmitting = false, isLoggedIn = false, initialMessage = '', initialPreferredDate = '' }: ServiceModalProps) {
  const { t } = useTranslation('common');
  const [message, setMessage] = useState(initialMessage);
  const [preferredDate, setPreferredDate] = useState(initialPreferredDate);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setMessage(initialMessage);
    setPreferredDate(initialPreferredDate);
  }, [initialMessage, initialPreferredDate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of selected) {
      if (files.length + validFiles.length >= MAX_FILES) break;
      
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) continue;
      
      validFiles.push(file);
    }

    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRequest = () => {
    if (isLoggedIn) {
      onRequest?.(item, message || undefined, preferredDate || undefined, files.length > 0 ? files : undefined);
    } else {
      if (onGuestRequest && (!name || !phone)) {
        alert(t('serviceModal.validation.fillContacts', { defaultValue: 'Пожалуйста, заполните имя и телефон' }));
        return;
      }
      if (onGuestRequest) {
        onGuestRequest(item, name, phone, message || undefined, preferredDate || undefined, files.length > 0 ? files : undefined);
      } else {
        onRequest?.(item, message || undefined, preferredDate || undefined, files.length > 0 ? files : undefined);
      }
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-brand-green/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-4xl overflow-hidden rounded-[24px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-white/80 backdrop-blur px-8 py-5 sticky top-0 z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green/60 mb-1">{t('serviceModal.service', { defaultValue: 'Услуга' })}</p>
              <h3 className="text-2xl sm:text-3xl font-black text-brand-green tracking-tight leading-none">{item.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-800 focus:ring-2 focus:ring-gray-300"
            >
              {t('serviceModal.close', { defaultValue: 'Закрыть' })}
            </button>
          </div>

          <div className="p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row gap-10">
            <div className="flex-1 space-y-8">
              {item.imageUrl && (
                <div className="overflow-hidden rounded-2xl bg-gray-50 aspect-video w-full shadow-inner border border-gray-100">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-4">
                <h4 className="text-xl font-black text-gray-900">{t('serviceModal.about', { defaultValue: 'О сервисе' })}</h4>
                <p className="text-gray-600 leading-relaxed text-lg">{item.description}</p>
                <div className="rounded-2xl border border-brand-green/10 bg-brand-green/[0.03] p-6 mt-6">
                  <h5 className="font-bold text-brand-green mb-4 flex items-center gap-2">{t('serviceModal.includes', { defaultValue: 'Что входит в стоимость:' })}</h5>
                  <ul className="space-y-3 text-brand-green/80 font-medium">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[380px] shrink-0">
              <div className="sticky top-6 space-y-5 rounded-3xl bg-gray-50 border border-gray-200/60 p-6 sm:p-8 shadow-sm">
                <h5 className="text-xl font-black text-gray-900">{t('serviceModal.orderForm.title', { defaultValue: 'Оставить заявку' })}</h5>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-4">
                  {isLoggedIn
                    ? t('serviceModal.orderForm.descriptionLoggedIn', { defaultValue: 'Опишите задачу или нажмите «Оставить заявку», и наш специалист свяжется с вами.' })
                    : t('serviceModal.orderForm.descriptionGuest', { defaultValue: 'Заполните форму ниже, чтобы мы могли связаться с вами и обсудить детали.' })}
                </p>

                {onRequest && (
                  <div className="space-y-4">
                    {!isLoggedIn && onGuestRequest && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Иван Иванов"
                          label={t('serviceModal.orderForm.name', { defaultValue: 'Как к вам обращаться? *' })}
                        />
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+7 (___) ___-__-__"
                          label={t('serviceModal.orderForm.phone', { defaultValue: 'Номер телефона *' })}
                        />
                      </div>
                    )}
                    
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('serviceModal.orderForm.commentPlaceholder', { defaultValue: 'Например: нужно ведение ИП на УСН...' })}
                      label={t('serviceModal.orderForm.comment', { defaultValue: 'Дополнительный комментарий' })}
                    />
                    <Input
                      id="preferredDate"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      label={t('serviceModal.orderForm.date', { defaultValue: 'Желаемая дата звонка (необязательно)' })}
                    />

                    {/* File Attachment Section - AVAILABLE TO ALL */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('serviceModal.files.label', { defaultValue: 'Прикрепить файлы' })}
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ALLOWED_EXTENSIONS.join(',')}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= MAX_FILES}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Paperclip size={16} />
                        {files.length >= MAX_FILES
                          ? t('serviceModal.files.maxReached', { defaultValue: 'Максимум файлов' })
                          : t('serviceModal.files.attach', { defaultValue: 'Выбрать файлы' })}
                      </button>
                      <p className="text-[11px] text-gray-400">
                        {t('serviceModal.files.hint', { defaultValue: 'PDF, XLSX, DOCX, JPG, PNG. До 10 МБ, макс. 5 файлов.' })}
                      </p>

                      {files.length > 0 && (
                        <div className="space-y-2">
                          {files.map((file, i) => (
                            <div key={`${file.name}-${i}`} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 text-sm">
                              <FileText size={14} className="text-brand-green shrink-0" />
                              <span className="flex-1 truncate text-gray-700 font-medium">{file.name}</span>
                              <span className="text-gray-400 text-xs shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleRequest}
                      disabled={isSubmitting}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-4 text-base font-bold text-white transition-all hover:bg-brand-green/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-brand-green/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t('serviceModal.orderForm.submitting', { defaultValue: 'Отправляем...' })}
                        </>
                      ) : (
                        t('serviceModal.orderForm.submit', { defaultValue: 'Оставить заявку' })
                      )}
                    </button>
                    {!isLoggedIn && !onGuestRequest && (
                      <p className="text-xs text-center text-gray-400 mt-3">
                        {t('serviceModal.orderForm.authRequired', { defaultValue: 'Для отправки заявки потребуется авторизация.' })}
                      </p>
                    )}
                  </div>
                )}

                {!onRequest && (
                  <a
                    href="/services"
                    className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-4 text-base font-bold text-white transition-all hover:bg-gray-800 shadow-md"
                  >
                    {t('serviceModal.allServices', { defaultValue: 'Все услуги' })}
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
