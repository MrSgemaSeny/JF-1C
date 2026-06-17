import { useState, useEffect } from 'react';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { Container } from '@/shared/ui/Container';
import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { servicesList } from '@/entities/service';
import { ServiceModal } from '@/features/service-modal';
import type { Service } from '@/entities/service';

const faqs = [
  { q: 'Как начать работу?',           a: 'Оставьте заявку на сайте или позвоните — мы подготовим план внедрения и оценку стоимости.' },
  { q: 'Какие документы понадобятся?', a: 'Зависит от услуги: обычно нужны договор, выписки, договоры с контрагентами и первичная документация.' },
  { q: 'Можно ли подключить удалённо?',a: 'Да — большинство процессов можно организовать дистанционно с использованием защищённых каналов.' },
];

const pricing = [
  {
    title: 'Старт',
    subtitle: 'Базовый набор для новых ИП',
    price: 'от 49 000 ₸/мес',
    features: ['Ведение учёта', 'Ежемесячная отчётность', 'Консультации по телефону'],
    highlighted: false,
  },
  {
    title: 'Бизнес',
    subtitle: 'Оптимальный пакет для малого бизнеса',
    price: 'от 149 000 ₸/мес',
    features: ['Полное сопровождение бухгалтерии', 'Налоговое планирование', 'Поддержка при проверках'],
    highlighted: true,
  },
  {
    title: 'Премиум',
    subtitle: 'Персональный подход и приоритетная поддержка',
    price: 'Индивидуально',
    features: ['Персональный менеджер', 'Юридическая защита', 'Аудит и оптимизация'],
    highlighted: false,
  },
];

export function ServicesPage() {
  const [active, setActive] = useState<Service | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActive(null); };
    document.body.style.overflow = active ? 'hidden' : '';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [active]);

  return (
    <>
      <Header />

      {/* Page hero */}
      <div className="w-full bg-brand-green text-brand-beige pt-28 pb-20">
        <Container>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7">
                <h1 className="text-6xl font-black text-brand-beige leading-tight mb-4">Наши услуги</h1>
                <p className="text-2xl text-brand-beige/90 max-w-3xl mb-6">
                  Полный учёт операций, составление отчетности, контроль финансов — всё в одном месте.
                </p>
                <a href="#services-list" className="inline-block mt-4 px-6 py-3 bg-brand-beige text-brand-green rounded-full font-bold">
                  Смотреть услуги
                </a>
              </div>
            </div>
          </motion.div>
        </Container>
      </div>

      <main>
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
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-black text-lg mb-2">{item.title}</h4>
                <p className="text-brand-green/70">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Services list */}
        <Section id="services-list" className="bg-brand-green pt-28 pb-12">
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {servicesList.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.02, boxShadow: '0 24px 48px rgba(67,133,86,0.15)' }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25, delay: i * 0.06 }}
                viewport={{ once: true }}
                role="button"
                tabIndex={0}
                onClick={() => setActive(s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(s); } }}
                className="flex gap-6 bg-white rounded-2xl p-6 items-start shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-green border border-brand-green/20 hover:border-brand-green/60 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-brand-green mb-2">{s.title}</h4>
                  <p className="text-lg text-brand-green/70 mb-3">{s.description}</p>
                  <ul className="text-base text-brand-green/60 space-y-2 mb-4">
                    {(s.bullets ?? s.features).map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="w-2 h-2 mt-2 rounded-full bg-brand-green shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActive(s); }}
                      className="px-4 py-2 border border-brand-green text-brand-green rounded-full text-sm"
                    >
                      Подробнее
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

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
          <div className="mt-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-brand-beige rounded-2xl p-8 text-brand-green"
            >
              <div className="grid md:grid-cols-3 gap-6">
                {pricing.map((plan) => (
                  <motion.div
                    key={plan.title}
                    className={`p-6 rounded-xl ${plan.highlighted ? 'bg-brand-beige/5 border-2 border-brand-green/30' : 'bg-brand-beige/5'}`}
                    whileHover={{ scale: 1.05, y: -6, boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <h4 className="text-2xl font-black">{plan.title}</h4>
                    <p className="text-sm text-brand-green/80 mb-4">{plan.subtitle}</p>
                    <div className="text-3xl font-black mb-4">{plan.price}</div>
                    <ul className="text-sm space-y-2 text-brand-green/80">
                      {plan.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </Section>

        {/* FAQ + Contact */}
        <Section className="bg-brand-beige pt-28 pb-12">
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div className="bg-brand-beige rounded-[32px] p-8 shadow-lg border border-brand-green/10">
              <h3 className="text-3xl font-black text-brand-green mb-6">Часто задаваемые вопросы</h3>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <details key={i} className="rounded-3xl border border-brand-green/10 bg-brand-beige/90 p-5 shadow-sm">
                    <summary className="cursor-pointer font-bold text-brand-green text-lg">{f.q}</summary>
                    <p className="mt-3 text-brand-green/70 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="bg-brand-beige rounded-[32px] p-8 shadow-lg border border-brand-green/10">
              <h3 className="text-2xl font-black text-brand-green mb-3">Готовы обсудить задачу?</h3>
              <p className="text-brand-green/90 mb-6 leading-relaxed">Оставьте заявку — перезвоним и подготовим коммерческое предложение.</p>
              <form className="space-y-4">
                <input className="w-full p-4 rounded-3xl border border-brand-green/10 bg-white text-brand-green placeholder-brand-green/50" placeholder="Имя" />
                <input className="w-full p-4 rounded-3xl border border-brand-green/10 bg-white text-brand-green placeholder-brand-green/50" placeholder="Телефон или e-mail" />
                <textarea className="w-full p-4 rounded-3xl border border-brand-green/10 bg-white text-brand-green placeholder-brand-green/50" placeholder="Краткое описание задачи" rows={4} />
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button type="button" className="w-full rounded-3xl bg-brand-green px-6 py-4 text-sm font-bold text-brand-beige transition hover:bg-brand-green/90">Отправить</button>
                  <button type="button" className="w-full rounded-3xl border border-brand-green text-brand-green px-6 py-4 transition hover:bg-brand-green/5">Позвоните мне</button>
                </div>
              </form>
            </div>
          </div>
        </Section>

        {active && <ServiceModal item={active} onClose={() => setActive(null)} />}
      </main>
      <Footer />
    </>
  );
}
