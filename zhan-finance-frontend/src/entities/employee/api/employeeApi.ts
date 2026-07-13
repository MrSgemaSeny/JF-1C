import { apiRequest } from '@/shared/api/http';
import type { EmployeeDto } from '../model/types';

/**
 * TODO: Реализовать на backend
 * 
 * Возможные варианты:
 * - /api/admin/employees - все сотрудники (только для админов)
 * - /api/crm/clients/{clientId}/employees - сотрудники assigned к клиенту
 */
export async function getEmployees(): Promise<EmployeeDto[]> {
  return apiRequest<EmployeeDto[]>('/api/crm/employees');
}

export async function getPendingEmployees(): Promise<EmployeeDto[]> {
  return apiRequest<EmployeeDto[]>('/api/admin/employees/pending');
}

export async function approveEmployee(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/employees/${id}/approve`, {
    method: 'POST'
  });
}