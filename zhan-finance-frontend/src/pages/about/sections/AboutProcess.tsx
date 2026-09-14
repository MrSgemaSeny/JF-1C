import { Section } from '@/shared/ui/Section';
import { workProcess } from '@/shared/config/content/work-process';
import { useTranslation, Trans } from 'react-i18next';

export function AboutProcess() {
  const { t } = useTranslation('landing');
  return (
    <Section className="bg-white text-brand-green border-t border-brand-green/10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-5 break-words">{t('process_title', { defaultValue: 'Как мы перестраиваем учет' })}</h2>
        <div className="space-y-6 text-base sm:text-lg leading-relaxed text-brand-green/80">
          {workProcess.map((step) => (
            <div key={step.n}>
              <h3 className="text-2xl font-black uppercase text-brand-green mb-1">{step.n}. {t(step.titleKey)}</h3>
              <p><Trans i18nKey={step.textKey} ns="landing" /></p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
