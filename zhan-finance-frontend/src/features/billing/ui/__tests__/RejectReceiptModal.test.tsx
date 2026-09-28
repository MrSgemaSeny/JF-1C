/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RejectReceiptModal } from '../RejectReceiptModal';
import { paymentReceiptApi } from '@/entities/billing/api/paymentReceiptApi';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal?: string) => defaultVal || key,
    i18n: { language: 'ru' },
  }),
}));

vi.mock('@/entities/billing/api/paymentReceiptApi', () => ({
  paymentReceiptApi: {
    rejectReceipt: vi.fn().mockResolvedValue({ id: 42, status: 'REJECTED' }),
  },
}));

describe('RejectReceiptModal Component', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false or receiptId is null', () => {
    const { container: c1 } = render(
      <RejectReceiptModal
        isOpen={false}
        receiptId={42}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <RejectReceiptModal
        isOpen={true}
        receiptId={null}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('renders reject form when open', () => {
    render(
      <RejectReceiptModal
        isOpen={true}
        receiptId={42}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('Отклонить чек #42')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например: неверная сумма, не читается квитанция, платеж не поступил на расчетный счет')).toBeInTheDocument();
  });

  it('submits rejection with note and calls onSuccess', async () => {
    render(
      <RejectReceiptModal
        isOpen={true}
        receiptId={42}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText('Например: неверная сумма, не читается квитанция, платеж не поступил на расчетный счет');
    fireEvent.change(textarea, { target: { value: 'Платеж не найден в выписке' } });

    const submitBtn = screen.getByText('Подтвердить отклонение');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(paymentReceiptApi.rejectReceipt).toHaveBeenCalledWith(42, 'Платеж не найден в выписке');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
