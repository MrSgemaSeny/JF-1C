import { motion } from 'framer-motion';
import { pricingPlans } from '@/shared/config/content/pricing-plans';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export function PricingTable() {
  const { t } = useTranslation('landing');
  return (
    <div className="w-full">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {pricingPlans.map((plan) => (
          <motion.div
            key={plan.titleKey}
            className={`p-6 rounded-2xl flex flex-col justify-between transition-all ${
              plan.highlighted
                ? 'bg-white text-brand-green border-2 border-brand-green shadow-lg'
                : 'bg-white text-brand-green border border-brand-green/10 hover:border-brand-green/30 shadow-sm'
            }`}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xl font-black uppercase tracking-tight">{t(plan.titleKey)}</h4>
                {plan.highlighted && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-brand-green text-brand-beige px-2.5 py-0.5 rounded-full">
                    {t('pricing_hit', { defaultValue: 'Хит' })}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-green/70 mb-3 min-h-[28px] leading-snug">{t(plan.subtitleKey)}</p>
              <div className="text-2xl font-black text-brand-green mb-4 pb-3 border-b border-brand-green/10">
                {t(plan.priceKey)}
              </div>
              <ul className="text-xs space-y-2 mb-6 text-brand-green/80">
                {plan.featuresKeys.map((fKey) => (
                  <li key={fKey} className="flex items-start gap-2 leading-snug">
                    <Check className="w-3.5 h-3.5 text-brand-green shrink-0 mt-0.5" />
                    <span>{t(fKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => (document.getElementById('contact') || document.getElementById('footer'))?.scrollIntoView({ behavior: 'smooth' })}
              className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
                plan.highlighted
                  ? 'bg-brand-green text-brand-beige hover:bg-brand-green/90 shadow-md'
                  : 'bg-brand-green/5 text-brand-green hover:bg-brand-green hover:text-brand-beige border border-brand-green/15'
              }`}
            >
              {t('pricing_choose_plan', { defaultValue: 'Выбрать тариф' })}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
