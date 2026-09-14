import { motion } from 'framer-motion';
import { ShieldCheck, TrendingDown, Users, Cpu, CheckCircle2 } from 'lucide-react';
import { Section } from '@/shared/ui/Section';
import { Container } from '@/shared/ui/Container';

export function WhyOutsource() {
  const benefits = [
    {
      icon: TrendingDown,
      title: 'Экономия до 60% бюджета',
      text: 'Никаких налогов с зарплаты штатного бухгалтера (ОПВ, СО, ВОСМС, ИПН), затрат на рабочее место, мебель, ПК и подписки на 1С.',
    },
    {
      icon: ShieldCheck,
      title: '100% материальная ответственность',
      text: 'В отличие от наемного сотрудника, мы несем полную финансовую ответственность по договору SLA. Штрафы по нашей вине компенсируем мы.',
    },
    {
      icon: Users,
      title: 'Непрерывность 365 дней в году',
      text: 'Никаких внезапных увольнений, больничных и отпусков перед сдачей отчетности. С вами работает слаженная команда экспертов.',
    },
    {
      icon: Cpu,
      title: 'Автоматизация и порядок в 1С',
      text: 'Прямая интеграция с банками Казахстана, кабинетом налогоплательщика и ЭСФ. Прозрачные данные и порядок в учете 24/7.',
    },
  ];

  const includedItems = [
    'Обработка первичных документов (акты, накладные, счета-фактуры)',
    'Сдача всех налоговых и статистических форм (910.00, 200.00, 300.00, 100.00)',
    'Кадровый учет: трудовые договоры, приказы, табели, расчет зарплаты и отпускных',
    'Выписка, прием и строгий контроль ЭСФ, СНТ и Виртуального склада',
    'Ежедневный мониторинг лицевого счета в КГД и контроль налоговой задолженности',
    'Защита интересов компании при камеральном контроле и налоговых проверках',
  ];

  return (
    <Section className="bg-white text-brand-green py-24 sm:py-32 relative overflow-hidden">
      <Container className="relative z-10">
        {/* Header Block */}
        <div className="max-w-4xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/5 border border-brand-green/10 text-xs font-bold uppercase tracking-widest text-brand-green mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-green" />
            Безупречный учет
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[1.1] tracking-tight text-brand-green mb-8">
            Надежная бухгалтерия <br />
            <span className="text-brand-green/40">без штатных рисков</span>
          </h2>

          <p className="text-xl text-brand-green/80 font-medium leading-relaxed">
            Передача бухгалтерии на аутсорсинг в ЖАН FINANCE — это не просто экономия на налогах и зарплате. Это гарантия непрерывной работы, профессиональной защиты при проверках и полной материальной ответственности.
          </p>
        </div>

        {/* 4 Cards: Why Outsource */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-brand-beige/40 border border-brand-green/10 p-8 rounded-[32px] hover:bg-brand-beige/70 hover:border-brand-green/25 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/15 flex items-center justify-center text-brand-green mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase text-brand-green mb-3 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-sm text-brand-green/75 leading-relaxed">
                    {b.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* What is included in Outsource */}
        <div className="bg-brand-beige text-brand-green rounded-[36px] p-8 sm:p-12 lg:p-16 border border-brand-green/10 shadow-xl">
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
      </Container>
    </Section>
  );
}
