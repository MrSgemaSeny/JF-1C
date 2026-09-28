/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentModal } from '../PaymentModal';
import { paymentReceiptApi } from '@/entities/billing/api/paymentReceiptApi';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('@/entities/billing/api/paymentReceiptApi', () => ({
  paymentReceiptApi: {
    getRequisites: vi.fn().mockResolvedValue({
      recipientName: 'ТОО ЖАН FINANCE',
      bin: '240140012345',
      iban: 'KZ123456789012345678',
      kbe: '17',
      bankName: 'АО Каспий Банк',
    }),
    submitReceipt: vi.fn().mockResolvedValue({ id: 1, status: 'AWAITING_REVIEW' }),
  },
}));

describe('PaymentModal Component', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PaymentModal
        isOpen={false}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders requisites and form when isOpen is true', async () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        planName="Базовый"
        defaultAmount={45000}
      />
    );

    expect(screen.getByText('Оплата тарифа')).toBeInTheDocument();
    expect(screen.getByText('Базовый')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ТОО ЖАН FINANCE')).toBeInTheDocument();
      expect(screen.getByText('240140012345')).toBeInTheDocument();
    });
  });

  it('switches payment method tabs between Kaspi and Bank', async () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        defaultAmount={45000}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ТОО ЖАН FINANCE')).toBeInTheDocument();
    });

    const bankTab = screen.getByText('Банковский перевод');
    fireEvent.click(bankTab);
    expect(bankTab).toBeInTheDocument();

    const kaspiTab = screen.getByText('Kaspi Перевод / QR');
    fireEvent.click(kaspiTab);
    expect(kaspiTab).toBeInTheDocument();
  });

  it('validates PDF-only file input', async () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        defaultAmount={45000}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(['hello'], 'receipt.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [txtFile] } });

    await waitFor(() => {
      expect(screen.getByText('Разрешены только файлы формата PDF')).toBeInTheDocument();
    });
  });

  it('successfully submits valid form with PDF file', async () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        subscriptionId={10}
        defaultAmount={45000}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['dummy-pdf-content'], 'receipt.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [pdfFile] } });

    const submitBtn = screen.getByText('Отправить чек на проверку');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(paymentReceiptApi.submitReceipt).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Чек успешно отправлен')).toBeInTheDocument();
    });
  });
});
