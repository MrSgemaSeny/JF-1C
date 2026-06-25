import { Section } from '@/shared/ui/Section';
import { faqs } from '@/shared/config/content/faq';

export function ServicesFaqContact() {
  return (
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
  );
}
