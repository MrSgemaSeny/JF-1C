import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const cards = [
  {
    title: 'Ответственность',
    text: 'Берем на себя финансовую ответственность по договору SLA. Штрафы по нашей вине — платим мы.',
  },
  {
    title: 'Автоматизация',
    text: 'Интеграция 1С с банками и CRM. Минимум ручного ввода — максимум точности.',
  },
  {
    title: 'Контроль 24/7',
    text: 'Прозрачная отчетность в любой момент времени. Вы всегда знаете, где ваши деньги.',
  },
  {
    title: 'Оптимизация',
    text: 'Легально снижаем налоговую нагрузку на основе актуальной судебной практики.',
  },
];

export function HomeAdvantages() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [-5, 5]);

  return (
    <Section className="bg-brand-beige py-32 overflow-hidden relative" ref={containerRef}>
      <motion.div
        style={{ rotate }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(67,133,86,0.05)_0%,transparent_70%)] pointer-events-none"
      />
      
      <Container>
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          <div className="lg:col-span-5 space-y-8">
            <motion.h2 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green"
            >
              Почему выбирают <br />
              <span className="text-brand-green/40">Zhan Finance</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-brand-green/80 font-medium"
            >
              Мы не просто сдаем отчеты. Мы выстраиваем прозрачную систему, которая помогает бизнесу расти безопасно.
            </motion.p>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 lg:gap-6">
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1, type: 'spring' }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[32px] border border-brand-green/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <div className="text-5xl font-black text-brand-green/10 mb-6 group-hover:text-brand-green/20 transition-colors">
                  0{i + 1}
                </div>
                <h3 className="text-2xl font-black text-brand-green uppercase tracking-wide mb-3">
                  {card.title}
                </h3>
                <p className="text-brand-green/70 leading-relaxed">
                  {card.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
