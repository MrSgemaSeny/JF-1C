/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForgotPasswordPage } from './forgot-password/ForgotPasswordPage';
import { ResetPasswordPage } from './reset-password/ResetPasswordPage';
import * as authApi from '@/features/auth/authApi';

vi.mock('@/features/auth/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/authApi')>();
  return {
    ...actual,
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  };
});

describe('Password Reset Flow (#25)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ForgotPasswordPage', () => {
    it('renders email input and submit button', () => {
      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/Восстановление пароля/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Отправить ссылку/i })).toBeInTheDocument();
    });

    it('submits valid email and shows anti-enumeration confirmation', async () => {
      vi.mocked(authApi.forgotPassword).mockResolvedValueOnce({
        message: 'Если указанный email зарегистрирован, ссылка отправлена',
      });

      render(
        <MemoryRouter>
          <ForgotPasswordPage />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Email/i), {
        target: { value: 'user@example.com' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Отправить ссылку/i }));

      await waitFor(() => {
        expect(authApi.forgotPassword).toHaveBeenCalledWith('user@example.com');
      });

      expect(await screen.findByText(/Проверьте почту/i)).toBeInTheDocument();
      expect(screen.getByText(/Если указанный адрес зарегистрирован/i)).toBeInTheDocument();
    });
  });

  describe('ResetPasswordPage', () => {
    it('displays error state if token parameter is missing', () => {
      render(
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Недействительная ссылка/i)).toBeInTheDocument();
      expect(screen.getByText(/В ссылке отсутствует токен сброса пароля/i)).toBeInTheDocument();
    });

    it('allows resetting password when token is present', async () => {
      vi.mocked(authApi.resetPassword).mockResolvedValueOnce({
        message: 'Пароль успешно изменен',
      });

      render(
        <MemoryRouter initialEntries={['/reset-password?token=valid-secret-token']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Новый пароль/i })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/^Новый пароль/i), {
        target: { value: 'NewStrongPassword123' },
      });
      fireEvent.change(screen.getByLabelText(/Подтверждение пароля/i), {
        target: { value: 'NewStrongPassword123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Сохранить новый пароль/i }));

      await waitFor(() => {
        expect(authApi.resetPassword).toHaveBeenCalledWith({
          token: 'valid-secret-token',
          newPassword: 'NewStrongPassword123',
        });
      });

      expect(await screen.findByText(/Пароль изменен/i)).toBeInTheDocument();
      expect(screen.getByText(/Все активные сессии завершены/i)).toBeInTheDocument();
    });
  });
});
