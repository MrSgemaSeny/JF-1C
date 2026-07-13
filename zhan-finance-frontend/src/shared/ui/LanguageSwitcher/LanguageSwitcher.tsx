import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';

const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
] as const;

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const handleLanguageChange = async (code: string) => {
    i18n.changeLanguage(code);
    
    if (user) {
      try {
        await apiRequest('/api/users/me/locale', {
          method: 'PATCH',
          body: JSON.stringify({ locale: code })
        });
      } catch (e) {
        console.error('Failed to update locale', e);
      }
    }
  };

  return (
    <div className="flex gap-2 items-center">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleLanguageChange(code)}
          className={`text-sm hover:text-brand-green transition-colors ${
            i18n.language === code 
              ? 'font-bold text-brand-green bg-green-50 px-2 py-0.5 rounded' 
              : 'text-gray-500 font-medium'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
