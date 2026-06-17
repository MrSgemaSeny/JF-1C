import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { Container } from '@/shared/ui/Container';
import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { BookOpen, Target, Briefcase, ShieldCheck } from 'lucide-react';
import { aboutStats } from '@/entities/stat';

export function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <div className="bg-brand-green pt-32 pb-24 text-brand-beige relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <Container className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-beige/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-brand-beige/80">
                <BookOpen className="h-4 w-4" />
                О компании
              </div>
              <h1 className="mt-6 text-5xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight">
                Машинная точность
                <span className="block text-brand-beige/75">и финансовая инженерия</span>
              </h1>
              <p className="mt-10 max-w-4xl text-lg md:text-2xl leading-relaxed text-brand-beige/85">
                Бухгалтерия давно перестала быть просто перекладыванием бумажек и вводом накладных. Сегодня это сложная инженерная система, от правильной архитектуры которой зависит выживаемость бизнеса, его способность привлекать инвестиции и проходить налоговые проверки.
              </p>
            </motion.div>
          </Container>
        </div>

        {/* Stats */}
        <Section className="bg-white text-brand-green border-t border-brand-green/10">
          <div className="max-w-6xl mx-auto space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-4">В цифрах и фактах</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {aboutStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-3xl border border-brand-green/10 bg-brand-beige p-6 shadow-lg shadow-brand-green/5 relative overflow-hidden group hover:-translate-y-1 transition-transform"
                  >
                    <Icon className="h-8 w-8 text-brand-green/30 absolute top-6 right-6 group-hover:scale-110 transition-transform" />
                    <h2 className="text-4xl lg:text-5xl font-black uppercase leading-none tracking-tighter">{stat.value}</h2>
                    <p className="mt-4 text-sm font-bold uppercase tracking-[0.1em] text-brand-green/70">{stat.label}</p>
                    <p className="mt-3 text-brand-green/80 text-sm leading-relaxed">{stat.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Ideology */}
        <Section className="bg-brand-beige text-brand-green border-t border-brand-green/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-3">
              <Target className="h-4 w-4" />
              Наша идеология
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-5">
              Бизнес должен зарабатывать, а не обслуживать налоги
            </h2>
            <div className="text-lg md:text-xl leading-relaxed text-brand-green/80 space-y-4">
              <p>К нам часто приходят компании, чья бухгалтерия находилась в состоянии перманентного хаоса: утерянные ЭСФ, заблокированные счета из-за неуплаченных 100 тенге пени, дубли в номенклатуре, из-за которых себестоимость считается неверно, и огромные переплаты по КПН.</p>
              <p>Проблема штатной бухгалтерии зачастую кроется в отсутствии системы двойного контроля и технологического стэка. Один человек не может одинаково хорошо знать ВЭД, сложные производственные начисления, тонкости валютного контроля и IT-интеграции.</p>
              <p>Наше решение — это разделение труда. Первичку обрабатывают операторы (быстро и точно). Зарплату считает отдельный расчетчик (без ошибок в отпускных). Налоги планирует методолог. А руководит процессом финансовый архитектор. Вы получаете целый департамент по цене одного штатного специалиста.</p>
              <p className="pt-2 font-medium text-brand-green">Мы относимся к финансовым данным как к критическому активу (Master Data Management). Внедряем строгие политики ввода справочников и номенклатуры, исключая &quot;мусор&quot; в базах. Все процессы задокументированы, роли распределены. Замена сотрудника внутри нашей команды проходит абсолютно незаметно для клиента.</p>
            </div>
          </div>
        </Section>

        {/* Process */}
        <Section className="bg-white text-brand-green border-t border-brand-green/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-brand-green/60 font-bold tracking-widest uppercase text-sm mb-3">
              <Briefcase className="h-4 w-4" />
              Инженерный подход
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-5">Как мы перестраиваем учет</h2>
            <div className="space-y-6 text-lg leading-relaxed text-brand-green/80">
              {[
                { n: '1', title: 'Аудит и реверс-инжиниринг', text: 'Мы не просто &quot;подхватываем&quot; базу. Мы проводим глубокий технический аудит: проверяем целостность данных в 1С, выявляем разрывы в цепочках документов, анализируем регистры налогового и бухгалтерского учета. Мы находим скрытые налоговые риски, зависшие остатки и некорректные проводки.' },
                { n: '2', title: 'Нормализация данных', text: 'Подобно рефакторингу кода, мы перестраиваем финансовую архитектуру. Восстанавливаем утраченные документы, сводим сальдо, исправляем дублирующихся контрагентов. Создаем чистую эталонную базу, где каждый тенге имеет подтверждение.' },
                { n: '3', title: 'Автоматизация контуров', text: 'Мы интегрируем 1С с клиент-банками, CRM-системами, системами ЭСФ и виртуальными складами. Настраиваем автоматические загрузки выписок, парсинг данных и маршрутизацию документов. Это исключает ручной ввод (человеческий фактор) и радикально сокращает время на обработку.' },
                { n: '4', title: 'Непрерывный мониторинг (SLA)', text: 'Работа переходит в стадию регламентного обслуживания. За вами закрепляется профильная команда. Вы получаете прозрачную отчетность, где видно текущую налоговую нагрузку, статус сдачи деклараций и план платежей. Каждое наше действие строго подчинено внутреннему регламенту.' },
              ].map((step) => (
                <div key={step.n}>
                  <h3 className="text-2xl font-black uppercase text-brand-green mb-1">{step.n}. {step.title}</h3>
                  <p dangerouslySetInnerHTML={{ __html: step.text }} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Guarantees */}
        <Section className="bg-brand-green text-brand-beige border-t border-brand-green/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-brand-beige/70 font-bold tracking-widest uppercase text-sm mb-3">
              <ShieldCheck className="h-4 w-4" />
              Ответственность
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.1] mb-5">
              Гарантии, закрепленные юридически
            </h2>
            <div className="text-lg md:text-xl leading-relaxed text-brand-beige/80 space-y-4">
              <p>Слова &quot;мы профессионалы&quot; ничего не стоят без финансовой ответственности. Наша уверенность в своих процессах позволяет нам брать на себя 100% материальных рисков.</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Финансовая безопасность:</strong> Полная компенсация штрафов и пеней, если они возникли из-за нашей ошибки.</li>
                <li><strong>Конфиденциальность (NDA):</strong> Строгий режим коммерческой тайны. Шифрованные каналы связи и защищенные серверы.</li>
                <li><strong>Непрерывность бизнеса:</strong> Никаких больничных, отпусков или внезапных увольнений. Сервис работает непрерывно.</li>
                <li><strong>Прозрачность цены:</strong> Вы платите за объем операций и сложность контура. Никаких скрытых платежей.</li>
              </ul>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
