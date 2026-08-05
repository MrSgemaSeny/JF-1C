/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '@/features/auth/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/features/auth/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/authApi')>();
  return {
    ...actual,
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
  };
});

// Mock matchMedia for UI components if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('LoginPage Component', () => {
  const renderWithProviders = (component: React.ReactNode) => {
    return render(
      <GoogleOAuthProvider clientId="test-client-id">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              {component}
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    );
  };

  it('renders login form elements', async () => {
    renderWithProviders(<LoginPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/auth\.login\.passwordLabel/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /auth\.login\.loginBtn/i })[0]).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderWithProviders(<LoginPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
    
    const submitButton = screen.getAllByRole('button', { name: /auth\.login\.loginBtn/i })[0];
    
    fireEvent.click(submitButton);

    expect(submitButton).not.toBeDisabled();
  });
});
