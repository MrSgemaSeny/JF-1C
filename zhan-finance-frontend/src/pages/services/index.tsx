import { Header } from '@/widgets/header';
import { Container } from '@/shared/ui/Container';
import { Section } from '@/shared/ui/Section';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function ServicesPage() {
  const services = [
    {
      title: 'Бухгалтерское сопровождение',
      description: 'Полный учёт операций, составление отчётности, контроль финансов.',
      bullets: ['Полный учет операций', 'Составление отчетности', 'Контроль финансов'],
      link: 'https://kenesbuh.kz/uchet',
      image: 'https://optim.tildacdn.pro/tild6239-6165-4264-b634-313536303830/-/format/webp/accounting_1.png.webp',
    },
    {
      title: 'Сдача налоговой отчетности',
      description: 'Своевременная подготовка и сдача всех обязательных форм в налоговую.',
      bullets: ['Подготовка и сдача отчетности', 'Консультации по налогам', 'Работа с налоговыми органами'],
      link: 'https://kenesbuh.kz/nalogovaya_otchetnost',
      image: 'https://optim.tildacdn.pro/tild3266-6365-4236-b038-383834656665/-/format/webp/money.png.webp',
    },
    {
      title: 'Кадровый учет и расчет зарплаты',
      description: 'Ведение кадровых документов, табелей, расчет отпускных и больничных.',
      bullets: ['Кадровые документы', 'Расчёт зарплаты', 'Табели и отпускные'],
      link: 'https://kenesbuh.kz/kadrovyi_uchet',
      image: 'https://optim.tildacdn.pro/tild3334-3663-4337-b639-356531323933/-/format/webp/support.png.webp',
    },
    {
      title: 'Восстановление бухгалтерского учета',
      description: 'Приведём в порядок документы, исправим ошибки и пересдадим отчётность.',
      bullets: ['Анализ прошлых периодов', 'Восстановление документов', 'Пересдача отчетности'],
      link: 'https://kenesbuh.kz/bs',
      image: 'https://optim.tildacdn.pro/tild3335-3266-4365-a463-313836363636/-/format/webp/approval.png.webp',
    },
    {
      title: 'Обработка первичной документации',
      description: 'Работа с актами, накладными, счетами и внутренней бухгалтерией.',
      bullets: ['Обработка актов и накладных', 'Ввод первички', 'Сверки с контрагентами'],
      link: 'https://kenesbuh.kz/obrabotka',
      image: 'https://optim.tildacdn.pro/tild3235-3237-4535-a563-353263613036/-/format/webp/paper.png.webp',
    },
    {
      title: 'Проверка и анализ контрагентов',
      description: 'Юридическая проверка надежности партнеров и клиентов до сделки.',
      bullets: ['Проверка контрагентов', 'Анализ рисков', 'Рекомендации по сотрудничеству'],
      link: 'https://kenesbuh.kz/proverka',
      image: 'https://optim.tildacdn.pro/tild3335-3266-4365-a463-313836363636/-/format/webp/approval.png.webp',
    },
  ];

  const faqs = [
    {
      q: 'Как начать работу?',
      a: 'Оставьте заявку на сайте или позвоните — мы подготовим план внедрения и оценку стоимости.',
    },
    {
      q: 'Какие документы понадобятся?',
      a: 'Зависит от услуги: обычно нужны договор, выписки, договоры с контрагентами и первичная документация.',
    },
    {
      q: 'Можно ли подключить удалённо?',
      a: 'Да — большинство процессов можно организовать дистанционно с использованием защищённых каналов.',
    },
  ];

  const [active, setActive] = useState<null | (typeof services)[0]>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    if (active) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active]);

  function ServiceModal({ item, onClose }: { item: (typeof services)[0]; onClose: () => void }) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-brand-green/10 bg-brand-beige/10 px-6 py-5">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-brand-green/70">Услуга</p>
              <h3 className="mt-2 text-3xl font-black text-brand-green">{item.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-green/20 px-4 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-green/5"
            >
              Закрыть
            </button>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            {item.image && (
              <div className="overflow-hidden rounded-[28px] bg-brand-beige/10">
                <img src={item.image} alt={item.title} className="w-full object-cover" />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <h4 className="text-xl font-black text-brand-green">Описание</h4>
                <p className="text-brand-green/75">{item.description}</p>
                <div className="rounded-[24px] border border-brand-green/10 bg-brand-green/5 p-5">
                  <h5 className="font-black text-brand-green">Что входит</h5>
                  <ul className="mt-3 space-y-2 text-brand-green/70">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-brand-green" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] bg-brand-beige/5 p-6">
                <h5 className="font-black text-brand-green">Готовы начать?</h5>
                <p className="text-brand-green/70">
                  Нажмите кнопку ниже, чтобы перейти на страницу услуги и получить персональную консультацию.
                </p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-brand-green px-5 py-3 text-sm font-bold text-brand-beige transition hover:bg-brand-green/90"
                >
                  Узнать подробнее
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Section className="bg-brand-beige pt-28 pb-12">
          <Container>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7">
                  <h1 className="text-6xl font-black text-brand-green leading-tight mb-4">Наши услуги</h1>
                  <p className="text-2xl text-brand-green/80 max-w-3xl mb-6">Полный учёт операций, составление отчетности, контроль финансов — всё в одном месте.</p>
                  <p className="text-lg text-brand-green/70 max-w-3xl">Заинтересовала конкретная услуга — кликайте «Узнать подробнее» или нажмите «Подробнее» для просмотра полного описания.</p>
                  <div className="mt-6">
                    <a
                      href="https://kenesbuh.kz/?utm_source=google&utm_medium=cpc&utm_campaign=obshee&utm_content=758525084295&utm_term=%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8%20%D0%B1%D1%83%D1%85%D0%B3%D0%B0%D0%BB%D1%82%D0%B5%D1%80%D0%B0&gad_source=1&gad_campaignid=22679896079&gbraid=0AAAAAqcnTYztCrBA46MBophJZ4wVGgGRD&gclid=CjwKCAjw6MPRBhBTEiwAd-7Mr9dzxK_M3IjqQNYRBQPbVZYA6Ni0JxyTTivVfVNLgLST-Ts-VnfGixoCEGcQAvD_BwE#popup:myform"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-4 px-6 py-3 bg-brand-green text-brand-beige rounded-full font-bold"
                    >
                      Узнать подробнее
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-brand-green text-brand-beige rounded-2xl p-8 shadow-xl">
                    <h3 className="text-3xl font-black mb-2">100% гарантия результата</h3>
                    <p className="text-sm text-brand-beige/90 mb-4">"Помогаем бизнесу экономить легально."</p>
                    <div className="mt-6">
                      <a href="/services#solution" className="inline-block px-4 py-2 bg-brand-beige text-brand-green rounded-lg font-bold">Оставить заявку</a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {services.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex gap-6 bg-white rounded-2xl p-6 items-start shadow-md"
                >
                  {s.image && (
                    <div className="w-44 h-44 flex-shrink-0 rounded-lg overflow-hidden bg-brand-beige/10">
                      <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-2xl font-black text-brand-green mb-2">{s.title}</h4>
                    <p className="text-lg text-brand-green/70 mb-3">{s.description}</p>
                    <ul className="text-base text-brand-green/60 space-y-2 mb-4">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3">
                          <span className="w-2 h-2 mt-2 rounded-full bg-brand-green" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActive(s)} className="px-4 py-2 bg-brand-green text-brand-beige rounded-full font-bold">Подробнее</button>
                      <a href={s.link} target="_blank" rel="noreferrer" className="px-4 py-2 border border-brand-green text-brand-green rounded-full">Узнать подробнее</a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16">
              <h3 className="text-3xl font-black text-brand-green mb-6">Как мы работаем</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-lg mb-2">1. Диагностика</h4>
                  <p className="text-brand-green/70">Быстрая оценка текущего состояния учета и налогов.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-lg mb-2">2. План действий</h4>
                  <p className="text-brand-green/70">Подготовим дорожную карту и предложим оптимальный пакет услуг.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-lg mb-2">3. Внедрение</h4>
                  <p className="text-brand-green/70">Берём на себя внедрение и сопровождение, вы получаете результат.</p>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <h3 className="text-3xl font-black text-brand-green mb-6">Кейсы</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h4 className="font-black mb-2">Оптимизация налогообложения для ТОО</h4>
                  <p className="text-brand-green/70">Клиент: строительная компания — снизили налоговую нагрузку на 20%.</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h4 className="font-black mb-2">Восстановление учета для ИП</h4>
                  <p className="text-brand-green/70">Восстановили учет за 2 года и пересдали отчетность без штрафов.</p>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="bg-brand-green rounded-2xl p-8 text-brand-beige">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-brand-beige/5 p-6 rounded-xl">
                    <h4 className="text-2xl font-black">Старт</h4>
                    <p className="text-sm text-brand-beige/80 mb-4">Базовый набор для новых ИП</p>
                    <div className="text-3xl font-black mb-4">от 49 000 ₸/мес</div>
                    <ul className="text-sm space-y-2 text-brand-beige/80">
                      <li>Ведение учёта</li>
                      <li>Ежемесячная отчётность</li>
                      <li>Консультации по телефону</li>
                    </ul>
                  </div>

                  <div className="bg-brand-beige/5 p-6 rounded-xl border-2 border-brand-beige/20">
                    <h4 className="text-2xl font-black">Бизнес</h4>
                    <p className="text-sm text-brand-beige/80 mb-4">Оптимальный пакет для малого бизнеса</p>
                    <div className="text-3xl font-black mb-4">от 149 000 ₸/мес</div>
                    <ul className="text-sm space-y-2 text-brand-beige/80">
                      <li>Полное сопровождение бухгалтерии</li>
                      <li>Налоговое планирование</li>
                      <li>Поддержка при проверках</li>
                    </ul>
                  </div>

                  <div className="bg-brand-beige/5 p-6 rounded-xl">
                    <h4 className="text-2xl font-black">Премиум</h4>
                    <p className="text-sm text-brand-beige/80 mb-4">Персональный подход и приоритетная поддержка</p>
                    <div className="text-3xl font-black mb-4">по запросу</div>
                    <ul className="text-sm space-y-2 text-brand-beige/80">
                      <li>Персональный менеджер</li>
                      <li>Юридическая защита</li>
                      <li>Аудит и оптимизация</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-2 items-start">
              <div>
                <h3 className="text-3xl font-black text-brand-green mb-4">Часто задаваемые вопросы</h3>
                <div className="space-y-4">
                  {faqs.map((f, i) => (
                    <details key={i} className="bg-white/80 p-4 rounded-xl border border-brand-green/10">
                      <summary className="cursor-pointer font-bold text-brand-green">{f.q}</summary>
                      <p className="mt-2 text-brand-green/70">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>

              <div className="bg-brand-green rounded-2xl p-8 text-brand-beige">
                <h3 className="text-2xl font-black mb-3">Готовы обсудить задачу?</h3>
                <p className="text-brand-beige/90 mb-6">Оставьте заявку — перезвоним и подготовим коммерческое предложение.</p>
                <form className="space-y-4">
                  <input className="w-full p-3 rounded-lg text-brand-green" placeholder="Имя" />
                  <input className="w-full p-3 rounded-lg text-brand-green" placeholder="Телефон или e-mail" />
                  <textarea className="w-full p-3 rounded-lg text-brand-green" placeholder="Краткое описание задачи" rows={4} />
                  <div className="flex gap-4">
                    <button type="button" className="px-4 py-2 bg-brand-beige text-brand-green rounded-lg font-bold">Отправить</button>
                    <button type="button" className="px-4 py-2 border border-brand-beige text-brand-beige rounded-lg">Позвоните мне</button>
                  </div>
                </form>
              </div>
            </div>
          </Container>
        </Section>
        {active && <ServiceModal item={active} onClose={() => setActive(null)} />}
      </main>
    </>
  );
}
