/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientBillingPage } from '../ClientBillingPage';
import { billingApi } from '@/entities/billing/api/billingApi';
import { paymentReceiptApi } from '@/entities/billing/api/paymentReceiptApi';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValOrOptions?: any) => {
      if (typeof defaultValOrOptions === 'string') return defaultValOrOptions;
      if (defaultValOrOptions && typeof defaultValOrOptions === 'object' && defaultValOrOptions.defaultValue) {
        return defaultValOrOptions.defaultValue;
      }
      return key;
    },
    i18n: { language: 'ru' },
  }),
}));

vi.mock('@/entities/billing/api/billingApi', () => ({
  billingApi: {
    getSubscriptions: vi.fn(),
  },
}));

vi.mock('@/entities/billing/api/paymentReceiptApi', () => ({
  paymentReceiptApi: {
    getMyReceipts: vi.fn(),
    getRequisites: vi.fn(),
    getReceiptFileUrl: vi.fn(),
    submitReceipt: vi.fn(),
  },
}));

describe('ClientBillingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(paymentReceiptApi.getRequisites).mockResolvedValue({
      recipientName: 'ТОО ЖАН FINANCE',
      bin: '240140012345',
      iban: 'KZ123456789012345678',
      kbe: '17',
      bankName: 'АО Каспий Банк',
    });
  });

  it('renders loading state and then subscription data', async () => {
    vi.mocked(billingApi.getSubscriptions).mockResolvedValueOnce([
      {
        id: 1,
        planName: 'Бухгалтерское обслуживание (Стандарт)',
        monthlyPrice: 45000,
        status: 'ACTIVE',
        startsAt: '2026-09-01T00:00:00Z',
        endsAt: '2026-10-01T00:00:00Z',
      },
    ]);
    vi.mocked(paymentReceiptApi.getMyReceipts).mockResolvedValueOnce([]);

    render(<ClientBillingPage />);

    expect(screen.getByText('Тариф и оплата')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Бухгалтерское обслуживание (Стандарт)')).toBeInTheDocument();
      expect(screen.getByText(/45.*000/)).toBeInTheDocument();
      expect(screen.getByText('Активна')).toBeInTheDocument();
      expect(screen.getByText('ТОО ЖАН FINANCE')).toBeInTheDocument();
    });
  });

  it('shows expiring warning banner if endsAt is within 7 days', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    vi.mocked(billingApi.getSubscriptions).mockResolvedValueOnce([
      {
        id: 1,
        planName: 'Бухгалтерский аутсорсинг',
        monthlyPrice: 45000,
        status: 'ACTIVE',
        startsAt: '2026-08-01T00:00:00Z',
        endsAt: futureDate.toISOString(),
      },
    ]);
    vi.mocked(paymentReceiptApi.getMyReceipts).mockResolvedValueOnce([]);

    render(<ClientBillingPage />);

    await waitFor(() => {
      expect(screen.getByText('Ваша подписка скоро истекает')).toBeInTheDocument();
    });
  });

  it('opens PaymentModal when click on renew button', async () => {
    vi.mocked(billingApi.getSubscriptions).mockResolvedValueOnce([
      {
        id: 1,
        planName: 'Бухгалтерский аутсорсинг',
        monthlyPrice: 45000,
        status: 'ACTIVE',
        startsAt: '2026-08-01T00:00:00Z',
        endsAt: '2026-10-01T00:00:00Z',
      },
    ]);
    vi.mocked(paymentReceiptApi.getMyReceipts).mockResolvedValueOnce([]);

    render(<ClientBillingPage />);

    await waitFor(() => {
      expect(screen.getByText('Продлить подписку')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Продлить подписку'));

    await waitFor(() => {
      expect(screen.getByText('Оплата тарифа')).toBeInTheDocument();
    });
  });
});
