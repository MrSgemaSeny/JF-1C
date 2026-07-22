import { Clock, Users, BarChart, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Stat {
  valueKey: string;
  labelKey: string;
}

export interface StatWithIcon extends Stat {
  icon: LucideIcon;
  descKey: string;
}

/** Stats shown on the Trust widget (homepage) */
export const trustStats: Stat[] = [
  { valueKey: 'landing:stats.trust.0.value', labelKey: 'landing:stats.trust.0.label' },
  { valueKey: 'landing:stats.trust.1.value', labelKey: 'landing:stats.trust.1.label' },
  { valueKey: 'landing:stats.trust.2.value', labelKey: 'landing:stats.trust.2.label' },
];

/** Stats shown on the About page */
export const aboutStats: StatWithIcon[] = [
  {
    icon: Clock,
    valueKey: 'landing:stats.about.0.value',
    labelKey: 'landing:stats.about.0.label',
    descKey: 'landing:stats.about.0.desc',
  },
  {
    icon: Users,
    valueKey: 'landing:stats.about.1.value',
    labelKey: 'landing:stats.about.1.label',
    descKey: 'landing:stats.about.1.desc',
  },
  {
    icon: BarChart,
    valueKey: 'landing:stats.about.2.value',
    labelKey: 'landing:stats.about.2.label',
    descKey: 'landing:stats.about.2.desc',
  },
  {
    icon: ShieldCheck,
    valueKey: 'landing:stats.about.3.value',
    labelKey: 'landing:stats.about.3.label',
    descKey: 'landing:stats.about.3.desc',
  },
];
