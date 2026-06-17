import { Header } from '@/widgets/header/Header';
import { Footer } from '@/widgets/footer/Footer';
import { Section } from '@/shared/ui/Section';
import { PricingTable } from '@/widgets/pricing-table/PricingTable';
import { ServicesHero } from './sections/ServicesHero';
import { ServicesCatalog } from './sections/ServicesCatalog';
import { ServicesFaqContact } from './sections/ServicesFaqContact';

export function ServicesPage() {
  return (
    <>
      <Header />
      <main>
        <ServicesHero />

        {/* How we work */}
        <Section className="bg-brand-beige pt-28 pb-12">
          <h3 className="text-3xl font-black text-brand-green mb-6">Как мы работаем</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Срочные отчёты за 15 минут',   text: 'Экстренные данные готовы мгновенно, чтобы вы могли оперативно принять решение.' },
              { title: 'Средний срок 1–3 рабочих дня', text: 'Большинство задач закрываем в течение трёх рабочих дней без потери качества.' },
              { title: 'Заказы принимаем 09:00–16:00', text: 'Работаем по удобному графику, чтобы вы точно знали, когда ждать подтверждение.' },
              { title: 'Контроль качества до сдачи',   text: 'Каждый отчёт проверяется внутри команды перед подачей в контролирующие органы.' },
              { title: 'Менеджер на связи',             text: 'Персональный менеджер ведёт задачу и отвечает на все вопросы во время работы.' },
              { title: 'Консультация после результата', text: 'Обсуждаем итоговую отчётность и рекомендации без дополнительной платы.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-green/10">
                <h4 className="font-black text-lg mb-2">{item.title}</h4>
                <p className="text-brand-green/70">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <ServicesCatalog />

        {/* Why accounting matters */}
        <Section className="bg-brand-beige pt-28 pb-12">
          <div className="rounded-[32px] bg-brand-beige p-8 border border-brand-green/10 shadow-sm">
            <h3 className="text-3xl font-black text-brand-green mb-4">Зачем нужны бухгалтерские услуги и подписка?</h3>
            <p className="text-lg text-brand-green/80 leading-relaxed mb-6">
              Профессиональное ведение бухгалтерии освобождает вас от рутинных задач, снижает риски штрафов и позволяет сосредоточиться на росте бизнеса.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Контроль без стресса',    text: 'Все цифры в одном месте, без рисков потерять документы или сделать ошибку.' },
                { title: 'Экономия времени',         text: 'Мы ведём отчётность, вы принимаете решения на основе готовых данных.' },
                { title: 'Гарантия регулярности',   text: 'Подписка гарантирует, что отчёты, декларации и консультации идут по плану.' },
              ].map((c) => (
                <div key={c.title} className="rounded-3xl bg-white p-5 border border-brand-green/10">
                  <h4 className="text-xl font-bold text-brand-green mb-2">{c.title}</h4>
                  <p className="text-brand-green/70 text-sm">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Pricing */}
        <Section className="bg-brand-green pt-28 pb-12">
          <PricingTable />
        </Section>

        <ServicesFaqContact />
      </main>
      <Footer />
    </>
  );
}
