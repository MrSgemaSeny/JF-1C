import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError, extractValidationErrors } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Input } from '@/shared/ui/Input/Input';
import { toast } from '@/shared/ui/Toast/ToastContext';

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const result = await loginWithGoogle(credentialResponse.credential);
        if (result.isPendingApproval) {
          toast.warning('Ваш аккаунт ожидает подтверждения администратора.');
        } else if (result.isNewUser) {
          toast.success('Успешная регистрация!');
          navigate(ROUTES.COMPLETE_PROFILE);
        } else {
          toast.success('Успешный вход!');
          const returnUrl = searchParams.get('from') || ROUTES.PROFILE;
          navigate(returnUrl, { replace: true });
        }
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Не удалось войти через Google.');
    }
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGlobalError(null);
    setValidationErrors({});
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Успешный вход!');
      const returnUrl = searchParams.get('from') || ROUTES.PROFILE;
      navigate(returnUrl, { replace: true });
    } catch (err) {
      const fieldErrors = extractValidationErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
        setGlobalError(err instanceof ApiError ? err.message : 'Не удалось войти. Попробуйте снова.');
      }
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

        <h1 className="text-3xl font-black uppercase text-brand-green mb-2">Вход</h1>
        <p className="text-brand-green/70 mb-8">Войдите, чтобы открыть личный кабинет.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label="Email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            error={validationErrors.email}
            icon={<Mail className="w-5 h-5" />}
            placeholder="example@gmail.com"
          />

          <Input
            id="password"
            type="password"
            label="Пароль"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            error={validationErrors.password}
            icon={<Lock className="w-5 h-5" />}
            placeholder="••••••••"
          />

          {globalError && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {globalError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Входим...' : 'Войти'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-green/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-brand-green/50">или</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Ошибка авторизации Google')}
              use_fedcm_for_prompt={false}
              itp_support={true}
            />
          </div>
        </div>

        <p className="text-center text-sm text-brand-green/70 mt-6">
          Нет аккаунта?{' '}
          <Link to={`${ROUTES.REGISTER}${searchParams.get('from') ? `?from=${encodeURIComponent(searchParams.get('from')!)}` : ''}`} className="font-bold text-brand-green hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}