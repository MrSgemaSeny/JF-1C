import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { trustStats } from '@/entities/stat';

export function Trust() {
  return (
    <div className="bg-white py-24 overflow-hidden border-t border-brand-green/10">
      <Section className="!py-0">
        <div className="grid md:grid-cols-3 gap-12 text-center mb-24">
          {trustStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-6xl lg:text-8xl font-black text-brand-green tracking-tighter mb-4">
                {stat.value}
              </div>
              <div className="text-xl uppercase tracking-widest text-brand-green/70 font-bold">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Infinite Marquee */}
      <div className="flex whitespace-nowrap overflow-hidden py-8 bg-brand-green/5 border-y border-brand-green/10">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ x: { repeat: Infinity, repeatType: 'loop', duration: 20, ease: 'linear' } }}
          className="flex items-center gap-16 text-4xl lg:text-5xl font-black uppercase tracking-widest text-brand-green"
        >
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex items-center gap-16">
              <span>ТОО &quot;Alpha&quot;</span>
              <span className="text-brand-green">•</span>
              <span>ИП &quot;Омега&quot;</span>
              <span className="text-brand-green">•</span>
              <span>Stroy Group</span>
              <span className="text-brand-green">•</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
