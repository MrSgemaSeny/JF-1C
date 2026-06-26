import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'CLIENT' | 'EMPLOYEE'>('CLIENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const result = await loginWithGoogle(credentialResponse.credential, role);
        if (result.isPendingApproval) {
          setSuccessMessage('Заявка на регистрацию отправлена! Администратор проверит ваши данные.');
        } else if (result.isNewUser && role === 'CLIENT') {
          navigate(ROUTES.COMPLETE_PROFILE);
        } else {
          navigate(ROUTES.PROFILE);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться через Google.');
    }
  };

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
      const result = await register({
        fullName,
        email,
        password,
        role,
        phone: role === 'CLIENT' ? phone : undefined,
        companyName: role === 'CLIENT' ? companyName : undefined,
      });

      if (result.isPendingApproval) {
        setSuccessMessage('Заявка на регистрацию отправлена! Администратор проверит ваши данные.');
      } else {
        navigate(ROUTES.PROFILE);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-8 sm:p-10 text-center">
          <div className="mx-auto w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="text-2xl font-black uppercase text-brand-green mb-4">Заявка отправлена</h2>
          <p className="text-brand-green/70 mb-8 leading-relaxed">
            {successMessage}
          </p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center py-3.5 px-8 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all"
          >
            На главную
          </Link>
        </div>
      </div>
    );
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
        <p className="text-brand-green/70 mb-6">Создайте аккаунт, чтобы открыть личный кабинет.</p>

        {/* Tabs */}
        <div className="flex p-1 bg-brand-green/5 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
              role === 'CLIENT'
                ? 'bg-white text-brand-green shadow-sm'
                : 'text-brand-green/50 hover:text-brand-green/80'
            }`}
          >
            Я Клиент
          </button>
          <button
            type="button"
            onClick={() => setRole('EMPLOYEE')}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
              role === 'EMPLOYEE'
                ? 'bg-white text-brand-green shadow-sm'
                : 'text-brand-green/50 hover:text-brand-green/80'
            }`}
          >
            Я Сотрудник
          </button>
        </div>

        {role === 'CLIENT' ? (
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
              <label htmlFor="phone" className="block text-sm font-bold text-brand-green mb-1.5">Телефон</label>
              <input
                id="phone"
                type="text"
                autoComplete="off"
                maxLength={32}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
                placeholder="+7 (777) 000-00-00"
              />
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-bold text-brand-green mb-1.5">Название ИП/ТОО <span className="font-normal text-brand-green/50">(необязательно)</span></label>
              <input
                id="companyName"
                type="text"
                autoComplete="off"
                maxLength={255}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
                placeholder="ТОО Zhan Finance"
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
              {isSubmitting ? 'Обработка...' : 'Зарегистрироваться'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <div className="bg-brand-green/5 border border-brand-green/10 rounded-xl p-6 text-center space-y-4">
            <p className="text-sm text-brand-green/80 leading-relaxed font-medium">
              Для корректной работы корпоративной почты и системы уведомлений, сотрудники могут регистрироваться только через <b>Google Аккаунт</b>.
            </p>
          </div>
        )}

        <div className="mt-6">
          {role === 'CLIENT' && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-green/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-brand-green/50">или</span>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Ошибка авторизации Google')}
              use_fedcm_for_prompt={false}
              itp_support={true}
            />
          </div>
        </div>

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