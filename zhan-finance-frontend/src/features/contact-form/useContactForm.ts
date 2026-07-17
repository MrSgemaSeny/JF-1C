import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from 'react-i18next';

export function useContactForm() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName && !name) {
      setName(user.fullName);
    }
  }, [user, name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('/api/contact-requests', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          message,
          source: 'frontend'
        })
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contactForm.error.default', { defaultValue: 'Не удалось отправить заявку' }));
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    phone,
    setPhone,
    message,
    setMessage,
    submitted,
    loading,
    error,
    handleSubmit
  };
}
