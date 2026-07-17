import { useState } from 'react';
import { motion } from 'framer-motion';
import { questions } from './questions';
import { apiRequest } from '@/shared/api/http';
import { useTranslation } from 'react-i18next';

export function SolutionPicker() {
  const { t } = useTranslation('common');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const message = t('quiz.resultsHeader', { defaultValue: 'Результаты опроса:\n' }) + Object.entries(answers).map(([k, v]) => `- ${t('quiz.questionResult', { defaultValue: 'Вопрос:' })} ${k}\n  ${t('quiz.answerResult', { defaultValue: 'Ответ:' })} ${v}`).join('\n');
      
      await apiRequest('/api/contact-requests', {
        method: 'POST',
        body: JSON.stringify({
          name: contact.name,
          phone: contact.phone,
          message: message,
          source: 'frontend'
        })
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit survey', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="solution-picker" className="bg-brand-green py-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-4xl font-black text-brand-beige mb-4">{t('quiz.title', { defaultValue: 'Поможем подобрать решение под ваш бизнес' })}</h2>
          <p className="text-lg text-white/80 mb-8">{t('quiz.subtitle', { defaultValue: 'Ответьте на 5 вопросов — в конце появится форма для отправки.' })}</p>
        </motion.div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {submitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-2xl font-bold text-brand-green mb-4">{t('quiz.success', { defaultValue: 'Спасибо! Мы свяжемся с вами в ближайшее время.' })}</h3>
              
              <div className="mt-8 p-6 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                <h4 className="text-lg font-bold text-brand-green mb-3">
                  {t('quiz.promoTitle', { defaultValue: 'Хотите удобнее управлять своими задачами?' })}
                </h4>
                <p className="text-brand-green/80 mb-6 leading-relaxed">
                  {t('quiz.promoText', { defaultValue: 'Зарегистрируйтесь на платформе, чтобы отслеживать статус заявок, обмениваться документами в безопасном чате и всегда быть на связи с личным бухгалтером.' })}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="/login"
                    className="px-6 py-3 bg-brand-green text-brand-beige rounded-lg font-bold hover:bg-brand-green/90 transition-colors"
                  >
                    {t('quiz.promoLogin', { defaultValue: 'Войти / Зарегистрироваться' })}
                  </a>
                  <button
                    onClick={() => { setStep(0); setAnswers({}); setSubmitted(false); setContact({ name: '', phone: '' }); }}
                    className="px-6 py-3 border border-brand-green/20 text-brand-green rounded-lg hover:bg-brand-green/5 transition-colors"
                  >
                    {t('quiz.restart', { defaultValue: 'Пройти заново' })}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : step < questions.length ? (
            <motion.div key={questions[step].id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <h3 className="text-2xl font-bold text-brand-green mb-4">{t(`quiz.questions.${questions[step].id}.q`, { defaultValue: questions[step].q })}</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {questions[step].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => select(opt)}
                    className={`text-left p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      answers[questions[step].id] === opt
                        ? 'border-brand-green bg-brand-green text-brand-beige'
                        : 'border-brand-green/20 bg-white'
                    }`}
                  >
                    {t(`quiz.questions.${questions[step].id}.options.${opt}`, { defaultValue: opt })}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button onClick={prev} disabled={step === 0} className="px-4 py-2 rounded-lg border disabled:opacity-40">
                  {t('quiz.prev', { defaultValue: 'Назад' })}
                </button>
                <button onClick={next} className="px-4 py-2 rounded-lg bg-brand-green text-brand-beige">
                  {step === questions.length - 1 ? t('quiz.nextToForm', { defaultValue: 'Далее к форме' }) : t('quiz.next', { defaultValue: 'Далее' })}
                </button>
                <div className="ml-auto text-sm text-brand-green/60">
                  {t('quiz.question', { defaultValue: 'Вопрос' })} {step + 1} {t('quiz.of', { defaultValue: 'из' })} {questions.length}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <h3 className="text-2xl font-bold text-brand-green mb-4">{t('quiz.leaveContacts', { defaultValue: 'Оставьте контакты' })}</h3>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-brand-green/70 mb-2">{t('quiz.name', { defaultValue: 'Имя' })}</label>
                  <input
                    value={contact.name}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-white border border-brand-green/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-brand-green/70 mb-2">{t('quiz.phoneOrEmail', { defaultValue: 'Телефон или e-mail' })}</label>
                  <input
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    className="w-full p-3 rounded-lg bg-white border border-brand-green/20"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-4 mt-4">
                  <button type="submit" disabled={loading} className={`px-6 py-3 bg-brand-green text-brand-beige rounded-lg font-bold ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {loading ? t('quiz.submitting', { defaultValue: 'Отправка...' }) : t('quiz.submit', { defaultValue: 'Отправить' })}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(0); setAnswers({}); setSubmitted(false); }}
                    className="px-6 py-3 border rounded-lg"
                  >
                    {t('quiz.restart', { defaultValue: 'Пройти заново' })}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
