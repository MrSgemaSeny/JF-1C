/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactForm } from './ContactForm';
import { AuthProvider } from '@/features/auth/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import * as http from '@/shared/api/http';
import { GoogleOAuthProvider } from '@react-oauth/google';

vi.mock('@/features/auth/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/authApi')>();
  return {
    ...actual,
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
  };
});

vi.mock('@/shared/api/http', () => ({
  apiRequest: vi.fn(),
  configureAuth: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
}));

describe('ContactForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <GoogleOAuthProvider clientId="test">
      <AuthProvider>
        <BrowserRouter>
          <ContactForm showMessage={true} />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );

  it('submits contact form and shows WhatsApp readiness screen with QR code', async () => {
    renderComponent();
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
    
    const nameInput = screen.getByPlaceholderText(/Имя Фамилия/i);
    const phoneInput = screen.getByPlaceholderText(/\+7/i);
    const messageInput = screen.getByPlaceholderText(/Расскажите/i);
    
    fireEvent.change(nameInput, { target: { value: 'Ivan Ivanov' } });
    fireEvent.change(phoneInput, { target: { value: '7771234567' } });
    fireEvent.change(messageInput, { target: { value: 'Need help with taxes' } });
    
    const submitButton = screen.getByRole('button', { name: /Отправить заявку/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/Заявка сформирована!/i)).toBeInTheDocument();
    
    const openWhatsAppBtn = screen.getByRole('link', { name: /Открыть WhatsApp/i });
    expect(openWhatsAppBtn).toBeInTheDocument();
    expect(openWhatsAppBtn).toHaveAttribute('href', expect.stringContaining('https://wa.me/77750584021'));
    expect(openWhatsAppBtn).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('Ivan Ivanov')));
  });

  it('rejects email containing Cyrillic characters and prevents submission', async () => {
    renderComponent();
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    const nameInput = screen.getByPlaceholderText(/Имя Фамилия/i);
    const phoneInput = screen.getByPlaceholderText(/\+7/i);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);

    fireEvent.change(nameInput, { target: { value: 'Ivan Ivanov' } });
    fireEvent.change(phoneInput, { target: { value: '7771234567' } });
    fireEvent.change(emailInput, { target: { value: 'asda@хуй' } });

    const submitButton = screen.getByRole('button', { name: /Отправить заявку/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/латинскими буквами/i)).toBeInTheDocument();
    expect(screen.queryByText(/Заявка сформирована!/i)).not.toBeInTheDocument();
  });

  it('rejects invalid email format and prevents submission', async () => {
    renderComponent();
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    const nameInput = screen.getByPlaceholderText(/Имя Фамилия/i);
    const phoneInput = screen.getByPlaceholderText(/\+7/i);
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);

    fireEvent.change(nameInput, { target: { value: 'Ivan Ivanov' } });
    fireEvent.change(phoneInput, { target: { value: '7771234567' } });
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitButton = screen.getByRole('button', { name: /Отправить заявку/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Некорректный формат email/i)).toBeInTheDocument();
    expect(screen.queryByText(/Заявка сформирована!/i)).not.toBeInTheDocument();
  });

  it('displays live error immediately while typing Cyrillic characters without submitting', async () => {
    renderComponent();
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'asda@хуй' } });

    expect(screen.getByText(/латинскими буквами/i)).toBeInTheDocument();
  });
});

