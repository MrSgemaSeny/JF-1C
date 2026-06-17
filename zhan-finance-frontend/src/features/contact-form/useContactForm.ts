import { useState } from 'react';

export function useContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    console.log('Contact form submitted', { name, phone });
  }

  return {
    name,
    setName,
    phone,
    setPhone,
    submitted,
    handleSubmit
  };
}
