/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminPaymentReceiptsPage } from '../AdminPaymentReceiptsPage';
import { paymentReceiptApi, PaymentReceiptDto } from '@/entities/billing/api/paymentReceiptApi';

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

vi.mock('@/shared/ui/Toast/ToastContext', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/entities/billing/api/paymentReceiptApi', () => ({
  paymentReceiptApi: {
    getAllReceipts: vi.fn(),
    confirmReceipt: vi.fn(),
    rejectReceipt: vi.fn(),
    getReceiptFileUrl: vi.fn(),
  },
}));

describe('AdminPaymentReceiptsPage Component', () => {
  const mockReceipts: PaymentReceiptDto[] = [
    {
      id: 101,
      clientId: 5,
      clientName: 'ТОО Астана Логистик',
      clientEmail: 'astana@example.com',
      subscriptionId: 1,
      planName: 'Стандарт',
      invoiceId: 10,
      invoiceTitle: 'Счет #10',
      amount: 45000,
      currency: 'KZT',
      receiptFileKey: 'receipts/2026/09/uuid.pdf',
      status: 'AWAITING_REVIEW',
      reviewedById: null,
      reviewedByName: null,
      reviewedAt: null,
      rejectNote: null,
      createdAt: '2026-09-28T09:00:00Z',
      updatedAt: '2026-09-28T09:00:00Z',
    },
    {
      id: 102,
      clientId: 6,
      clientName: 'ИП Смагулов',
      clientEmail: 'smagulov@example.com',
      subscriptionId: 2,
      planName: 'Базовый',
      invoiceId: null,
      invoiceTitle: null,
      amount: 45000,
      currency: 'KZT',
      receiptFileKey: 'receipts/2026/09/uuid2.pdf',
      status: 'CONFIRMED',
      reviewedById: 1,
      reviewedByName: 'Администратор',
      reviewedAt: '2026-09-28T10:00:00Z',
      rejectNote: null,
      createdAt: '2026-09-27T09:00:00Z',
      updatedAt: '2026-09-28T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, stats, and receipts list', async () => {
    vi.mocked(paymentReceiptApi.getAllReceipts).mockResolvedValue(mockReceipts);

    render(<AdminPaymentReceiptsPage />);

    expect(screen.getByText('Модерация платежей')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ТОО Астана Логистик')).toBeInTheDocument();
      expect(screen.getAllByText(/45.*000/).length).toBeGreaterThan(0);
      expect(screen.getByText('Подтвердить')).toBeInTheDocument();
      expect(screen.getByText('Отклонить')).toBeInTheDocument();
    });
  });

  it('calls confirmReceipt when clicking confirm button', async () => {
    vi.mocked(paymentReceiptApi.getAllReceipts).mockResolvedValue(mockReceipts);
    vi.mocked(paymentReceiptApi.confirmReceipt).mockResolvedValueOnce({
      ...mockReceipts[0],
      status: 'CONFIRMED',
    });

    render(<AdminPaymentReceiptsPage />);

    await waitFor(() => {
      expect(screen.getByText('Подтвердить')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Подтвердить'));

    await waitFor(() => {
      expect(paymentReceiptApi.confirmReceipt).toHaveBeenCalledWith(101);
    });
  });

  it('opens reject modal when clicking reject button', async () => {
    vi.mocked(paymentReceiptApi.getAllReceipts).mockResolvedValue(mockReceipts);

    render(<AdminPaymentReceiptsPage />);

    await waitFor(() => {
      expect(screen.getByText('Отклонить')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Отклонить'));

    await waitFor(() => {
      expect(screen.getByText('Отклонить чек #101')).toBeInTheDocument();
    });
  });
});
