import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { trustStats } from '@/shared/config/content/stats';

export function Trust() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <Section className="bg-brand-green py-32 text-brand-beige overflow-hidden relative" ref={containerRef}>
      {/* Decorative background typography */}
      <motion.div style={{ y }} className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
        <span className="text-[20vw] font-black leading-none whitespace-nowrap">TRUST & EXPERTISE</span>
      </motion.div>

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight">
              Ваш бизнес <br />
              <span className="text-brand-beige/50">под надежной защитой</span>
            </h2>
            <p className="text-xl text-brand-beige/80 leading-relaxed max-w-xl">
              Мы берем на себя полную финансовую ответственность за результаты нашей работы. Наши клиенты не платят штрафы за ошибки в учете.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {trustStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1, type: 'spring', bounce: 0.4 }}
                viewport={{ once: true, margin: '-50px' }}
                className={`p-8 rounded-[32px] ${
                  i === 0 
                    ? 'bg-brand-beige text-brand-green sm:col-span-2 sm:p-12' 
                    : 'bg-white/5 border border-white/10 backdrop-blur-md'
                }`}
              >
                <div className={`text-5xl lg:text-6xl font-black mb-4 ${i === 0 ? 'text-brand-green' : 'text-brand-beige'}`}>
                  {stat.value}
                </div>
                <div className={`text-sm font-bold uppercase tracking-widest ${i === 0 ? 'text-brand-green/70' : 'text-brand-beige/60'}`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
