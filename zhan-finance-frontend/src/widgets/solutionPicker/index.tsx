import { useState } from 'react';
import { motion } from 'framer-motion';

const questions = [
  {
    id: 'form',
    q: 'Какая у вас форма бизнеса?',
    options: ['ИП', 'ТОО', 'Другое'],
  },
  {
    id: 'turnover',
    q: 'Примерный годовой оборот (диапазон)?',
    options: ['1-3 млн', '4-10 млн', '10+ млн'],
  },
  {
    id: 'employees',
    q: 'Кол-во сотрудников?',
    options: ['1–10', '11–50', '50+'],
  },
  {
    id: 'needs',
    q: 'Что для вас важнее прямо сейчас?',
    options: ['Бухгалтерия', 'Налоги', 'Кадры', 'Юридическая защита'],
  },
  {
    id: 'timeline',
    q: 'Срок внедрения решения?',
    options: ['В течение дня', '1-3 дня', 'Более 3 дней'],
  },
];

export function SolutionPicker() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);

  function select(option: string) {
    const key = questions[step].id;
    setAnswers((s) => ({ ...s, [key]: option }));
  }

  function next() {
    if (step < questions.length - 1) setStep((s) => s + 1);
    else setStep(questions.length);
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    // placeholder: send to API
    console.log('Survey result', { answers, contact });
    alert('Заявка отправлена. Спасибо!');
  }

  return (
    <section id="solution-picker" className="bg-white/90 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-4xl font-black text-brand-green mb-4">Поможем подобрать решение под ваш бизнес</h2>
          <p className="text-lg text-brand-green/70 mb-8">Ответьте на 5 вопросов — в конце появится форма для отправки.</p>
        </motion.div>

        <div className="bg-brand-beige/20 rounded-2xl p-8">
          {step < questions.length ? (
            <motion.div key={questions[step].id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <h3 className="text-2xl font-bold text-brand-green mb-4">{questions[step].q}</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {questions[step].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => select(opt)}
                    className={`text-left p-4 rounded-lg border-2 transition-all hover:scale-105 ${answers[questions[step].id] === opt ? 'border-brand-green bg-brand-green text-brand-beige' : 'border-brand-green/20 bg-white'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button onClick={prev} disabled={step === 0} className="px-4 py-2 rounded-lg border">
                  Назад
                </button>
                <button onClick={next} className="px-4 py-2 rounded-lg bg-brand-green text-brand-beige">
                  {step === questions.length - 1 ? 'Далее к форме' : 'Далее'}
                </button>
                <div className="ml-auto text-sm text-brand-green/60">Вопрос {step + 1} из {questions.length}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <h3 className="text-2xl font-bold text-brand-green mb-4">Оставьте контакты</h3>
              <form onSubmit={submitForm} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-green/70 mb-2">Имя</label>
                  <input value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} className="w-full p-3 rounded-lg bg-white border border-brand-green/20" required />
                </div>
                <div>
                  <label className="block text-sm text-brand-green/70 mb-2">Телефон или e-mail</label>
                  <input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className="w-full p-3 rounded-lg bg-white border border-brand-green/20" required />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-brand-green/70 mb-2">Комментарий</label>
                  <textarea className="w-full p-3 rounded-lg bg-white border border-brand-green/20" rows={4} />
                </div>

                <div className="md:col-span-2 flex items-center gap-4">
                  <button type="submit" className="px-6 py-3 bg-brand-green text-brand-beige rounded-lg font-bold">Отправить</button>
                  <button type="button" onClick={() => { setStep(0); setAnswers({}); }} className="px-6 py-3 border rounded-lg">Пройти заново</button>
                </div>

                <div className="md:col-span-2 pt-4 text-sm text-brand-green/70">
                  <strong>Ваши ответы:</strong>
                  <pre className="whitespace-pre-wrap mt-2 bg-white p-3 rounded-lg text-sm">{JSON.stringify(answers, null, 2)}</pre>
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {submitted && <div className="mt-4 text-green-600">Заявка отправлена.</div>}
      </div>
    </section>
  );
}
