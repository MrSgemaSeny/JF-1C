import { Briefcase } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { workProcess } from '@/content/work-process';

export function AboutProcess() {
  return (
    <Section className="bg-white text-brand-green border-t border-brand-green/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-3">
          <Briefcase className="h-4 w-4" />
          Инженерный подход
        </div>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-5">Как мы перестраиваем учет</h2>
        <div className="space-y-6 text-lg leading-relaxed text-brand-green/80">
          {workProcess.map((step) => (
            <div key={step.n}>
              <h3 className="text-2xl font-black uppercase text-brand-green mb-1">{step.n}. {step.title}</h3>
              <p dangerouslySetInnerHTML={{ __html: step.text }} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
