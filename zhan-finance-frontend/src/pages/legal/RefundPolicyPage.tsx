import { Header } from '@/widgets/header/Header';
import { Footer } from '@/widgets/footer/Footer';
import { RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

export function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-brand-beige min-h-screen pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header Banner */}
          <div className="bg-brand-green text-brand-beige rounded-3xl p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-beige/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-beige/90 mb-4">
                <RefreshCw className="w-4 h-4" />
                Финансовый регламент
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
                Политика возврата средств
              </h1>
              <p className="text-brand-beige/80 text-base md:text-lg max-w-2xl">
                Условия, сроки и порядок возврата денежных средств за подписки на SaaS-сервис ZhanFinance и сопутствующие бухгалтерские услуги.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-brand-beige/60">
                <span>Дата вступления в силу: 1 сентября 2026 г.</span>
                <span>•</span>
                <span>Редакция: 1.0</span>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-brand-green/10 text-brand-green/90 space-y-10 leading-relaxed font-normal">

            {/* 1. Общие положения */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">1</span>
                Общие положения
              </h2>
              <p>
                1.1. Настоящая Политика возврата денежных средств (далее — «Политика») определяет правила и порядок возврата оплаты за тарифные подписки и разовые бухгалтерские услуги, предоставляемые ТОО «ZhanFinance» (далее — «Компания»).
              </p>
              <p>
                1.2. Политика разработана в соответствии с Гражданским кодексом Республики Казахстан и Законом РК «О защите прав потребителей».
              </p>
            </section>

            {/* 2. Возврат по подпискам */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">2</span>
                Возврат средств за тарифные подписки (SaaS)
              </h2>
              <p>
                2.1. Клиент имеет право отказаться от платной подписки на SaaS-платформу в любое время в течение оплаченного расчетного периода.
              </p>
              <p>
                2.2. При досрочном отказе от действующей подписки возврат денежных средств рассчитывается <strong>пропорционально количеству полных неиспользованных календарных дней</strong> до окончания оплаченного периода, за вычетом фактически понесенных Компанией расходов (включая банковские и эквайринговые комиссии платежных шлюзов).
              </p>
              <p>
                2.3. Дни, в течение которых Клиент имел фактический доступ к системе в текущем расчетном месяце, считаются оказанными услугами и перерасчету не подлежат.
              </p>
            </section>

            {/* 3. Разовые услуги */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">3</span>
                Разовые услуги и консультации
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl border border-brand-green/10 bg-brand-beige/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-brand-green text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    Возврат до начала работ
                  </div>
                  <p className="text-xs text-brand-green/80">
                    Если Клиент подал заявление об отмене услуги до момента фактического начала выполнения работ специалистом, возврат осуществляется в размере 100% за вычетом комиссии банка.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-brand-green/10 bg-brand-beige/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-brand-green text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    Услуга оказана / отчет сдан
                  </div>
                  <p className="text-xs text-brand-green/80">
                    Если услуга (сдача налоговой формы, аудит базы, консультация) уже фактически оказана или отправлена в государственные органы, возврат денежных средств не производится.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Регламент и сроки */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">4</span>
                Порядок подачи заявки и сроки рассмотрения
              </h2>
              <div className="p-5 rounded-2xl bg-brand-green/5 border border-brand-green/15 text-sm space-y-3">
                <div className="flex items-center gap-2 font-bold text-brand-green">
                  <Clock className="w-4 h-4 text-brand-green shrink-0" />
                  Срок рассмотрения заявки — не более 14 рабочих дней
                </div>
                <ol className="list-decimal pl-5 space-y-2 text-xs text-brand-green/90">
                  <li>Клиент направляет письменное заявление на электронную почту <strong>billing@zhanfinance.kz</strong> с указанием наименования/ФИО, БИН/ИИН, номера инвойса и причины возврата.</li>
                  <li>Финансовый отдел Компании регистрирует заявление и производит аудит выполненных обязательств и фактических расходов в течение 14 рабочих дней.</li>
                  <li>После одобрения возврат осуществляется на тот же банковский счет или карту, с которой была совершена оплата (включая Kaspi Pay и эквайринг банков РК). Срок зачисления зависит от регламента обслуживающего банка Клиента (обычно от 1 до 5 банковских дней).</li>
                </ol>
              </div>
            </section>

            {/* 5. Контакты биллинга */}
            <section className="space-y-4 pt-4 border-t border-brand-green/10">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">5</span>
                Контакты финансовой службы
              </h2>
              <div className="p-6 rounded-2xl bg-brand-beige/40 border border-brand-green/15 text-sm space-y-2">
                <p><strong>Вопросы по возвратам и счетам:</strong> Отдел взаиморасчетов и биллинга</p>
                <p><strong>Email:</strong> <a href="mailto:billing@zhanfinance.kz" className="underline font-bold text-brand-green">billing@zhanfinance.kz</a>, <a href="mailto:zhan.finance@gmail.com" className="underline text-brand-green">zhan.finance@gmail.com</a></p>
                <p><strong>Телефон:</strong> +7-775-957-37-87</p>
                <p><strong>График работы:</strong> Пн–Пт с 09:00 до 18:00 (по времени г. Алматы / Астаны)</p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
