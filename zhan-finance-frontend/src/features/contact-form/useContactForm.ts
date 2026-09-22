import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from 'react-i18next';

export function useContactForm() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
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

  function validateEmail(val: string): boolean {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError(null);
      return true;
    }
    if (/[^\x00-\x7F]/.test(trimmed)) {
      setEmailError(t('contactForm.errors.latinOnly', {
        defaultValue: 'Пожалуйста, укажите email латинскими буквами (например, name@example.com). Кириллические адреса не поддерживаются.'
      }));
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t('contactForm.errors.invalidEmail', {
        defaultValue: 'Некорректный формат email. Пример: name@example.com'
      }));
      return false;
    }
    setEmailError(null);
    return true;
  }

  function handleEmailChange(val: string) {
    setEmail(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError(null);
      return;
    }
    // Если введены нелатинские символы — показываем ошибку мгновенно
    if (/[^\x00-\x7F]/.test(trimmed)) {
      setEmailError(t('contactForm.errors.latinOnly', {
        defaultValue: 'Пожалуйста, укажите email латинскими буквами (например, name@example.com). Кириллические адреса не поддерживаются.'
      }));
      return;
    }
    // Если уже есть знак @, проверяем валидность формата домена
    if (trimmed.includes('@')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmed)) {
        setEmailError(t('contactForm.errors.invalidEmail', {
          defaultValue: 'Некорректный формат email. Пример: name@example.com'
        }));
        return;
      }
    }
    setEmailError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    let hasError = false;
    if (!name.trim()) {
      setNameError(t('common:required', { defaultValue: 'Введите ваше имя' }));
      hasError = true;
    } else {
      setNameError(null);
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanPhone.length < 11) {
      setPhoneError(t('contactForm.errors.invalidPhone', { defaultValue: 'Введите корректный номер' }));
      hasError = true;
    } else {
      setPhoneError(null);
    }

    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

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
      const trimmedEmail = email.trim();
      const textLines = [
        `Имя: ${name.trim()}`,
        `Телефон: ${phone.trim()}`,
        trimmedEmail ? `Email: ${trimmedEmail}` : null,
        message.trim() ? `Описание: ${message.trim()}` : null,
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
    setName: (val: string) => {
      setName(val);
      if (nameError) setNameError(null);
    },
    nameError,
    phone,
    setPhone: (val: string) => {
      setPhone(val);
      if (phoneError) setPhoneError(null);
    },
    phoneError,
    email,
    setEmail: handleEmailChange,
    validateEmail,
    emailError,
    message,
    setMessage,
    submitted,
    waUrl,
    loading,
    error,
    handleSubmit
  };
}
