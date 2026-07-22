import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail, Lock, ChevronLeft } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError, extractValidationErrors } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { checkEmail } from '@/features/auth/authApi';
import { GoogleLogin } from '@react-oauth/google';
import { Input } from '@/shared/ui/Input/Input';
import { toast } from '@/shared/ui/Toast/ToastContext';
import { useTranslation } from 'react-i18next';
import LogoImage from '@/shared/assets/icons/logo.png';
import { Spinner } from '@/shared/ui/Spinner';

type Step = 'EMAIL' | 'PASSWORD' | 'SOCIAL_PROMPT';

export function LoginPage() {
  const { t } = useTranslation(['common', 'auth']);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>('EMAIL');
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
          toast.warning(t('auth.login.pendingApproval'));
        } else if (result.isNewUser) {
          toast.success(t('auth.login.registerSuccess'));
          navigate(ROUTES.COMPLETE_PROFILE);
        } else {
          toast.success(t('auth.login.loginSuccess'));
          const returnUrl = searchParams.get('from') || ROUTES.PROFILE;
          navigate(returnUrl, { replace: true });
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'UNKNOWN';
      toast.error(t(`auth:errors.${msg}`, { defaultValue: msg === 'UNKNOWN' ? t('auth.login.googleError') : msg }));
    }
  };

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setValidationErrors({ email: t('auth.login.emailRequired', { defaultValue: 'Введите email' }) });
      return;
    }
    
    setGlobalError(null);
    setValidationErrors({});
    setIsSubmitting(true);
    try {
      const result = await checkEmail(email);
      
      // По логике Bitrix24 мы НЕ скрываем существование аккаунта для LOCAL.
      // Если аккаунт Google - показываем соц-форму.
      if (result.exists && result.provider === 'GOOGLE') {
        setStep('SOCIAL_PROMPT');
      } else {
        setStep('PASSWORD');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'UNKNOWN';
      setGlobalError(t(`auth:errors.${msg}`, { defaultValue: msg === 'UNKNOWN' ? t('auth.login.networkError', { defaultValue: 'Ошибка сети' }) : msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setGlobalError(null);
    setValidationErrors({});
    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success(t('auth.login.loginSuccess'));
      const returnUrl = searchParams.get('from') || ROUTES.PROFILE;
      navigate(returnUrl, { replace: true });
    } catch (err) {
      const fieldErrors = extractValidationErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
        const msg = err instanceof ApiError ? err.message : 'UNKNOWN';
        setGlobalError(t(`auth:errors.${msg}`, { defaultValue: msg === 'UNKNOWN' ? t('auth.login.loginError') : msg }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    setStep('EMAIL');
    setGlobalError(null);
    setValidationErrors({});
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-8 sm:p-10 relative overflow-hidden">
        
        {step !== 'EMAIL' && (
          <button 
            onClick={goBack}
            className="absolute top-6 left-6 p-2 text-brand-green/60 hover:text-brand-green hover:bg-brand-green/5 rounded-full transition-colors"
            title={t('auth.login.back', { defaultValue: 'Назад' })}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <Link to={ROUTES.HOME} className="flex items-center justify-center gap-3 mb-8 mt-2">
          <img src={LogoImage} alt="Zhan Finance Logo" className="w-10 h-10 rounded-xl object-contain" />
          <span className="font-black text-xl uppercase tracking-wide text-brand-green">Zhan Finance</span>
        </Link>

        {step === 'EMAIL' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="text-3xl font-black uppercase text-brand-green mb-2 text-center">{t('auth.login.title')}</h1>
            <p className="text-brand-green/70 mb-8 text-center">{t('auth.login.subtitle')}</p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                error={validationErrors.email}
                icon={<Mail className="w-5 h-5" />}
                placeholder="example@gmail.com"
              />

              {globalError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {globalError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? <Spinner className="w-5 h-5" /> : t('auth.login.nextBtn', { defaultValue: 'Далее' })}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-green/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-brand-green/50">{t('auth.login.or')}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error(t('auth.login.googleAuthError'))}
                  use_fedcm_for_prompt={false}
                  itp_support={true}
                />
              </div>
            </div>

            <p className="text-center text-sm text-brand-green/70 mt-6">
              {t('auth.login.noAccount')}{' '}
              <Link to={`${ROUTES.REGISTER}${searchParams.get('from') ? `?from=${encodeURIComponent(searchParams.get('from')!)}` : ''}`} className="font-bold text-brand-green hover:underline">
                {t('auth.login.registerLink')}
              </Link>
            </p>
          </div>
        )}

        {step === 'PASSWORD' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h1 className="text-2xl font-black uppercase text-brand-green mb-2 text-center">{t('auth.login.enterPassword', { defaultValue: 'Введите пароль' })}</h1>
            <p className="text-brand-green/70 mb-8 text-center text-sm font-medium">{email}</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                id="password"
                type="password"
                label={t('auth.login.passwordLabel')}
                required
                autoFocus
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
                disabled={isSubmitting || !password}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginBtn')}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {step === 'SOCIAL_PROMPT' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('auth.login.socialLinkedTitle', { defaultValue: 'Этот e-mail привязан к аккаунту соцсети' })}
            </h2>
            <p className="text-gray-500 mb-8">{t('auth.login.socialLinkedSubtitle', { defaultValue: 'Войти с помощью:' })}</p>

            <div className="w-full flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error(t('auth.login.googleAuthError'))}
                use_fedcm_for_prompt={false}
                itp_support={true}
              />
            </div>

            <button 
              onClick={() => setStep('PASSWORD')}
              className="text-brand-green hover:text-brand-green/80 font-medium hover:underline transition-all text-sm"
            >
              {t('auth.login.orPasswordFallback', { defaultValue: 'или войти по паролю' })}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}