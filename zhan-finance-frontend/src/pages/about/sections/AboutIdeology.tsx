import { Target } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { useTranslation } from 'react-i18next';

export function AboutIdeology() {
  const { t } = useTranslation('common');
  return (
    <Section className="bg-brand-beige text-brand-green border-t border-brand-green/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-3">
          <Target className="h-4 w-4" />
          {t('about.ideology.badge', { defaultValue: 'Наша идеология' })}
        </div>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-5">
          {t('about.ideology.title', { defaultValue: 'Бизнес должен зарабатывать, а не обслуживать налоги' })}
        </h2>
        <div className="text-lg md:text-xl leading-relaxed text-brand-green/80 space-y-4">
          <p>{t('about.ideology.p1', { defaultValue: 'К нам часто приходят компании, чья бухгалтерия находилась в состоянии перманентного хаоса: утерянные ЭСФ, заблокированные счета из-за неуплаченных 100 тенге пени, дубли в номенклатуре, из-за которых себестоимость считается неверно, и огромные переплаты по КПН.' })}</p>
          <p>{t('about.ideology.p2', { defaultValue: 'Проблема штатной бухгалтерии зачастую кроется в отсутствии системы двойного контроля и технологического стэка. Один человек не может одинаково хорошо знать ВЭД, сложные производственные начисления, тонкости валютного контроля и IT-интеграции.' })}</p>
          <p>{t('about.ideology.p3', { defaultValue: 'Наше решение — это разделение труда. Первичку обрабатывают операторы (быстро и точно). Зарплату считает отдельный расчетчик (без ошибок в отпускных). Налоги планирует методолог. А руководит процессом финансовый архитектор. Вы получаете целый департамент по цене одного штатного специалиста.' })}</p>
          <p className="pt-2 font-medium text-brand-green">{t('about.ideology.p4', { defaultValue: 'Мы относимся к финансовым данным как к критическому активу (Master Data Management). Внедряем строгие политики ввода справочников и номенклатуры, исключая "мусор" в базах. Все процессы задокументированы, роли распределены. Замена сотрудника внутри нашей команды проходит абсолютно незаметно для клиента.' })}</p>
        </div>
      </div>
    </Section>
  );
}
