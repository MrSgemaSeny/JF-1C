import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { resetPassword } from '@/features/auth/authApi';
import { Input } from '@/shared/ui/Input/Input';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setConfirmError(null);
    setServerError(null);

    if (!token) {
      setServerError(t('resetPassword.tokenInvalidText'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('resetPassword.passwordLengthError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError(t('resetPassword.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err?.message || t('errors.UNKNOWN'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-16 sm:py-24">
        <div className="w-full max-w-md bg-white rounded-3xl border border-brand-green/10 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link to={ROUTES.HOME} className="flex items-center group focus:outline-none" aria-label={t('login.toHome')}>
              <BrandLogo className="h-9 sm:h-10 w-auto group-hover:opacity-85 transition-opacity" />
            </Link>
            <LanguageSwitcher />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-brand-green mb-2">{t('resetPassword.tokenInvalidTitle')}</h1>
            <p className="text-brand-green/70 text-sm leading-relaxed">
              {t('resetPassword.tokenInvalidText')}
            </p>
          </div>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="inline-flex items-center justify-center w-full py-4 bg-brand-green text-brand-beige rounded-2xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/15"
          >
            {t('resetPassword.requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-brand-beige px-4 sm:px-6 py-8 sm:py-12 md:py-14">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-7 sm:p-9 md:p-10 my-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to={ROUTES.HOME} className="flex items-center group focus:outline-none" aria-label={t('login.toHome')}>
            <BrandLogo className="h-9 sm:h-10 w-auto group-hover:opacity-85 transition-opacity" />
          </Link>
          <LanguageSwitcher />
        </div>

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-brand-green mb-2">{t('resetPassword.successTitle')}</h1>
              <p className="text-brand-green/80 text-sm leading-relaxed">
                {t('resetPassword.successText')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="inline-flex items-center justify-center w-full py-4 bg-brand-green text-brand-beige rounded-2xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/15"
            >
              {t('resetPassword.backToLogin')}
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-brand-green mb-2">
              {t('resetPassword.title')}
            </h1>
            <p className="text-brand-green/70 mb-8 text-sm leading-relaxed">
              {t('resetPassword.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="new-password"
                type="password"
                label={t('resetPassword.newPasswordLabel')}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                error={passwordError || undefined}
                icon={<Lock className="w-5 h-5" />}
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                hint={t('resetPassword.passwordHint')}
              />

              <Input
                id="confirm-password"
                type="password"
                label={t('resetPassword.confirmPasswordLabel')}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                error={confirmError || undefined}
                icon={<Lock className="w-5 h-5" />}
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
              />

              {serverError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-green text-brand-beige rounded-2xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/15 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? t('resetPassword.submitting') : t('resetPassword.submitBtn')}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
