import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { get2FASetup, confirm2FASetup, disable2FA, TwoFactorSetupResponse } from '@/features/auth/authApi';
import { useAuth } from '@/features/auth/AuthContext';
import { toast } from '@/shared/ui/Toast/ToastContext';
import { ShieldCheck, ShieldAlert, QrCode, Lock, KeyRound, Loader2, Copy, CheckCircle2 } from 'lucide-react';

export function AdminSecurityPage() {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();

  const [phase, setPhase] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const is2FAEnabled = user?.role === 'ADMIN'; // Checked via user settings / auth profile

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await get2FASetup();
      setSetupData(data);
      setPhase('setup');
      setConfirmCode('');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData || confirmCode.length !== 6) return;

    setIsLoading(true);
    try {
      await confirm2FASetup(setupData.secret, confirmCode);
      toast.success(t('adminSecurity.enabledSuccess', { defaultValue: 'Двухфакторная аутентификация успешно включена!' }));
      setPhase('idle');
      setSetupData(null);
      setConfirmCode('');
    } catch (err: any) {
      toast.error(err.message || 'Неверный код 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disableCode.length !== 6) return;

    setIsLoading(true);
    try {
      await disable2FA(disableCode);
      toast.success(t('adminSecurity.disabledSuccess', { defaultValue: '2FA успешно отключена' }));
      setPhase('idle');
      setDisableCode('');
    } catch (err: any) {
      toast.error(err.message || 'Неверный код 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
          <div className="p-2.5 bg-gradient-to-r from-brand-green to-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-200">
            <ShieldCheck size={28} />
          </div>
          {t('adminSecurity.title', { defaultValue: 'Безопасность аккаунта и 2FA' })}
        </h1>
        <p className="mt-2 text-base text-gray-500 max-w-2xl leading-relaxed">
          {t('adminSecurity.subtitle', { defaultValue: 'Управление двухфакторной аутентификацией (TOTP) для защиты административного доступа.' })}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-gray-50/80 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${phase === 'setup' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {t('adminSecurity.totpTitle', { defaultValue: 'Google Authenticator / TOTP 2FA' })}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('adminSecurity.totpDesc', { defaultValue: 'Защита входа с помощью 6-значных временных кодов.' })}
              </p>
            </div>
          </div>

          {phase === 'idle' && (
            <button
              onClick={handleStartSetup}
              disabled={isLoading}
              className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-brand-green/20 flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
              {t('adminSecurity.enableBtn', { defaultValue: 'Настроить 2FA' })}
            </button>
          )}
        </div>

        {/* Setup Flow */}
        {phase === 'setup' && setupData && (
          <div className="p-6 border border-emerald-100 bg-emerald-50/30 rounded-2xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-green" />
              {t('adminSecurity.stepTitle', { defaultValue: 'Инструкция по подключению 2FA' })}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-200 shadow-inner">
                <img src={setupData.qrCodeImage} alt="2FA QR Code" className="w-48 h-48 rounded-lg" />
                <span className="text-xs text-gray-400 mt-2 font-mono">Scan QR in Authenticator App</span>
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <ol className="list-decimal list-inside space-y-2 font-medium text-gray-800">
                  <li>Установите **Google Authenticator**, **Authy** или **1Password**.</li>
                  <li>Отсканируйте QR-код слева в приложении.</li>
                  <li>Или введите ключ секретного кода вручную:</li>
                </ol>

                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 font-mono text-xs font-bold text-gray-900 break-all">
                  <span className="flex-1">{setupData.secret}</span>
                  <button
                    onClick={copySecret}
                    className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors shrink-0"
                    title="Скопировать ключ"
                  >
                    {copiedSecret ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmSetup} className="space-y-4 pt-4 border-t border-emerald-100">
              <label className="block text-sm font-semibold text-gray-900">
                {t('adminSecurity.enterCodePrompt', { defaultValue: 'Введите 6-значный код из приложения для активации:' })}
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <input
                  type="text"
                  maxLength={6}
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green outline-none"
                />
                <button
                  type="submit"
                  disabled={confirmCode.length !== 6 || isLoading}
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-brand-green/20 disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Активировать'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Disable Modal / Inline */}
        {phase === 'disable' && (
          <form onSubmit={handleDisable2FA} className="p-6 border border-red-100 bg-red-50/30 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Отключение двухфакторной аутентификации
            </h3>
            <p className="text-sm text-gray-600">
              Для подтверждения отключения 2FA введите текущий 6-значный код из вашего приложения Authenticator:
            </p>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="text"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button
                type="submit"
                disabled={disableCode.length !== 6 || isLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-50 shrink-0"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Отключить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
