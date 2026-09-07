import { Header } from '@/widgets/header/Header';
import { Footer } from '@/widgets/footer/Footer';
import { FileText, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

export function TermsPage() {
  return (
    <>
      <Header />
      <main className="bg-brand-beige min-h-screen pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header Banner */}
          <div className="bg-brand-green text-brand-beige rounded-3xl p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-beige/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-beige/90 mb-4">
                <Scale className="w-4 h-4" />
                Публичная оферта
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
                Пользовательское соглашение
              </h1>
              <p className="text-brand-beige/80 text-base md:text-lg max-w-2xl">
                Договор публичной оферты на предоставление доступа к SaaS-платформе ZhanFinance и оказание услуг бухгалтерского обслуживания.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-brand-beige/60">
                <span>Дата публикации: 1 сентября 2026 г.</span>
                <span>•</span>
                <span>Действует бессрочно до отзыва</span>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-brand-green/10 text-brand-green/90 space-y-10 leading-relaxed font-normal">

            {/* 1. Термины и определения */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">1</span>
                Термины и определения
              </h2>
              <p>
                1.1. <strong>Исполнитель</strong> — ТОО «ZhanFinance» (БИН 240140023819), предоставляющее доступ к SaaS-платформе и оказывающее профессиональные услуги.
              </p>
              <p>
                1.2. <strong>Заказчик (Пользователь)</strong> — юридическое лицо, индивидуальный предприниматель или физическое лицо, акцептовавшее условия настоящей публичной оферты.
              </p>
              <p>
                1.3. <strong>Платформа</strong> — облачный программный комплекс ZhanFinance, доступный в сети Интернет, предназначенный для управления бухгалтерскими задачами, документооборотом и коммуникациями.
              </p>
              <p>
                1.4. <strong>Акцепт оферты</strong> — полное и безоговорочное принятие условий оферты путем прохождения регистрации на Платформе либо оплаты выставленного инвойса.
              </p>
            </section>

            {/* 2. Предмет соглашения */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">2</span>
                Предмет соглашения
              </h2>
              <p>
                2.1. Исполнитель предоставляет Заказчику право удаленного использования Платформы на условиях простой (неисключительной) лицензии, а также оказывает услуги по бухгалтерскому, налоговому и кадровому учету согласно выбранному тарифному плану или согласованным задачам.
              </p>
              <p>
                2.2. Заказчик обязуется своевременно оплачивать услуги Исполнителя и соблюдать правила использования функционала Платформы.
              </p>
            </section>

            {/* 3. Порядок предоставления доступа и безопасности */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">3</span>
                Регистрация, аутентификация и безопасность аккаунта
              </h2>
              <p>
                3.1. Для получения доступа к личному кабинету Заказчик проходит процедуру регистрации, указывая достоверные регистрационные данные.
              </p>
              <p>
                3.2. Заказчик несет полную ответственность за сохранность параметров доступа к своему аккаунту и за все действия, совершенные под его учетными данными. В целях безопасности рекомендуется использовать двухфакторную аутентификацию (2FA).
              </p>
              <p>
                3.3. В случае подозрения на несанкционированный доступ Заказчик обязан немедленно уведомить службу поддержки Исполнителя.
              </p>
            </section>

            {/* 4. Ограничение ответственности и налоговый дисклеймер */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">4</span>
                Разграничение ответственности и налоговый дисклеймер
              </h2>
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm space-y-2 text-brand-green">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  Существенное условие: ответственность за первичную документацию
                </div>
                <p>
                  Исполнитель осуществляет расчет налоговых обязательств и формирует налоговые регистры строго на основе первичных документов и сведений, предоставленных Заказчиком.
                </p>
                <p>
                  Исполнитель не несет ответственности за доначисление налогов, пени и штрафные санкции со стороны органов государственных доходов (КГД МФ РК), если такие санкции вызваны:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Предоставлением Заказчиком недостоверных, фиктивных или неполных первичных документов.</li>
                  <li>Нарушением Заказчиком сроков предоставления выписок, накладных и актов выполненных работ.</li>
                  <li>Самостоятельным вмешательством Заказчика в настроенные учетные базы или сдачей корректировочных отчетов без согласования с Исполнителем.</li>
                </ul>
              </div>
            </section>

            {/* 5. Интеллектуальная собственность */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">5</span>
                Права на интеллектуальную собственность
              </h2>
              <p>
                5.1. Все исключительные права на Платформу ZhanFinance, включая исходный код, базы данных, интерфейсные решения, алгоритмы расчета и товарные знаки, принадлежат ТОО «ZhanFinance».
              </p>
              <p>
                5.2. Пользователю предоставляется право пользования функционалом Платформы исключительно в пределах, необходимых для получения заявленных услуг. Запрещается декомпиляция, обратный инжиниринг и копирование элементов интерфейса.
              </p>
            </section>

            {/* 6. Порядок разрешения споров */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">6</span>
                Порядок разрешения споров и применимое право
              </h2>
              <p>
                6.1. Все споры и разногласия разрешаются Сторонами путем переговоров с соблюдением обязательного досудебного претензионного порядка. Срок ответа на письменную претензию составляет 30 (тридцать) календарных дней с момента ее получения.
              </p>
              <p>
                6.2. В случае невозможности достижения согласия спор передается на рассмотрение в специализированный межрайонный экономический суд города Алматы в соответствии с материальным и процессуальным правом Республики Казахстан.
              </p>
              <p>
                6.3. По отдельному письменному соглашению Сторон споры могут быть переданы на разрешение в Международный арбитражный центр Международного финансового центра «Астана» (МФЦА).
              </p>
            </section>

            {/* 7. Изменение условий и контакты */}
            <section className="space-y-4 pt-4 border-t border-brand-green/10">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">7</span>
                Реквизиты Исполнителя
              </h2>
              <div className="p-6 rounded-2xl bg-brand-beige/40 border border-brand-green/15 text-sm space-y-2">
                <p><strong>Исполнитель:</strong> ТОО «ZhanFinance»</p>
                <p><strong>БИН:</strong> 240140023819</p>
                <p><strong>Юридический адрес:</strong> Республика Казахстан, г. Шымкент, ул. Байтерекова, 79а</p>
                <p><strong>Филиал / Представительство:</strong> г. Алматы, пр. Достык, 180</p>
                <p><strong>Email:</strong> info@zhanfinance.kz, zhan.finance@gmail.com</p>
                <p><strong>Телефон:</strong> +7-775-957-37-87, +7 (7252) 52-23-09</p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
