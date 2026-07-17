import { motion } from 'framer-motion';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { Quote } from 'lucide-react';
import { reviewsList } from '@/shared/config/content/reviews';
import { useTranslation } from 'react-i18next';

export function Reviews() {
  const { t } = useTranslation('common');
  return (
    <Section className="bg-white py-24 overflow-hidden relative">
      <Container>
        <div className="flex flex-col md:flex-row gap-12 items-end mb-16">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green">
              {t('reviews.title1', { defaultValue: 'Что говорят' })} <br />
              <span className="text-brand-green/40">{t('reviews.title2', { defaultValue: 'клиенты' })}</span>
            </h2>
          </div>
          <p className="text-xl text-brand-green/70 font-medium max-w-md">
            {t('reviews.description', { defaultValue: 'Реальные истории компаний, которые доверили нам свою бухгалтерию.' })}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          {reviewsList.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="bg-brand-beige/30 p-8 rounded-[32px] border border-brand-green/5 hover:bg-brand-beige transition-colors group"
            >
              <Quote className="w-10 h-10 text-brand-green/20 mb-6 group-hover:text-brand-green/40 transition-colors" />
              <p className="text-lg text-brand-green/80 leading-relaxed font-medium mb-8">
                &quot;{t(`reviews.${review.id}.text`, { defaultValue: review.text })}&quot;
              </p>
              <div>
                <div className="font-black uppercase tracking-wider text-brand-green">
                  {t(`reviews.${review.id}.name`, { defaultValue: review.name })}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-brand-green/50 mt-1">
                  {t(`reviews.${review.id}.company`, { defaultValue: review.company })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
