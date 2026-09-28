/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { PaymentHistoryTable } from '../PaymentHistoryTable';
import { PaymentReceiptDto } from '@/entities/billing/api/paymentReceiptApi';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal?: string) => defaultVal || key,
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/entities/billing/api/paymentReceiptApi', () => ({
  paymentReceiptApi: {
    getReceiptFileUrl: vi.fn().mockResolvedValue({ url: 'https://test-presigned-url.com/receipt.pdf' }),
    downloadReceiptFile: vi.fn().mockResolvedValue(new Blob(['pdf'])),
  },
}));

describe('PaymentHistoryTable', () => {
  const mockReceipts: PaymentReceiptDto[] = [
    {
      id: 1,
      clientId: 10,
      clientName: 'ТОО Тест',
      clientEmail: 'test@example.com',
      subscriptionId: 2,
      planName: 'Базовый',
      invoiceId: null,
      invoiceTitle: null,
      amount: 45000,
      currency: 'KZT',
      receiptFileKey: 'receipts/2026/09/test.pdf',
      status: 'AWAITING_REVIEW',
      reviewedById: null,
      reviewedByName: null,
      reviewedAt: null,
      rejectNote: null,
      createdAt: '2026-09-28T10:00:00Z',
      updatedAt: '2026-09-28T10:00:00Z',
    },
    {
      id: 2,
      clientId: 10,
      clientName: 'ТОО Тест',
      clientEmail: 'test@example.com',
      subscriptionId: 2,
      planName: 'Базовый',
      invoiceId: null,
      invoiceTitle: null,
      amount: 45000,
      currency: 'KZT',
      receiptFileKey: 'receipts/2026/09/test2.pdf',
      status: 'REJECTED',
      reviewedById: 1,
      reviewedByName: 'Администратор',
      reviewedAt: '2026-09-28T11:00:00Z',
      rejectNote: 'Неверная сумма перевода',
      createdAt: '2026-09-27T10:00:00Z',
      updatedAt: '2026-09-28T11:00:00Z',
    },
  ];

  it('renders loading indicator when isLoading is true', () => {
    render(<PaymentHistoryTable receipts={[]} isLoading={true} />);
    expect(screen.getByText('Загрузка истории платежей...')).toBeInTheDocument();
  });

  it('renders empty state when receipts list is empty', () => {
    render(<PaymentHistoryTable receipts={[]} isLoading={false} />);
    expect(screen.getByText('История оплат пока пуста')).toBeInTheDocument();
  });

  it('renders receipts table with status and reject note', () => {
    render(<PaymentHistoryTable receipts={mockReceipts} isLoading={false} />);

    expect(screen.getByText('На проверке')).toBeInTheDocument();
    expect(screen.getByText('Отклонен')).toBeInTheDocument();
    expect(screen.getByText('Неверная сумма перевода')).toBeInTheDocument();
  });
});
