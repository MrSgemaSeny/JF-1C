import { useContactForm } from './useContactForm';

interface ContactFormProps {
  title?: string;
  className?: string;
}

export function ContactForm({ title = 'Связаться с нами', className = '' }: ContactFormProps) {
  const { name, setName, phone, setPhone, submitted, loading, error, handleSubmit } = useContactForm();

  return (
    <div className={className}>
      <h3 className="text-3xl font-black uppercase mb-8">{title}</h3>
      {submitted ? (
        <p className="text-lg font-medium opacity-80">Спасибо! Мы скоро свяжемся с вами.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider opacity-70">Ваше имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium"
              placeholder="Иван Иванов"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wider opacity-70">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-brand-green/5 border-b-2 border-brand-green/20 px-4 py-3 focus:outline-none focus:border-brand-green transition-colors rounded-t-xl font-medium"
              placeholder="+7 (___) ___-__-__"
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-brand-green text-brand-beige py-5 rounded-xl text-lg font-bold uppercase tracking-wider hover:bg-brand-green/90 hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Отправляем...' : 'Отправить заявку'}
          </button>
        </form>
      )}
    </div>
  );
}
