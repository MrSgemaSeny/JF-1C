import { Section } from '@/shared/ui/Section';
import { faqs } from '@/shared/config/content/faq';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';

interface FaqContactProps {
  id?: string;
  className?: string;
}

export function FaqContact({ id = 'faq', className = 'bg-brand-beige py-16 sm:py-20' }: FaqContactProps) {
  const { t } = useTranslation('landing');
  return (
    <Section id={id} className={className}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[28px] p-6 sm:p-10 shadow-sm border border-brand-green/10">
          <h3 className="text-2xl sm:text-3xl font-black text-brand-green mb-6 text-center uppercase tracking-tight">
            {t('faq_title', { defaultValue: 'Часто задаваемые вопросы' })}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6 items-start">
            {faqs.map((f, i) => (
              <details key={i} className="rounded-xl border border-brand-green/10 bg-brand-beige/30 p-4 shadow-sm group">
                <summary className="cursor-pointer font-bold text-brand-green text-sm sm:text-base flex items-center justify-between list-none">
                  <span>{t(f.qKey)}</span>
                  <span className="text-brand-green/60 text-lg font-black ml-3 group-open:rotate-45 transition-transform flex-shrink-0">+</span>
                </summary>
                <p className="mt-2.5 text-brand-green/75 leading-relaxed text-xs sm:text-sm border-t border-brand-green/10 pt-2.5">
                  {t(f.aKey)}
                </p>
              </details>
            ))}
          </div>

          <div className="pt-5 border-t border-brand-green/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-green/60 mb-0.5">
                {t('faq_still_questions', { defaultValue: 'Остались ещё вопросы?' })}
              </p>
              <p className="text-xs font-semibold text-brand-green/80">
                <a href="mailto:support@zhanfinance.kz" className="hover:underline">support@zhanfinance.kz</a>
                {' · '}
                <a href="mailto:info@zhanfinance.kz" className="hover:underline">info@zhanfinance.kz</a>
              </p>
            </div>
            <a
              href="https://wa.me/77750584021"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-brand-beige text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-green/90 transition-all shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              {t('faq_write_whatsapp', { defaultValue: 'Написать в WhatsApp' })}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
