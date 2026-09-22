import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { forgotPassword } from '@/features/auth/authApi';
import { Input } from '@/shared/ui/Input/Input';
import { z } from 'zod';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const emailSchema = z.string().email();

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setServerError(null);

    const parseResult = emailSchema.safeParse(email.trim());
    if (!parseResult.success) {
      setValidationError(t('forgotPassword.emailError'));
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setServerError(err?.message || t('errors.UNKNOWN'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-brand-beige px-4 sm:px-6 py-6 sm:py-12 md:py-14">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-6 sm:p-9 md:p-10 my-auto">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Link to={ROUTES.HOME} className="flex items-center group focus:outline-none shrink-0" aria-label={t('login.toHome')}>
            <BrandLogo className="h-7 sm:h-9 md:h-10 w-auto group-hover:opacity-85 transition-opacity" />
          </Link>
          <LanguageSwitcher />
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-brand-green mb-2">{t('forgotPassword.successTitle')}</h1>
              <p className="text-brand-green/80 text-sm leading-relaxed">
                {t('forgotPassword.successText')}
              </p>
            </div>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center w-full py-4 bg-brand-green text-brand-beige rounded-2xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/15"
            >
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-brand-green mb-2">
              {t('forgotPassword.title')}
            </h1>
            <p className="text-brand-green/70 mb-8 text-sm leading-relaxed">
              {t('forgotPassword.subtitle')}
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                id="reset-email"
                type="email"
                label={t('forgotPassword.emailLabel')}
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                error={validationError || undefined}
                icon={<Mail className="w-5 h-5" />}
                placeholder={t('forgotPassword.emailPlaceholder')}
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
                {isSubmitting ? t('forgotPassword.submitting') : t('forgotPassword.submitBtn')}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
