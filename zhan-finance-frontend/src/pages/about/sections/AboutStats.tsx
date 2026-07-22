import { motion } from 'framer-motion';
import { Section } from '@/shared/ui/Section';
import { aboutStats } from '@/shared/config/content/stats';
import { useTranslation } from 'react-i18next';

export function AboutStats() {
  const { t } = useTranslation('landing');
  return (
    <Section className="bg-white text-brand-green border-t border-brand-green/10">
      <div className="max-w-6xl mx-auto space-y-8">
        <h2 className="text-4xl font-black uppercase tracking-tight mb-4">{t('stats_about_title', { defaultValue: 'В цифрах и фактах' })}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {aboutStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.labelKey}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-3xl border border-brand-green/10 bg-brand-beige p-6 shadow-lg shadow-brand-green/5 relative overflow-hidden group hover:-translate-y-1 transition-transform"
              >
                <Icon className="h-8 w-8 text-brand-green/30 absolute top-6 right-6 group-hover:scale-110 transition-transform" />
                <h2 className="text-4xl lg:text-5xl font-black uppercase leading-none tracking-tighter">{t(stat.valueKey)}</h2>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.1em] text-brand-green/70">{t(stat.labelKey)}</p>
                <p className="mt-3 text-brand-green/80 text-sm leading-relaxed">{t(stat.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
