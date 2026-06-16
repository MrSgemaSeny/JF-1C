import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';

export function Guarantee() {
  const items = [
    {
      title: '100% Гарантия результата',
      subtitle: 'Мы стоим за качеством каждого проекта',
    },
    {
      title: 'Помогаем бизнесу экономить легально.',
      subtitle: 'Оптимизируем налоги и бухгалтерию без риска',
    },
    {
      title: 'Экспертный подход к финансам',
      subtitle: 'Команда с многолетним опытом в финансовом консалтинге',
    },
  ];

  return (
    <Section className="bg-brand-green text-brand-beige py-24" id="guarantee">
      <div className="max-w-7xl mx-auto grid gap-12 md:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-3xl md:text-4xl font-black uppercase mb-4">
              {item.title}
            </h3>
            <p className="text-lg md:text-xl text-brand-beige/80">
              {item.subtitle}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
