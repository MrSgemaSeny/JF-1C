import type { LucideIcon } from 'lucide-react';
import { Clock, Users, BarChart, ShieldCheck } from 'lucide-react';

export interface Stat {
  value: string;
  label: string;
}

export interface StatWithIcon extends Stat {
  icon: LucideIcon;
  description: string;
}

/** Stats shown on the Trust widget (homepage) */
export const trustStats: Stat[] = [
  { value: '12+',        label: 'Лет на рынке' },
  { value: '350+',       label: 'Довольных клиентов' },
  { value: '2 млрд ₸',  label: 'Сэкономлено тенге' },
];

/** Stats shown on the About page */
export const aboutStats: StatWithIcon[] = [
  {
    icon: Clock,
    value: '12+',
    label: 'лет на рынке',
    description: 'Больше десятилетия непрерывной практики в условиях постоянно меняющегося законодательства РК.',
  },
  {
    icon: Users,
    value: '350+',
    label: 'клиентов на обслуживании',
    description: 'Малый и средний бизнес в сферах IT, строительства, логистики, производства и e-commerce.',
  },
  {
    icon: BarChart,
    value: '2 млрд ₸',
    label: 'сэкономлено клиентам',
    description: 'За счет легальной налоговой оптимизации, возвратов НДС, аудита переплат и предотвращения штрафов.',
  },
  {
    icon: ShieldCheck,
    value: '100%',
    label: 'финансовая гарантия',
    description: 'Наша ответственность закреплена договором SLA. Мы возмещаем пени и штрафы, возникшие по нашей вине.',
  },
];
