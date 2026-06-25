import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Section } from '@/shared/ui/Section';
import { servicesList } from '@/shared/config/content/services';
import type { Service } from '@/shared/config/content/services';
import { ServiceModal } from '@/features/service-modal/ServiceModal';

export function ServicesCatalog() {
  const [active, setActive] = useState<Service | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    document.body.style.overflow = active ? 'hidden' : '';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [active]);

  return (
    <>
      <Section id="services-list" className="bg-brand-green pt-28 pb-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {servicesList.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02, boxShadow: '0 24px 48px rgba(67,133,86,0.15)' }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25, delay: i * 0.06 }}
              viewport={{ once: true }}
              role="button"
              tabIndex={0}
              onClick={() => setActive(s)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(s); } }}
              className="flex gap-6 bg-white rounded-2xl p-6 items-start shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green border border-brand-green/20 hover:border-brand-green/60 transition-colors"
            >
              <div className="flex-1">
                <h4 className="text-2xl font-black text-brand-green mb-2">{s.title}</h4>
                <p className="text-lg text-brand-green/70 mb-3">{s.description}</p>
                <ul className="text-base text-brand-green/60 space-y-2 mb-4">
                  {(s.bullets ?? s.features).map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="w-2 h-2 mt-2 rounded-full bg-brand-green shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActive(s); }}
                    className="px-4 py-2 border border-brand-green text-brand-green rounded-full text-sm"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {active && <ServiceModal item={active} onClose={() => setActive(null)} />}
    </>
  );
}
