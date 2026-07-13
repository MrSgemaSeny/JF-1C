import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Phone, Sparkles } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { ApiError } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { updateMyProfile } from '@/entities/user/api/userApi';
import { useTranslation } from 'react-i18next';

export function CompleteProfilePage() {
  const { t } = useTranslation(['common']);
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
      await updateMyProfile({
        fullName: user?.fullName || 'Google User',
        phone,
        companyName
      });
      navigate(ROUTES.PROFILE);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.completeProfile.saveError'));
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
          <h1 className="text-3xl font-black uppercase text-brand-green">{t('auth.completeProfile.title')}</h1>
        </div>
        <p className="text-brand-green/70 mb-8 leading-relaxed">
          {t('auth.completeProfile.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-brand-green mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              {t('auth.completeProfile.phoneLabel')}
            </label>
            <input
              id="phone"
              type="text"
              autoComplete="tel"
              maxLength={32}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder={t('auth.completeProfile.phonePlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-bold text-brand-green mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {t('auth.completeProfile.companyLabel')}
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              maxLength={255}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/15 focus:outline-none focus:ring-2 focus:ring-brand-green/30 text-brand-green"
              placeholder={t('auth.completeProfile.companyPlaceholder')}
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
            {isSubmitting ? t('auth.completeProfile.saving') : t('auth.completeProfile.saveBtn')}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full mt-3 py-2.5 text-sm font-bold text-brand-green/50 hover:text-brand-green/80 transition-colors"
        >
          {t('auth.completeProfile.skip')}
        </button>
      </div>
    </div>
  );
}
