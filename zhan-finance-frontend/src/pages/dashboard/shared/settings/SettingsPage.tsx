import { useState, useEffect, useRef } from 'react';
import { Camera, Lock, User, Save, Upload, Shield, Building2, Phone } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { getMyProfile, updateMyProfile, updateMyPassword, uploadAvatar, UserProfileDto } from '@/entities/user/api/userApi';
import { Spinner } from '@/shared/ui/Spinner';
import { API_BASE_URL } from '@/shared/api/http';

export function SettingsPage() {
  const { user, setUser } = useAuth();
  
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

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getMyProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
      setCompanyName(data.companyName || '');
    } catch (e: any) {
      setProfileError(e.message || 'Ошибка при загрузке профиля');
    } finally {
      setIsLoading(false);
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
      setProfileError(e.message || 'Не удалось сохранить профиль');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Пароль должен содержать минимум 8 символов');
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
      setPasswordError(e.message || 'Не удалось изменить пароль');
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 2MB.');
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
      alert(err.message || 'Ошибка загрузки фото');
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Spinner /></div>;
  }

  if (!profile) {
    return <div className="text-red-500">Не удалось загрузить данные пользователя</div>;
  }

  const isGoogle = profile.authProvider === 'GOOGLE';

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Настройки профиля</h1>
          <p className="text-gray-500 mt-1">Управляйте вашими личными данными и настройками безопасности</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Profile Card (Avatar + Form) */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white overflow-hidden p-8">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            
            {/* Left side: Avatar & Identity */}
            <div className="flex-shrink-0 flex flex-col items-center text-center md:w-48">
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg relative ring-4 ring-brand-green/10">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${API_BASE_URL}${profile.avatarUrl}`}
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
                  Вход через Google. Аватарка синхронизирована.
                </p>
              )}
            </div>

            {/* Right side: Profile Form */}
            <div className="flex-grow w-full">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Основная информация</h3>
                <p className="text-sm text-gray-500 mt-1">Отредактируйте свои личные данные</p>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Полное Имя</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email (Только чтение)</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Телефон</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">ИП / ТОО</label>
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
                {profileSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">Профиль успешно обновлен</div>}

                <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-green to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-brand-green/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {isSavingProfile ? <Spinner className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
                    Сохранить изменения
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white overflow-hidden p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">Безопасность</h3>
            <p className="text-sm text-gray-500 mt-1">Обновите ваш пароль для защиты аккаунта</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {isGoogle ? (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm">
                <Shield className="w-5 h-5 shrink-0 text-blue-600" />
                Вы вошли через Google, поэтому смена пароля здесь недоступна. Управляйте безопасностью в аккаунте Google.
              </div>
            ) : (
              <div className="max-w-2xl">
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Текущий пароль</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Новый пароль</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Повторите пароль</label>
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
                {passwordSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 mt-5">Пароль успешно изменен</div>}

                <div className="flex justify-start pt-6 border-t border-gray-100 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isSavingPassword ? 'Сохранение...' : 'Обновить пароль'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
