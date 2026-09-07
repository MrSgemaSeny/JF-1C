import { useState, FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { resetPassword } from '@/features/auth/authApi';
import { Input } from '@/shared/ui/Input/Input';
import LogoImage from '@/shared/assets/icons/logo.png';

export function ResetPasswordPage() {
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
      setServerError('Отсутствует токен сброса пароля. Запросите новую ссылку.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Пароль должен содержать не менее 8 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err?.message || 'Не удалось сбросить пароль. Возможно, срок действия ссылки истек.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
        <div className="w-full max-w-md bg-white rounded-3xl border border-brand-green/10 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-brand-green mb-2">Недействительная ссылка</h1>
            <p className="text-brand-green/70 text-sm leading-relaxed">
              В ссылке отсутствует токен сброса пароля или ссылка повреждена. Запросите новую ссылку для сброса.
            </p>
          </div>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="inline-flex items-center justify-center w-full py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all"
          >
            Запросить новую ссылку
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

        {isSuccess ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-brand-green mb-2">Пароль изменен</h1>
              <p className="text-brand-green/80 text-sm leading-relaxed">
                Ваш пароль успешно обновлен. Все активные сессии завершены для вашей безопасности. Войдите с новым паролем.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="inline-flex items-center justify-center w-full py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all"
            >
              Войти в аккаунт
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-brand-green mb-2">
              Новый пароль
            </h1>
            <p className="text-brand-green/70 mb-8 text-sm">
              Придумайте надежный пароль (минимум 8 символов).
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="new-password"
                type="password"
                label="Новый пароль"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                error={passwordError || undefined}
                icon={<Lock className="w-5 h-5" />}
                placeholder="Минимум 8 символов"
              />

              <Input
                id="confirm-password"
                type="password"
                label="Подтверждение пароля"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                error={confirmError || undefined}
                icon={<Lock className="w-5 h-5" />}
                placeholder="Повторите пароль"
              />

              {serverError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить новый пароль'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
