import { Section } from '@/shared/ui/Section';
import { faqs } from '@/shared/config/content/faq';
import { ContactForm } from '@/features/contact-form/ContactForm';
import { useTranslation } from 'react-i18next';

export function ServicesFaqContact() {
  const { t } = useTranslation('landing');
  return (
    <Section className="bg-brand-beige pt-28 pb-12">
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <div className="bg-brand-beige rounded-[32px] p-8 shadow-lg border border-brand-green/10">
          <h3 className="text-3xl font-black text-brand-green mb-6">{t('faq_title', { defaultValue: 'Часто задаваемые вопросы' })}</h3>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="rounded-3xl border border-brand-green/10 bg-brand-beige/90 p-5 shadow-sm">
                <summary className="cursor-pointer font-bold text-brand-green text-lg">{t(f.qKey)}</summary>
                <p className="mt-3 text-brand-green/70 leading-relaxed">{t(f.aKey)}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="bg-brand-beige rounded-[32px] p-8 shadow-lg border border-brand-green/10">
          <ContactForm title={t('services.faq.contactTitle', { defaultValue: 'Готовы обсудить задачу?' })} showMessage={true} />
        </div>
      </div>
    </Section>
  );
}
