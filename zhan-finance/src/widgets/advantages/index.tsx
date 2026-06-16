import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { Shield, Clock, Lock, TrendingUp } from 'lucide-react';

export function Advantages() {
  return (
    <Section className="bg-brand-beige" id="advantages">
      <div className="mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-black uppercase tracking-tight text-brand-green max-w-3xl"
        >
          Глубокий подход к вашей безопасности
        </motion.h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:col-span-2 bg-brand-green text-brand-beige p-10 rounded-2xl flex flex-col justify-between shadow-xl shadow-brand-green/10"
        >
          <Shield className="w-12 h-12 text-brand-beige mb-8" />
          <div>
            <h3 className="text-2xl font-bold mb-4 uppercase">Ответственность по договору</h3>
            <p className="text-brand-beige/80 text-lg max-w-lg leading-relaxed">
              Мы берем на себя полную финансовую ответственность за любые штрафы по нашей вине. Ваш бизнес защищен на 100%.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-brand-green/5 border border-brand-green/10 p-8 rounded-2xl flex flex-col justify-center shadow-lg shadow-brand-green/5"
        >
          <Lock className="w-10 h-10 text-brand-green mb-6" />
          <h3 className="text-lg font-bold mb-2 text-brand-green uppercase">Конфиденциально</h3>
          <p className="text-brand-green/70">Ваши данные хранятся на защищенных серверах.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-brand-green text-brand-beige p-8 rounded-2xl flex flex-col justify-center shadow-xl shadow-brand-green/10"
        >
          <Clock className="w-10 h-10 text-brand-beige mb-6" />
          <h3 className="text-lg font-bold mb-2 uppercase">Всегда на связи</h3>
          <p className="text-brand-beige/80">Ответим на срочный вопрос в течение 15 минут.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2 bg-brand-green/5 border border-brand-green/10 p-10 rounded-2xl flex flex-col justify-between shadow-lg shadow-brand-green/5"
        >
          <TrendingUp className="w-12 h-12 text-brand-green mb-8" />
          <div>
            <h3 className="text-2xl font-bold mb-4 text-brand-green uppercase">Законная оптимизация</h3>
            <p className="text-brand-green/80 text-lg max-w-lg leading-relaxed">
              Мы не просто считаем налоги, мы находим легальные способы их снизить и оптимизировать денежные потоки.
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
