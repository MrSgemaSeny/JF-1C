import { useState, useEffect, useRef } from 'react';
import { Camera, Lock, User, Save, Shield, Building2, Phone, Globe, MessageCircle, ExternalLink, Unlink, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { getMyProfile, updateMyProfile, updateMyPassword, uploadAvatar, UserProfileDto } from '@/entities/user/api/userApi';
import { Spinner } from '@/shared/ui/Spinner';
import { getSecureImageUrl, apiRequest } from '@/shared/api/http';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';

interface TelegramStatus {
  linked: boolean;
  chatId?: number;
  telegramUsername?: string;
  linkedAt?: string;
}

interface TelegramLinkToken {
  token: string;
  deepLink: string;
  expiresAt: string;
}

export function SettingsPage() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation(['common']);

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Avatar Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Telegram
  const [tgStatus, setTgStatus] = useState<TelegramStatus | null>(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [tgLinkData, setTgLinkData] = useState<TelegramLinkToken | null>(null);
  const [tgGenerating, setTgGenerating] = useState(false);
  const [tgUnlinking, setTgUnlinking] = useState(false);

  useEffect(() => {
    loadProfile();
    loadTelegramStatus();
  }, []);

  async function loadProfile() {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
      setCompanyName(data.companyName || '');
    } catch (e: any) {
      setProfileError(e.message || t('settings.errors.loadProfile'));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTelegramStatus() {
    try {
      const data = await apiRequest<TelegramStatus>('/api/v1/telegram/link/status');
      setTgStatus(data);
    } catch {
      setTgStatus({ linked: false });
    } finally {
      setTgLoading(false);
    }
  }

  async function handleGenerateTgLink() {
    setTgGenerating(true);
    setTgLinkData(null);
    try {
      const data = await apiRequest<TelegramLinkToken>('/api/v1/telegram/link/generate', { method: 'POST' });
      setTgLinkData(data);
    } catch (e: any) {
      alert(e.message || 'Ошибка генерации ссылки');
    } finally {
      setTgGenerating(false);
    }
  }

  async function handleUnlinkTelegram() {
    if (!confirm('Отвязать Telegram-аккаунт?')) return;
    setTgUnlinking(true);
    try {
      await apiRequest('/api/v1/telegram/link', { method: 'DELETE' });
      setTgStatus({ linked: false });
      setTgLinkData(null);
    } catch (e: any) {
      alert(e.message || 'Ошибка отвязки');
    } finally {
      setTgUnlinking(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setIsSavingProfile(true);

    try {
      const updated = await updateMyProfile({
        fullName,
        ...(profile?.role === 'CLIENT' ? { phone, companyName } : {})
      });
      setProfile(updated);
      setProfileSuccess(true);
      if (user) {
        setUser({ ...user, fullName: updated.fullName });
      }
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e: any) {
      setProfileError(e.message || t('settings.errors.saveProfile'));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.errors.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('settings.errors.passwordLength'));
      return;
    }

    setIsSavingPassword(true);
    try {
      await updateMyPassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (e: any) {
      setPasswordError(e.message || t('settings.errors.savePassword'));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(t('settings.errors.fileTooLarge'));
      return;
    }

    setIsUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      if (user) {
        setUser({ ...user, avatarUrl: updated.avatarUrl });
      }
    } catch (err: any) {
      alert(err.message || t('settings.errors.uploadAvatar'));
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  if (!profile) {
    return <div className="text-red-500">{t('settings.errors.loadUserData')}</div>;
  }

  const isGoogle = profile.authProvider === 'GOOGLE';

  return (
    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Left: Avatar */}
            <div className="flex-shrink-0 flex flex-col items-center text-center md:w-48">
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg relative ring-4 ring-brand-green/10">
                  {profile.avatarUrl ? (
                    <img
                      src={getSecureImageUrl(profile.avatarUrl)}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-green/5 text-brand-green">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Spinner className="w-6 h-6 text-brand-green" />
                    </div>
                  )}
                </div>
                {!isGoogle && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute bottom-1 right-1 p-2.5 bg-brand-green text-white rounded-full shadow-lg shadow-brand-green/40 hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green">
                <Shield className="w-4 h-4" />
                {profile.role}
              </div>
              {isGoogle && (
                <p className="mt-4 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  {t('settings.googleSync')}
                </p>
              )}
            </div>

            {/* Right: Profile Form */}
            <div className="flex-grow w-full">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t('settings.basicInfo')}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('settings.basicInfoDesc')}</p>
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.fullName')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green shadow-sm transition-all"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.emailReadonly')}</label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed shadow-inner"
                    />
                  </div>
                  {profile.role === 'CLIENT' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.phone')}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Phone className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green shadow-sm transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.companyName')}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green shadow-sm transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {profileError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{profileError}</div>}
                {profileSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">{t('settings.success.profile')}</div>}
                <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-green to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-brand-green/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {isSavingProfile ? <Spinner className="w-4 h-4 text-white" /> : <Shield className="w-4 h-4" />}
                    {t('settings.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        {!isGoogle && profile.role !== 'CURATOR' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('settings.securityTitle')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('settings.changePasswordDesc')}</p>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="max-w-2xl">
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.currentPassword')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green shadow-sm transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.newPassword')}</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green shadow-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.confirmPassword')}</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green shadow-sm transition-all"
                    />
                  </div>
                </div>
                {passwordError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-5">{passwordError}</div>}
                {passwordSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 mt-5">{t('settings.success.password')}</div>}
                <div className="flex justify-start pt-6 border-t border-gray-100 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSavingPassword ? t('settings.saving') : t('settings.updatePasswordBtn')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Language Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-brand-green" />
                <h3 className="text-xl font-bold text-gray-900">{t('settings.language', 'Язык интерфейса')}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">{t('settings.languageDesc', 'Выберите предпочтительный язык для отображения интерфейса')}</p>
            </div>
            <div className="pt-2 sm:pt-0">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Telegram Link Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#2AABEE]" />
            <h3 className="text-xl font-bold text-gray-900">Telegram</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Привяжите Telegram-аккаунт, чтобы получать уведомления о задачах, счетах и сообщениях прямо в бот.
          </p>

          {tgLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Spinner className="w-4 h-4" /> Загрузка...
            </div>
          ) : tgStatus?.linked ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-green-50 border border-green-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-green-700">Привязан</p>
                {tgStatus.telegramUsername && (
                  <p className="text-sm text-gray-600 mt-0.5">@{tgStatus.telegramUsername}</p>
                )}
              </div>
              <button
                onClick={handleUnlinkTelegram}
                disabled={tgUnlinking}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {tgUnlinking ? <Spinner className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                Отвязать
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tgLinkData ? (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                  <p className="text-sm text-gray-600">
                    Ссылка действительна 15 минут. Нажмите кнопку ниже, чтобы открыть бота и завершить привязку.
                  </p>
                  <a
                    href={tgLinkData.deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2AABEE] text-white text-sm font-semibold rounded-xl hover:bg-[#1e96d3] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Открыть в Telegram
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                  <button
                    onClick={handleGenerateTgLink}
                    disabled={tgGenerating}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Обновить ссылку
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGenerateTgLink}
                  disabled={tgGenerating}
                  className="flex items-center gap-2 px-6 py-3 bg-[#2AABEE] text-white font-semibold rounded-xl hover:bg-[#1e96d3] hover:shadow-md transition-all disabled:opacity-60"
                >
                  {tgGenerating ? <Spinner className="w-4 h-4 text-white" /> : <MessageCircle className="w-4 h-4" />}
                  Подключить Telegram
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
