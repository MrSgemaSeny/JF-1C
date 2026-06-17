import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { reviewsList } from '@/entities/review';

export function Reviews() {
  return (
    <Section
      className="bg-brand-beige text-brand-green border-t border-brand-green/10 overflow-hidden"
      id="reviews"
    >
      <div className="mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-black uppercase tracking-tight"
        >
          Что о нас говорят
        </motion.h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviewsList.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="bg-brand-green text-brand-beige p-10 rounded-2xl flex flex-col justify-between min-h-[300px]"
          >
            <div className="mb-8">
              <div className="text-5xl font-black leading-none mb-6 text-brand-beige/30">&ldquo;</div>
              <p className="text-lg font-medium leading-relaxed">{review.text}</p>
            </div>
            <div className="pt-6 border-t border-brand-beige/20">
              <div className="font-bold text-lg uppercase tracking-wider">{review.name}</div>
              <div className="text-brand-beige/60 font-medium">{review.company}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
