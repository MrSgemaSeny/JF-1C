import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, User, Mail, Lock, Phone, Building2 } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError, extractValidationErrors } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Input } from '@/shared/ui/Input/Input';
import { toast } from '@/shared/ui/Toast/ToastContext';
import { useTranslation } from 'react-i18next';
import LogoImage from '@/shared/assets/icons/logo.png';

interface RegisterPageProps {
  isEmployeeRoute?: boolean;
}

export function RegisterPage({ isEmployeeRoute = false }: RegisterPageProps) {
  const { t } = useTranslation(['common', 'auth']);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const role = isEmployeeRoute ? 'EMPLOYEE' : 'CLIENT';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        const result = await loginWithGoogle(credentialResponse.credential, role);
        if (result.isPendingApproval) {
          setSuccessMessage(t('auth.register.pendingApproval'));
        } else if (result.isNewUser && role === 'CLIENT') {
          toast.success(t('auth.register.success'));
          navigate(ROUTES.COMPLETE_PROFILE);
        } else {
          toast.success(t('auth.register.loginSuccess'));
          const returnUrl = searchParams.get('from') || ROUTES.PROFILE;
          navigate(returnUrl, { replace: true });
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'UNKNOWN';
      toast.error(t(`auth:errors.${msg}`, { defaultValue: msg === 'UNKNOWN' ? t('auth.register.googleError') : msg }));
    }
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setGlobalError(null);
    setValidationErrors({});

    if (password.length < 8) {
      setValidationErrors({ password: t('auth.register.passwordLengthError') });
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      setValidationErrors({ password: t('auth.register.passwordFormatError') });
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
        setSuccessMessage(t('auth.register.pendingApproval'));
      } else {
        toast.success(t('auth.register.loginSuccess'));
        const returnUrl = searchParams.get('from') || ROUTES.PROFILE;
        navigate(returnUrl, { replace: true });
      }
    } catch (err) {
      const fieldErrors = extractValidationErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
        const msg = err instanceof ApiError ? err.message : 'UNKNOWN';
        setGlobalError(t(`auth:errors.${msg}`, { defaultValue: msg === 'UNKNOWN' ? t('auth.register.registerError') : msg }));
      }
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
          <h2 className="text-2xl font-black uppercase text-brand-green mb-4">{t('auth.register.submittedTitle')}</h2>
          <p className="text-brand-green/70 mb-8 leading-relaxed">
            {successMessage}
          </p>
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center justify-center py-3.5 px-8 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all"
          >
            {t('auth.register.homeLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-8 sm:p-10">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-8">
          <img src={LogoImage} alt="Zhan Finance Logo" className="w-10 h-10 rounded-xl object-contain" />
          <span className="font-black text-xl uppercase tracking-wide text-brand-green">Zhan Finance</span>
        </Link>

        <h1 className="text-3xl font-black uppercase text-brand-green mb-2">{t('auth.register.title')}</h1>
        <p className="text-brand-green/70 mb-6">{t('auth.register.subtitle')}</p>



        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <Input
            id="fullName"
            type="text"
            label={t('auth.register.nameLabel')}
            required
            autoComplete="off"
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
            error={validationErrors.fullName}
            icon={<User className="w-5 h-5" />}
            placeholder={t('auth.register.namePlaceholder')}
          />

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

          {role === 'CLIENT' && (
            <>
              <Input
                id="phone"
                type="tel"
                label={t('auth.register.phoneLabel')}
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                error={validationErrors.phone}
                icon={<Phone className="w-5 h-5" />}
                placeholder="+7 (999) 000-00-00"
              />

              <Input
                id="companyName"
                type="text"
                label={t('auth.register.companyLabel')}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isSubmitting}
                error={validationErrors.companyName}
                icon={<Building2 className="w-5 h-5" />}
                placeholder="OOO Пример"
              />
            </>
          )}

          <Input
            id="password"
            type="password"
            label={t('auth.register.passwordLabel')}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            error={validationErrors.password}
            icon={<Lock className="w-5 h-5" />}
            placeholder="••••••••"
            hint={t('auth.register.passwordHint')}
          />

          {globalError && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {globalError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? t('auth.register.registering') : t('auth.register.registerBtn')}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-green/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-brand-green/50">{t('auth.login.or')}</span>
            </div>
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error(t('auth.login.googleAuthError'))}
              use_fedcm_for_prompt={false}
              itp_support={true}
            />
          </div>
        </div>

        <p className="text-center text-sm text-brand-green/70 mt-6">
          {t('auth.register.hasAccount')}{' '}
          <Link to={`${ROUTES.LOGIN}${searchParams.get('from') ? `?from=${encodeURIComponent(searchParams.get('from')!)}` : ''}`} className="font-bold text-brand-green hover:underline">
            {t('auth.register.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}