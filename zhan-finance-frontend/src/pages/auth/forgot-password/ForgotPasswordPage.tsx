import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/shared/config/routes';
import { forgotPassword } from '@/features/auth/authApi';
import { Input } from '@/shared/ui/Input/Input';
import { z } from 'zod';
import LogoImage from '@/shared/assets/icons/logo.png';

const emailSchema = z.string().email('Введите корректный адрес электронной почты');

export function ForgotPasswordPage() {
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
      setValidationError(parseResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setServerError(err?.message || 'Произошла ошибка при отправке запроса. Повторите попытку позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-beige px-6 py-24">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-brand-green/10 p-8 sm:p-10">
        <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-8">
          <img src={LogoImage} alt="Zhan Finance Logo" className="w-10 h-10 rounded-xl object-contain" />
          <span className="font-black text-xl uppercase tracking-wide text-brand-green">Zhan Finance</span>
        </Link>

        {isSubmitted ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase text-brand-green mb-2">Проверьте почту</h1>
              <p className="text-brand-green/80 text-sm leading-relaxed">
                Если указанный адрес зарегистрирован в системе, мы отправили на него ссылку для восстановления пароля. Ссылка действительна в течение 15 минут.
              </p>
            </div>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center justify-center w-full py-3.5 bg-brand-green text-brand-beige rounded-xl font-bold uppercase tracking-wider hover:bg-brand-green/90 transition-all"
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-brand-green mb-2">
              Восстановление пароля
            </h1>
            <p className="text-brand-green/70 mb-8 text-sm">
              Введите email вашей учетной записи, и мы отправим ссылку для сброса пароля.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="reset-email"
                type="email"
                label="Email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                error={validationError || undefined}
                icon={<Mail className="w-5 h-5" />}
                placeholder="example@gmail.com"
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
                {isSubmitting ? 'Отправка ссылки...' : 'Отправить ссылку'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-green hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Вернуться к форме входа
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
