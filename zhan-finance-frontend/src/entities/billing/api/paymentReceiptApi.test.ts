import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentReceiptApi } from './paymentReceiptApi';
import * as http from '@/shared/api/http';

vi.mock('@/shared/api/http', () => ({
  apiRequest: vi.fn(),
  API_BASE_URL: 'http://localhost:8080',
}));

describe('paymentReceiptApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submitReceipt sends multipart FormData to /api/v1/billing/receipts', async () => {
    const mockReceipt = { id: 1, amount: 45000, status: 'AWAITING_REVIEW' };
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockReceipt);

    const formData = new FormData();
    formData.append('amount', '45000');

    const result = await paymentReceiptApi.submitReceipt(formData);

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/billing/receipts', {
      method: 'POST',
      body: formData,
    });
    expect(result).toEqual(mockReceipt);
  });

  it('getMyReceipts calls GET /api/v1/billing/receipts', async () => {
    const mockList = [{ id: 1, amount: 45000 }];
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockList);

    const result = await paymentReceiptApi.getMyReceipts();

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/billing/receipts');
    expect(result).toEqual(mockList);
  });

  it('getReceiptFileUrl calls GET /api/v1/billing/receipts/{id}/file', async () => {
    const mockUrl = { url: 'https://r2.cloudflarestorage.com/test.pdf' };
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockUrl);

    const result = await paymentReceiptApi.getReceiptFileUrl(42);

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/billing/receipts/42/file');
    expect(result).toEqual(mockUrl);
  });

  it('getRequisites calls GET /api/v1/billing/receipts/requisites', async () => {
    const mockReq = { recipientName: 'ТОО ЖАН FINANCE', bin: '240140012345' };
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockReq);

    const result = await paymentReceiptApi.getRequisites();

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/billing/receipts/requisites');
    expect(result).toEqual(mockReq);
  });

  it('getAllReceipts calls GET /api/v1/admin/billing/receipts with status param', async () => {
    const mockList = [{ id: 10, status: 'AWAITING_REVIEW' }];
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockList);

    const result = await paymentReceiptApi.getAllReceipts('AWAITING_REVIEW');

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/admin/billing/receipts?status=AWAITING_REVIEW');
    expect(result).toEqual(mockList);
  });

  it('confirmReceipt calls POST /api/v1/admin/billing/receipts/{id}/confirm', async () => {
    const mockConfirmed = { id: 5, status: 'CONFIRMED' };
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockConfirmed);

    const result = await paymentReceiptApi.confirmReceipt(5);

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/admin/billing/receipts/5/confirm', {
      method: 'POST',
    });
    expect(result).toEqual(mockConfirmed);
  });

  it('rejectReceipt calls POST /api/v1/admin/billing/receipts/{id}/reject with rejectNote', async () => {
    const mockRejected = { id: 5, status: 'REJECTED', rejectNote: 'Неверная сумма' };
    vi.mocked(http.apiRequest).mockResolvedValueOnce(mockRejected);

    const result = await paymentReceiptApi.rejectReceipt(5, 'Неверная сумма');

    expect(http.apiRequest).toHaveBeenCalledWith('/api/v1/admin/billing/receipts/5/reject', {
      method: 'POST',
      body: JSON.stringify({ note: 'Неверная сумма' }),
    });
    expect(result).toEqual(mockRejected);
  });
});
