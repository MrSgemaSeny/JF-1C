import { Container } from '@/shared/ui/Container';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export function AboutHero() {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-beige/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-brand-beige/80">
            <BookOpen className="h-4 w-4" />
            О компании
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight">
            Машинная точность
            <span className="block text-brand-beige/75">и финансовая инженерия</span>
          </h1>
          <p className="mt-10 max-w-4xl text-lg md:text-2xl leading-relaxed text-brand-beige/85">
            Бухгалтерия давно перестала быть просто перекладыванием бумажек и вводом накладных. Сегодня это сложная инженерная система, от правильной архитектуры которой зависит выживаемость бизнеса, его способность привлекать инвестиции и проходить налоговые проверки.
          </p>
        </motion.div>
      </Container>
    </div>
  );
}
