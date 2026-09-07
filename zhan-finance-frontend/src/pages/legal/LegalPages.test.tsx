/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsPage } from './TermsPage';
import { RefundPolicyPage } from './RefundPolicyPage';
import { CookiePolicyPage } from './CookiePolicyPage';
import { CookieConsent } from '@/widgets/cookie-consent/CookieConsent';
import { AuthProvider } from '@/features/auth/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/features/auth/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth/authApi')>();
  return {
    ...actual,
    getMe: vi.fn().mockRejectedValue(new Error('Unauthenticated')),
  };
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithRouter(component: React.ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Legal Pages and Compliance (#3, #4, #7, #10, #15, #16)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders PrivacyPolicyPage with Kazakhstan Law compliance and Article 12 data localization', async () => {
    renderWithRouter(<PrivacyPolicyPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    expect(screen.getByRole('heading', { name: /Политика конфиденциальности/i })).toBeInTheDocument();
    expect(screen.getAllByText(/персональных данных и их защите/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Локализация и хранение баз данных/i)).toBeInTheDocument();
    expect(screen.getAllByText(/240140023819/i)[0]).toBeInTheDocument();
  });

  it('renders TermsPage with public offer terms and tax calculation disclaimer', async () => {
    renderWithRouter(<TermsPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    expect(screen.getByRole('heading', { name: /Пользовательское соглашение/i })).toBeInTheDocument();
    expect(screen.getByText(/Разграничение ответственности и налоговый дисклеймер/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ТОО «ZhanFinance»/i)[0]).toBeInTheDocument();
  });

  it('renders RefundPolicyPage with prorated subscriptions and 14-day review rules', async () => {
    renderWithRouter(<RefundPolicyPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    expect(screen.getByRole('heading', { name: /Политика возврата средств/i })).toBeInTheDocument();
    expect(screen.getByText(/Возврат средств за тарифные подписки/i)).toBeInTheDocument();
    expect(screen.getByText(/Срок рассмотрения заявки — не более 14 рабочих дней/i)).toBeInTheDocument();
  });

  it('renders CookiePolicyPage with technical cookies disclosure table', async () => {
    renderWithRouter(<CookiePolicyPage />);
    await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));

    expect(screen.getByRole('heading', { name: /Политика использования файлов Cookie/i })).toBeInTheDocument();
    expect(screen.getByText(/refreshToken/i)).toBeInTheDocument();
    expect(screen.getByText(/cookie_consent/i)).toBeInTheDocument();
  });

  it('shows CookieConsent banner when no consent is stored and records preference', async () => {
    render(
      <BrowserRouter>
        <CookieConsent />
      </BrowserRouter>
    );

    const bannerHeading = await waitFor(() => screen.getByText(/Мы используем файлы cookie/i), { timeout: 2500 });
    expect(bannerHeading).toBeInTheDocument();

    const acceptBtn = screen.getByRole('button', { name: /Принять всё/i });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem('cookie_consent')).toBe('accepted');
    expect(screen.queryByText(/Мы используем файлы cookie/i)).not.toBeInTheDocument();
  });
});
