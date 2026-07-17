import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useContactForm } from './useContactForm';

interface ContactFormProps {
  title?: string;
  className?: string;
  showMessage?: boolean;
}

export function ContactForm({ title, className = '', showMessage = false }: ContactFormProps) {
  const { t } = useTranslation('common');
  const { name, setName, phone, setPhone, message, setMessage, submitted, loading, error, handleSubmit } = useContactForm();

  const displayTitle = title || t('contactForm.title', { defaultValue: 'Связаться с нами' });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (!input) {
      setPhone('');
      return;
    }
    if (input[0] === '7' || input[0] === '8') {
      input = input.substring(1);
    }
    
    let formatted = '+7';
    if (input.length > 0) formatted += ` (${input.substring(0, 3)}`;
    if (input.length >= 4) formatted += `) ${input.substring(3, 6)}`;
    if (input.length >= 7) formatted += `-${input.substring(6, 8)}`;
    if (input.length >= 9) formatted += `-${input.substring(8, 10)}`;
    
    setPhone(formatted);
  };

  return (
    <div className={className}>
      {title !== '' && <h3 className="text-3xl font-black uppercase mb-8">{displayTitle}</h3>}
      {submitted ? (
        <div className="flex flex-col items-center justify-center p-8 bg-brand-green/5 rounded-2xl border border-brand-green/10 text-center">
          <CheckCircle2 className="w-16 h-16 text-brand-green mb-4" />
          <h4 className="text-2xl font-black text-brand-green mb-2">{t('contactForm.success.title', { defaultValue: 'Спасибо!' })}</h4>
          <p className="text-brand-green/70 text-lg">
            {t('contactForm.success.text', { defaultValue: 'Мы скоро свяжемся с вами для обсуждения деталей.' })}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider opacity-70">
              {t('contactForm.fields.name.label', { defaultValue: 'Ваше имя' })}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium"
              placeholder={t('contactForm.fields.name.placeholder', { defaultValue: 'Имя Фамилия' })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider opacity-70">
              {t('contactForm.fields.phone.label', { defaultValue: 'Телефон' })}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium"
              placeholder="+7 (___) ___-__-__"
              required
            />
          </div>
          {showMessage && (
            <div>
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider opacity-70">
                {t('contactForm.fields.message.label', { defaultValue: 'Краткое описание задачи' })}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium"
                placeholder={t('contactForm.fields.message.placeholder', { defaultValue: 'Расскажите, чем мы можем вам помочь...' })}
                rows={3}
              />
            </div>
          )}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-brand-green text-brand-beige py-5 rounded-xl text-lg font-bold uppercase tracking-wider hover:bg-brand-green/90 hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('contactForm.buttons.submitting', { defaultValue: 'Отправляем...' })}
              </>
            ) : (
              t('contactForm.buttons.submit', { defaultValue: 'Отправить заявку' })
            )}
          </button>
        </form>
      )}
    </div>
  );
}
