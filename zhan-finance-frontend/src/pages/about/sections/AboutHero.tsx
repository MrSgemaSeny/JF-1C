import { Container } from '@/shared/ui/Container';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function AboutHero() {
  const { t } = useTranslation('common');
  return (
    <div className="bg-brand-green pt-32 pb-24 text-brand-beige relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl"
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight break-words">
            {t('about.hero.title', { defaultValue: 'Машинная точность' })}
            <span className="block text-brand-beige/75">{t('about.hero.subtitle', { defaultValue: 'и финансовая инженерия' })}</span>
          </h1>
          <p className="mt-6 sm:mt-10 max-w-4xl text-base sm:text-lg md:text-2xl leading-relaxed text-brand-beige/85">
            {t('about.hero.description', { defaultValue: 'Бухгалтерия давно перестала быть просто перекладыванием бумажек и вводом накладных. Сегодня это сложная инженерная система, от правильной архитектуры которой зависит выживаемость бизнеса, его способность привлекать инвестиции и проходить налоговые проверки.' })}
          </p>
        </motion.div>
      </Container>
    </div>
  );
}
