import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';
import { ROUTES } from '@/shared/config/routes';
import { useApiData } from '@/shared/hooks/useApiData';
import { fetchHighlightedServices } from '@/entities/service/api/servicesApi';
import type { ServiceDto } from '@/entities/service/api/servicesApi';
import { ServiceModal } from '@/features/service-modal/ServiceModal';
import { useTranslation, Trans } from 'react-i18next';

const includedItems = [
  'Обработка первичных документов (акты, накладные, счета-фактуры)',
  'Сдача всех налоговых и статистических форм (910.00, 200.00, 300.00, 100.00)',
  'Кадровый учет: трудовые договоры, приказы, табели, расчет зарплаты и отпускных',
  'Выписка, прием и строгий контроль ЭСФ, СНТ и Виртуального склада',
  'Ежедневный мониторинг лицевого счета в КГД и контроль налоговой задолженности',
  'Защита интересов компании при камеральном контроле и налоговых проверках',
];

export function HomeServices() {
  const { t } = useTranslation('common');
  const { data: services, isLoading } = useApiData(fetchHighlightedServices);
  const [selectedService, setSelectedService] = useState<ServiceDto | null>(null);

  return (
    <Section className="bg-white py-32 relative">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green mb-6">
              <Trans i18nKey="homeServices.title" ns="common" components={{ br: <br />, 1: <span className="text-brand-green/40" /> }} />
            </h2>
            <p className="text-xl text-brand-green/80 font-medium leading-relaxed">
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
              onClick={() => setSelectedService(service)}
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
                  {t('homeServices.more')} <ArrowRight className="w-4 h-4" />
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

        {/* What is included in Outsource */}
        <div className="mt-16 bg-brand-beige text-brand-green rounded-[36px] p-8 sm:p-12 lg:p-16 border border-brand-green/10 shadow-xl">
          <div className="max-w-3xl mb-10">
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-4">
              Что входит в аутсорс-бухгалтерию
            </h3>
            <p className="text-lg text-brand-green/80 font-medium leading-relaxed">
              Полный спектр регулярных работ для ведения финансового и налогового учета вашего бизнеса без скрытых доплат:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {includedItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border border-brand-green/10 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <CheckCircle2 className="w-6 h-6 text-brand-green shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-brand-green/90 leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-brand-green/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-green/70 text-center sm:text-left">
              Нужен расчет под ваш оборот и количество операций?
            </p>
            <button
              onClick={() => (document.getElementById('contact') || document.getElementById('footer'))?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-brand-green text-brand-beige rounded-2xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all text-sm whitespace-nowrap shadow-lg shadow-brand-green/20 hover:-translate-y-0.5"
            >
              Получить консультацию
            </button>
          </div>
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link
            to={ROUTES.SERVICES}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 border-brand-green text-brand-green font-bold uppercase tracking-wider hover:bg-brand-green hover:text-brand-beige transition-all"
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
