import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { mockServices } from '@/entities/service';

export function Services() {
  return (
    <Section className="bg-brand-beige border-t border-brand-green/10" id="services">
      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-brand-green" />
          Наши Услуги
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-black uppercase tracking-tight text-brand-green"
        >
          Всё для вашего <br />
          <span className="text-brand-green">учета и налогов</span>
        </motion.h2>
      </div>

      <div className="flex flex-col gap-6">
        {mockServices.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-8 lg:p-12 overflow-hidden"
          >
            <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4">
                <h3 className="text-2xl lg:text-3xl font-bold uppercase mb-3">{service.title}</h3>
                <div className="text-xl font-black text-brand-green">{service.price}</div>
              </div>
              <div className="lg:col-span-8">
                <p className="text-lg font-medium text-brand-green/70 mb-3 max-w-2xl">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {service.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-brand-green text-brand-beige rounded-lg text-sm font-bold uppercase tracking-wider shadow-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
