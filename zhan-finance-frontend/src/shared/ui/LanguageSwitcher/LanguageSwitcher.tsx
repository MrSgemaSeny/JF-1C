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
    <div className="flex items-center bg-brand-green/5 border border-brand-green/10 rounded-full p-1 shadow-sm">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleLanguageChange(code)}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            i18n.language === code 
              ? 'bg-brand-green text-brand-beige shadow-md' 
              : 'text-brand-green/70 hover:text-brand-green hover:bg-brand-green/10'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
