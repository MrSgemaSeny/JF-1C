import { useState } from 'react';
import { apiRequest } from '@/shared/api/http';

export function useContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          source: 'frontend'
        })
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    phone,
    setPhone,
    submitted,
    loading,
    error,
    handleSubmit
  };
}
