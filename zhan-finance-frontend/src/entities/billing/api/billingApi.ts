import { apiRequest } from '@/shared/api/http';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceDto {
  id: number;
  clientId: number;
  title: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

export interface SubscriptionDto {
  id: number;
  planName: string;
  monthlyPrice: number;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string | null;
}

export const billingApi = {
  getInvoices: () => apiRequest<InvoiceDto[]>('/api/billing/invoices'),
  getInvoice: (id: number) => apiRequest<InvoiceDto>(`/api/billing/invoices/${id}`),
  createInvoice: (data: Omit<InvoiceDto, 'id'>) => apiRequest<InvoiceDto>('/api/billing/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateInvoice: (id: number, data: Partial<InvoiceDto>) => apiRequest<InvoiceDto>(`/api/billing/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteInvoice: (id: number) => apiRequest<void>(`/api/billing/invoices/${id}`, {
    method: 'DELETE',
  }),

  getSubscriptions: () => apiRequest<SubscriptionDto[]>('/api/billing/subscriptions'),
  getSubscription: (id: number) => apiRequest<SubscriptionDto>(`/api/billing/subscriptions/${id}`),
  createSubscription: (data: Omit<SubscriptionDto, 'id'>) => apiRequest<SubscriptionDto>('/api/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSubscription: (id: number, data: Partial<SubscriptionDto>) => apiRequest<SubscriptionDto>(`/api/billing/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteSubscription: (id: number) => apiRequest<void>(`/api/billing/subscriptions/${id}`, {
    method: 'DELETE',
  }),
};
