export interface BillingPlanItem {
  id: 'start' | 'standard' | 'pro' | 'corporate';
  nameKey: string;
  defaultName: string;
  descKey: string;
  defaultDesc: string;
  price: number;
  discountPrice?: number;
  featuresKeys: string[];
  highlighted?: boolean;
}

export const BILLING_PLANS: BillingPlanItem[] = [
  {
    id: 'start',
    nameKey: 'billing.plans.start.name',
    defaultName: 'Старт',
    descKey: 'billing.plans.start.desc',
    defaultDesc: 'Для ИП на упрощенке без сотрудников',
    price: 30000,
    featuresKeys: [
      'landing:pricing.0.f0',
      'landing:pricing.0.f1',
      'landing:pricing.0.f2',
      'landing:pricing.0.f3',
    ],
    highlighted: false,
  },
  {
    id: 'standard',
    nameKey: 'billing.plans.standard.name',
    defaultName: 'Стандарт',
    descKey: 'billing.plans.standard.desc',
    defaultDesc: 'Для ТОО и ИП со штатом до 5 человек',
    price: 100000,
    discountPrice: 90000,
    featuresKeys: [
      'landing:pricing.1.f0',
      'landing:pricing.1.f1',
      'landing:pricing.1.f2',
      'landing:pricing.1.f3',
    ],
    highlighted: true,
  },
  {
    id: 'pro',
    nameKey: 'billing.plans.pro.name',
    defaultName: 'Про',
    descKey: 'billing.plans.pro.desc',
    defaultDesc: 'Для ТОО на ОУР с НДС, ВЭД и маркетплейсов',
    price: 200000,
    featuresKeys: [
      'landing:pricing.2.f0',
      'landing:pricing.2.f1',
      'landing:pricing.2.f2',
      'landing:pricing.2.f3',
    ],
    highlighted: false,
  },
  {
    id: 'corporate',
    nameKey: 'billing.plans.corporate.name',
    defaultName: 'Корпоративный',
    descKey: 'billing.plans.corporate.desc',
    defaultDesc: 'Комплексный финансовый и налоговый контур',
    price: 400000,
    featuresKeys: [
      'landing:pricing.3.f0',
      'landing:pricing.3.f1',
      'landing:pricing.3.f2',
      'landing:pricing.3.f3',
    ],
    highlighted: false,
  },
];

export function getLocalizedPlanName(rawName: string | null | undefined, t: any): string {
  if (!rawName) return t('billing.defaultPlanName', 'Бухгалтерское обслуживание');
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'старт' || lower === 'start' || lower === 'бастау' || lower === '初创版' || lower === '初创') {
    return t('billing.plans.start.name', 'Старт');
  }
  if (lower === 'стандарт' || lower === 'standard' || lower === '标准版' || lower === '标准') {
    return t('billing.plans.standard.name', 'Стандарт');
  }
  if (lower === 'про' || lower === 'pro' || lower === '专业版' || lower === '专业') {
    return t('billing.plans.pro.name', 'Про');
  }
  if (lower === 'корпоративный' || lower === 'corporate' || lower === 'business' || lower === 'корпоративтік' || lower === '企业尊享版' || lower === '企业') {
    return t('billing.plans.corporate.name', 'Корпоративный');
  }
  if (lower === 'бухгалтерское обслуживание' || lower === 'bookkeeping services' || lower === 'бухгалтерлік қызмет көрсету' || lower === '财务代理记账服务') {
    return t('billing.defaultPlanName', 'Бухгалтерское обслуживание');
  }
  return rawName;
}

export function getPlanIdBySubscription(planName?: string | null, monthlyPrice?: number | null): 'start' | 'standard' | 'pro' | 'corporate' | null {
  if (monthlyPrice === 30000) return 'start';
  if (monthlyPrice === 100000 || monthlyPrice === 90000 || monthlyPrice === 45000) return 'standard';
  if (monthlyPrice === 200000) return 'pro';
  if (monthlyPrice === 400000) return 'corporate';
  if (planName) {
    const lower = planName.toLowerCase();
    if (lower.includes('старт') || lower.includes('start') || lower.includes('бастау') || lower.includes('初创')) return 'start';
    if (lower.includes('стандарт') || lower.includes('standard') || lower.includes('标准')) return 'standard';
    if (lower.includes('про') || lower.includes('pro') || lower.includes('专业')) return 'pro';
    if (lower.includes('корпор') || lower.includes('corporate') || lower.includes('business') || lower.includes('корпоратив') || lower.includes('企业')) return 'corporate';
    if (lower.includes('бухгалтер') || lower.includes('bookkeeping')) return 'standard';
  }
  return 'standard';
}
