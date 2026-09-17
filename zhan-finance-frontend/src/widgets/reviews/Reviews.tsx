import { motion } from 'framer-motion';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Quote } from 'lucide-react';
import { reviewsList } from '@/shared/config/content/reviews';
import { useTranslation } from 'react-i18next';

export function Reviews() {
  const { t } = useTranslation('landing');
  return (
    <Section className="bg-white py-12 sm:py-20 lg:py-24 overflow-hidden relative">
      <Container>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-12 items-start md:items-end mb-6 sm:mb-16">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green break-words">
              {t('reviews_title1', { defaultValue: 'Что говорят' })} <br />
              <span className="text-brand-green/40">{t('reviews_title2', { defaultValue: 'клиенты' })}</span>
            </h2>
          </div>
          <p className="text-sm sm:text-xl text-brand-green/70 font-medium max-w-md">
            {t('reviews_desc', { defaultValue: 'Реальные истории компаний, которые доверили нам свою бухгалтерию.' })}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 sm:gap-6 relative z-10">
          {reviewsList.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-brand-beige/30 p-4 sm:p-8 rounded-2xl sm:rounded-[32px] border border-brand-green/5 hover:bg-brand-beige transition-colors group flex flex-col justify-between"
            >
              <div>
                <Quote className="w-6 h-6 sm:w-10 sm:h-10 text-brand-green/20 mb-3 sm:mb-6 group-hover:text-brand-green/40 transition-colors" />
                <p className="text-xs sm:text-lg text-brand-green/80 leading-relaxed font-medium mb-4 sm:mb-8">
                  &quot;{t(review.textKey)}&quot;
                </p>
              </div>
              <div>
                <div className="text-xs sm:text-base font-black uppercase tracking-wider text-brand-green">
                  {t(review.nameKey)}
                </div>
                <div className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-brand-green/50 mt-0.5 sm:mt-1">
                  {t(review.companyKey)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
