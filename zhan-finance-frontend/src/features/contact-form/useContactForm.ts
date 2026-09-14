import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from 'react-i18next';

export function useContactForm() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName && !name) {
      setName(user.fullName);
    }
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, name, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      // ============================================================
      // ПРЕДУПРЕЖДЕНИЕ! НИ В КОЕМ СЛУЧАЕ НЕЛЬЗЯ УБИРАТЬ ЭТОТ БЛОК.
      // Этот вызов сохраняет лид в БД, уведомляет админов через
      // NotificationService и отправляет email-подтверждение лиду.
      // Когда WhatsApp-флоу перестанет быть основным — раскомментировать.
      // ============================================================
      /*
      await apiRequest('/api/v1/contact-requests', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          message,
          source: 'frontend'
        })
      });
      */

      const WA_NUMBER = '77750584021';
      const textLines = [
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        email ? `Email: ${email}` : null,
        message ? `Описание: ${message}` : null,
        `Источник: zhanfinance.kz`
      ].filter(Boolean);

      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textLines.join('\n'))}`;
      setWaUrl(url);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contactForm.error.default', { defaultValue: 'Не удалось сформировать заявку' }));
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    message,
    setMessage,
    submitted,
    waUrl,
    loading,
    error,
    handleSubmit
  };
}
