import { motion } from 'framer-motion';
import { pricingPlans } from '@/shared/config/content/pricing-plans';

export function PricingTable() {
  return (
    <div className="bg-brand-beige rounded-2xl p-8 text-brand-green">
      <div className="grid md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => (
          <motion.div
            key={plan.title}
            className={`p-6 rounded-xl ${plan.highlighted ? 'bg-brand-beige/5 border-2 border-brand-green/30' : 'bg-brand-beige/5 border border-brand-green/10'}`}
            whileHover={{ scale: 1.05, y: -6, boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h4 className="text-2xl font-black">{plan.title}</h4>
            <p className="text-sm text-brand-green/80 mb-4">{plan.subtitle}</p>
            <div className="text-3xl font-black mb-4">{plan.price}</div>
            <ul className="text-sm space-y-2 text-brand-green/80">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
