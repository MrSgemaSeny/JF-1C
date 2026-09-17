import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { ROUTES } from '@/shared/config/routes';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchHighlightedServices } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { useTranslation, Trans } from 'react-i18next';

export function HomeServices() {
  const { t } = useTranslation('common');
  const { data: services, isLoading } = useApiData(fetchHighlightedServices);
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);

  return (
    <Section className="bg-white py-12 sm:py-24 lg:py-32 relative">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-8 mb-8 sm:mb-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green mb-2 sm:mb-6 break-words">
              <Trans i18nKey="homeServices.title" ns="common" components={{ br: <br />, 1: <span className="text-brand-green/40" /> }} />
            </h2>
            <p className="text-sm sm:text-xl text-brand-green/80 font-medium leading-relaxed">
              {t('homeServices.subtitle')}
            </p>
          </div>
          <Link
            to={ROUTES.SERVICES}
            className="hidden md:inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider hover:bg-brand-green hover:text-brand-beige transition-all group"
          >
            {t('homeServices.allServices')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green/40" />
          </div>
        ) : (() => {
          // Столбец 1: Разовые услуги (включая расчет зп, сдачу отчетов, восстановление, проверку контрагентов)
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

          // Дополняем аутсорс блоком про полный контроль и SLA, если в базе только базовые записи
          const fullOutsourceList: ServiceDto[] = [
            ...outsourceList,
            {
              id: 99,
              title: t('homeServices.sla_service_title', { defaultValue: 'Полный контроль и ответственность' }),
              description: t('homeServices.sla_service_desc', { defaultValue: '100% финансовая ответственность по договору SLA. Штрафы по нашей вине компенсируем мы.' }),
              price: t('homeServices.subscription_badge', { defaultValue: 'По подписке' }),
              imageUrl: null,
              isHighlighted: true,
              features: (t('homeServices.sla_features', { returnObjects: true }) as string[]) || [
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
              transition={{ duration: 0.4, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="bg-brand-beige/20 p-3.5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[28px] border border-brand-green/10 hover:border-brand-green/30 hover:bg-brand-beige transition-all group flex flex-col cursor-pointer justify-between shadow-sm hover:shadow-md h-full"
              onClick={() => setSelectedService(service)}
            >
              <div>
                <h3 className="text-sm sm:text-lg lg:text-2xl font-black uppercase text-brand-green mb-1.5 sm:mb-3 leading-tight line-clamp-2">
                  {t(`service.${service.id}.title`, { defaultValue: service.title })}
                </h3>
                <p className="text-[11px] sm:text-xs lg:text-sm text-brand-green/75 mb-3 sm:mb-6 leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {t(`service.${service.id}.description`, { defaultValue: service.description })}
                </p>
                <ul className="space-y-1.5 sm:space-y-2.5 mb-3 sm:mb-6">
                  {service.features.slice(0, 3).map((feature, featureIndex) => (
                    <li key={feature} className="flex items-start gap-1.5 sm:gap-2.5 text-[10px] sm:text-xs font-bold text-brand-green/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1 shrink-0 opacity-60" />
                      <span className="line-clamp-1">{t(`service.${service.id}.features.${featureIndex}`, { defaultValue: feature })}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 sm:pt-4 border-t border-brand-green/10 flex items-center justify-between gap-1 mt-auto">
                <span className="text-brand-green font-black uppercase tracking-wider text-[10px] sm:text-xs inline-flex items-center gap-1 sm:gap-2 group-hover:gap-2.5 transition-all">
                  {t('homeServices.more', { defaultValue: 'Подробнее' })} <ArrowRight className="w-3.5 h-3.5" />
                </span>
                {isOutsourceCol && (
                  <span className="text-[9px] sm:text-xs font-black text-brand-green bg-brand-green/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                    {t('homeServices.subscription_badge', { defaultValue: 'По подписке' })}
                  </span>
                )}
              </div>
            </motion.div>
          );

          return (
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">
              {/* Column 1: One-time services */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-brand-beige/20 rounded-2xl sm:rounded-[32px] border border-brand-green/10 shadow-sm">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-green text-brand-beige flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-brand-green">
                      {t('homeServices.col1_title', { defaultValue: 'Разовые услуги' })}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-brand-green/70 font-medium line-clamp-2 sm:line-clamp-none">
                      {t('homeServices.col1_desc', { defaultValue: 'Сдача отчетности, расчет зарплаты, восстановление учета и проверка контрагентов' })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-4 lg:gap-6">
                  {oneTimeList.map((service, i) => renderCard(service, i, false))}
                </div>
              </div>

              {/* Column 2: Outsource accounting */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-brand-beige/20 rounded-2xl sm:rounded-[32px] border border-brand-green/10 shadow-sm">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-green text-brand-beige flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-brand-green">
                      {t('homeServices.col2_title', { defaultValue: 'Аутсорс-бухгалтерия' })}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-brand-green/70 font-medium line-clamp-2 sm:line-clamp-none">
                      {t('homeServices.col2_desc', { defaultValue: 'Полный контроль, 100% ответственность по SLA и регулярное ведение' })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-4 lg:gap-6">
                  {fullOutsourceList.map((service, i) => renderCard(service, i, true))}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="mt-8 sm:mt-12 text-center md:hidden">
          <Link
            to={ROUTES.SERVICES}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider text-xs hover:bg-brand-green hover:text-brand-beige transition-all"
          >
            {t('homeServices.allServices')}
          </Link>
        </div>
      </Container>

      {selectedService && (
        <ServiceModal
          item={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </Section>
  );
}
