import { motion } from 'framer-motion';
import { pricingPlans } from '@/shared/config/content/pricing-plans';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export function PricingTable() {
  const { t } = useTranslation('landing');
  return (
    <div className="w-full">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pricingPlans.map((plan) => (
          <motion.div
            key={plan.titleKey}
            className={`p-8 rounded-[32px] flex flex-col justify-between transition-all relative ${
              plan.highlighted
                ? 'bg-white text-brand-green border-2 border-brand-green shadow-xl'
                : 'bg-white/95 text-brand-green border border-brand-green/10 hover:border-brand-green/30 shadow-sm'
            }`}
            whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(67,133,86,0.12)' }}
            transition={{ duration: 0.2 }}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-brand-beige text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
                Популярный
              </span>
            )}
            <div>
              <h4 className="text-2xl font-black uppercase tracking-tight mb-1">{t(plan.titleKey)}</h4>
              <p className="text-xs text-brand-green/70 mb-6 min-h-[32px] leading-relaxed">{t(plan.subtitleKey)}</p>
              <div className="text-3xl font-black text-brand-green mb-6 pb-6 border-b border-brand-green/10">
                {t(plan.priceKey)}
              </div>
              <ul className="text-sm space-y-3 mb-8 text-brand-green/80">
                {plan.featuresKeys.map((fKey) => (
                  <li key={fKey} className="flex items-start gap-2.5 leading-snug">
                    <Check className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <span>{t(fKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className={`w-full py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all ${
                plan.highlighted
                  ? 'bg-brand-green text-brand-beige hover:bg-brand-green/90 shadow-md'
                  : 'bg-brand-green/5 text-brand-green hover:bg-brand-green hover:text-brand-beige border border-brand-green/15'
              }`}
            >
              Выбрать тариф
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
