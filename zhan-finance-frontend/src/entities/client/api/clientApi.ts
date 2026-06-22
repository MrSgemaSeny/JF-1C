import { apiRequest } from '@/shared/api/http';
import type { ClientDto } from '../model/types';

export async function getClients(): Promise<ClientDto[]> {
  return apiRequest<ClientDto[]>('/api/crm/clients');
}

export async function getClient(id: number): Promise<ClientDto> {
  return apiRequest<ClientDto>(`/api/crm/clients/${id}`);
}

export async function assignEmployee(id: number, employeeId: number): Promise<void> {
  return apiRequest<void>(`/api/crm/clients/${id}/assign?employeeId=${employeeId}`, {
    method: 'POST',
  });
}