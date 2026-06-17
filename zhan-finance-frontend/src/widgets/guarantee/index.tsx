import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import logoZf from '@/shared/assets/icons/logo-zf.jpg';

export function Guarantee() {
  return (
    <Section className="bg-brand-green text-brand-beige py-24" id="guarantee">
      <div className="mx-auto flex max-w-7xl justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="w-full max-w-[420px]"
        >
          <div className="aspect-square overflow-hidden rounded-[32px] border border-brand-beige/20 bg-brand-beige/5 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <img
              src={logoZf}
              alt="ZF logo"
              className="h-full w-full rounded-[24px] object-contain bg-brand-beige"
            />
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
