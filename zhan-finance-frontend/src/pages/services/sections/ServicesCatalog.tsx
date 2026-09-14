import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchServices } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { useTranslation, Trans } from 'react-i18next';

export function ServicesCatalog() {
  const { t } = useTranslation('common');
  const { data: services, isLoading } = useApiData(fetchServices);
  const [active, setActive] = useState<ServiceDto | null>(null);

  return (
    <>
      <Section id="services-list" className="bg-white py-24 sm:py-32 relative">
        <div className="max-w-2xl mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green mb-6">
            <Trans i18nKey="homeServices.title" ns="common" components={{ br: <br />, 1: <span className="text-brand-green/40" /> }} />
          </h2>
          <p className="text-xl text-brand-green/80 font-medium leading-relaxed">
            {t('homeServices.subtitle', { defaultValue: 'От разовых консультаций до полного аутсорсинга бухгалтерии и кадров. Мы подберем идеальный формат работы.' })}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green/40" />
          </div>
        ) : (() => {
          const isOneTime = (s: ServiceDto) => {
            const id = Number(s.id);
            if (id === 2 || id === 3 || id === 4 || id === 6) return true;
            const title = (s.title || '').toLowerCase();
            return (
              title.includes('сдача') ||
              title.includes('кадров') ||
              title.includes('зарплат') ||
              title.includes('восстановление') ||
              title.includes('проверка') ||
              title.includes('разов')
            );
          };
          const oneTimeList = (services ?? []).filter(isOneTime);
          const outsourceList = (services ?? []).filter((s) => !isOneTime(s));

          const fullOutsourceList: ServiceDto[] = [
            ...outsourceList,
            {
              id: 99,
              title: 'Полный контроль и ответственность',
              description: '100% финансовая ответственность по договору SLA. Штрафы по нашей вине компенсируем мы.',
              price: 'По подписке',
              imageUrl: null,
              isHighlighted: true,
              features: [
                'Финансовая гарантия по SLA',
                'Контроль лицевых счетов в КГД 24/7',
                'Защита при камеральном контроле',
              ],
              createdAt: new Date().toISOString(),
            },
          ];

          const renderCard = (service: ServiceDto, i: number, isOutsourceCol: boolean) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="bg-brand-beige/20 p-8 rounded-[32px] border border-brand-green/10 hover:border-brand-green/30 hover:bg-brand-beige transition-all group flex flex-col cursor-pointer justify-between shadow-sm hover:shadow-md"
              onClick={() => setActive(service)}
            >
              <div>
                <h3 className="text-2xl font-black uppercase text-brand-green mb-3 leading-tight">
                  {t(`service.${service.id}.title`, { defaultValue: service.title })}
                </h3>
                <p className="text-sm text-brand-green/75 mb-6 leading-relaxed">
                  {t(`service.${service.id}.description`, { defaultValue: service.description })}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs font-bold text-brand-green/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1 shrink-0 opacity-60" />
                      <span>{t(`service.${service.id}.features.${featureIndex}`, { defaultValue: feature })}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-brand-green/10 flex items-center justify-between">
                <span className="text-brand-green font-black uppercase tracking-wider text-xs inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                  {t('homeServices.more', { defaultValue: 'Подробнее' })} <ArrowRight className="w-4 h-4" />
                </span>
                {isOutsourceCol && (
                  <span className="text-xs font-black text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
                    По подписке
                  </span>
                )}
              </div>
            </motion.div>
          );

          return (
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Column 1: One-time services */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-5 bg-brand-beige rounded-2xl border border-brand-green/10">
                  <div className="w-9 h-9 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-green">Разовые услуги</h3>
                    <p className="text-xs text-brand-green/70 font-medium">Сдача отчетности, расчет зарплаты, восстановление учета и проверка контрагентов</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {oneTimeList.map((service, i) => renderCard(service, i, false))}
                </div>
              </div>

              {/* Column 2: Outsource accounting */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-5 bg-brand-beige rounded-2xl border border-brand-green/10">
                  <div className="w-9 h-9 rounded-xl bg-brand-green text-brand-beige flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-green">Аутсорс-бухгалтерия</h3>
                    <p className="text-xs text-brand-green/70 font-medium">Полный контроль, 100% ответственность по SLA и регулярное ведение</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {fullOutsourceList.map((service, i) => renderCard(service, i, true))}
                </div>
              </div>
            </div>
          );
        })()}
      </Section>

      {active && (
        <ServiceModal
          item={active}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
