import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Phone, Sparkles } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { apiRequest } from '@/shared/api/http';

async function updateProfile(phone: string, companyName: string): Promise<void> {
  return apiRequest<void>('/api/crm/clients/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ phone, companyName }),
  });
}

export function CompleteProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await updateProfile(phone, companyName);
      navigate(ROUTES.PROFILE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось сохранить данные.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    navigate(ROUTES.PROFILE);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-8 sm:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-brand-beige font-black text-xl">
            Z
          </div>
          <span className="font-black text-xl uppercase tracking-wide text-brand-green">Zhan Finance</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-brand-green" />
          <h1 className="text-3xl font-black uppercase text-brand-green">Добро пожаловать!</h1>
        </div>
        <p className="text-brand-green/70 mb-8 leading-relaxed">
          Аккаунт создан через Google. Дополните профиль — это займёт 30 секунд. Всё это необязательно.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-brand-green mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Телефон
            </label>
            <input
              id="phone"
              type="text"
              autoComplete="tel"
              maxLength={32}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder="+7 (777) 000-00-00"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-bold text-brand-green mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Название ИП / ТОО
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              maxLength={255}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder="ТОО Zhan Finance"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Сохраняем...' : 'Сохранить и продолжить'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full mt-3 py-2.5 text-sm font-bold text-brand-green/50 hover:text-brand-green/80 transition-colors"
        >
          Пропустить →
        </button>
      </div>
    </div>
  );
}
