import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      setError('Пароль должен содержать хотя бы одну букву и одну цифру');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(fullName, email, password);
      navigate(ROUTES.PROFILE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-8 sm:p-10">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-brand-beige font-black text-xl">
            Z
          </div>
          <span className="font-black text-xl uppercase tracking-wide text-brand-green">Zhan Finance</span>
        </Link>

        <h1 className="text-3xl font-black uppercase text-brand-green mb-2">Регистрация</h1>
        <p className="text-brand-green/70 mb-8">Создайте аккаунт, чтобы открыть личный кабинет.</p>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label htmlFor="fullName" className="block text-sm font-bold text-brand-green mb-1.5">Имя</label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="off"
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder="Имя Фамилия"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-brand-green mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="off"
              maxLength={160}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder="example@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-brand-green mb-1.5">Пароль</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={120}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder="Минимум 8 символов, буквы и цифры"
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
            {isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-sm text-brand-green/70 mt-6">
          Уже есть аккаунт?{' '}
          <Link to={ROUTES.LOGIN} className="font-bold text-brand-green hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}