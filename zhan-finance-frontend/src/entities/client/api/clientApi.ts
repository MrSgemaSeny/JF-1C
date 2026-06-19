import { apiRequest } from '@/shared/api/http';
import { USE_MOCK_API } from '@/shared/config/env';
import * as mock from './clientApi.mock';
import type { ClientDto } from '../model/types';

export async function getClients(): Promise<ClientDto[]> {
  if (USE_MOCK_API) return mock.getClients();
  return apiRequest<ClientDto[]>('/api/crm/clients');
}

export async function getClient(id: number): Promise<ClientDto> {
  if (USE_MOCK_API) return mock.getClient(id);
  return apiRequest<ClientDto>(`/api/crm/clients/${id}`);
}

export async function assignEmployee(id: number, employeeId: number): Promise<void> {
  if (USE_MOCK_API) return mock.assignEmployee(id, employeeId);
  return apiRequest<void>(`/api/crm/clients/${id}/assign?employeeId=${employeeId}`, {
    method: 'POST',
  });
}
