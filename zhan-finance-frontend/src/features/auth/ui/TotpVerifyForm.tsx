import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { verify2FA, AuthResponse } from '@/features/auth/authApi';
import { Lock, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  preAuthToken: string;
  onSuccess: (response: AuthResponse) => void;
  onBack: () => void;
}

export function TotpVerifyForm({ preAuthToken, onSuccess, onBack }: Props) {
  const { t } = useTranslation(['common']);
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setCode(digits);
      inputRefs.current[5]?.focus();
      submitCode(pasted);
    }
  };

  const fullCode = code.join('');

  const submitCode = async (codeToSubmit: string) => {
    if (codeToSubmit.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await verify2FA({ preAuthToken, code: codeToSubmit });
      onSuccess(response);
    } catch (err: any) {
      setError(t('auth.totp.invalidCode', { defaultValue: 'Неверный код 2FA. Проверьте точное время на устройстве.' }));
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (fullCode.length === 6) {
      submitCode(fullCode);
    }
  }, [fullCode]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-green/20 shadow-sm">
          <Lock size={28} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          {t('auth.totp.title', { defaultValue: 'Двухфакторная аутентификация' })}
        </h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          {t('auth.totp.subtitle', { defaultValue: 'Введите 6-значный код из приложения Authenticator на вашем устройстве' })}
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-center gap-2 sm:gap-3 my-4">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isSubmitting}
            className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition-all disabled:opacity-50"
          />
        ))}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => submitCode(fullCode)}
          disabled={fullCode.length !== 6 || isSubmitting}
          className="w-full py-3.5 bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-green/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('auth.totp.verifying', { defaultValue: 'Проверка...' })}</span>
            </>
          ) : (
            t('auth.totp.confirmBtn', { defaultValue: 'Подтвердить вход' })
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={16} />
          {t('auth.totp.backBtn', { defaultValue: 'Вернуться к вводу пароля' })}
        </button>
      </div>

      <div className="pt-6 space-y-4">
        <div className="p-4 bg-amber-50/80 border border-amber-200/50 rounded-xl">
          <p className="text-xs text-amber-800 leading-relaxed text-center">
            <strong>Внимание:</strong> Если вы попали на эту страницу случайно или подозреваете, что кто-то другой пытается войти в ваш аккаунт, немедленно свяжитесь с поддержкой и смените пароль.
          </p>
        </div>
        
        <p className="text-xs text-gray-400 text-center">
          Продолжая, вы соглашаетесь с нашей{' '}
          <a href="/privacy-policy" className="text-brand-green hover:underline font-medium">
            Политикой конфиденциальности
          </a>
        </p>
      </div>
    </div>
  );
}
