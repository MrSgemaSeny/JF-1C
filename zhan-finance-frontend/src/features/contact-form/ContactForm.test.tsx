/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactForm } from './ContactForm';
import { AuthProvider } from '@/features/auth/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import * as http from '@/shared/api/http';
import { GoogleOAuthProvider } from '@react-oauth/google';

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

  it('submits contact form and shows success message', async () => {
    const apiRequestMock = vi.mocked(http.apiRequest).mockResolvedValueOnce({});
    
    renderComponent();
    
    const nameInput = screen.getByPlaceholderText(/Имя Фамилия/i);
    const phoneInput = screen.getByPlaceholderText(/\+7/i);
    const messageInput = screen.getByPlaceholderText(/Расскажите/i);
    
    fireEvent.change(nameInput, { target: { value: 'Ivan Ivanov' } });
    fireEvent.change(phoneInput, { target: { value: '7771234567' } });
    fireEvent.change(messageInput, { target: { value: 'Need help with taxes' } });
    
    const submitButton = screen.getByRole('button', { name: /Отправить заявку/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith('/api/contact-requests', {
        method: 'POST',
        body: expect.stringContaining('"name":"Ivan Ivanov"')
      });
      expect(apiRequestMock.mock.calls[0][1]?.body).toContain('Need help with taxes');
    });
    
    expect(await screen.findByText(/Спасибо!/i)).toBeInTheDocument();
  });
});
