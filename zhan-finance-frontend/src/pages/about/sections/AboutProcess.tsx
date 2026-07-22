import { Briefcase } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { workProcess } from '@/shared/config/content/work-process';
import { useTranslation } from 'react-i18next';

export function AboutProcess() {
  const { t } = useTranslation('landing');
  return (
    <Section className="bg-white text-brand-green border-t border-brand-green/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-3">
          <Briefcase className="h-4 w-4" />
          {t('process_badge', { defaultValue: 'Инженерный подход' })}
        </div>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-5">{t('process_title', { defaultValue: 'Как мы перестраиваем учет' })}</h2>
        <div className="space-y-6 text-lg leading-relaxed text-brand-green/80">
          {workProcess.map((step) => (
            <div key={step.n}>
              <h3 className="text-2xl font-black uppercase text-brand-green mb-1">{step.n}. {t(step.titleKey)}</h3>
              <p dangerouslySetInnerHTML={{ __html: t(step.textKey) }} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
