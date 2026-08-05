import { apiRequest } from '@/shared/api/http';
import type { EmployeeDto } from '../model/types';

export async function getEmployees(): Promise<EmployeeDto[]> {
  return apiRequest<EmployeeDto[]>('/api/v1/crm/employees');
}

export async function getPendingEmployees(): Promise<EmployeeDto[]> {
  return apiRequest<EmployeeDto[]>('/api/v1/admin/employees/pending');
}

export async function approveEmployee(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/admin/employees/${id}/approve`, {
    method: 'POST'
  });
}

export async function rejectEmployee(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/admin/employees/${id}/reject`, {
    method: 'POST'
  });
}

export interface EmployeeWorkloadDto {
  employeeId: number;
  fullName: string;
  email: string;
  activeTasksCount: number;
}

export async function getEmployeeWorkload(): Promise<EmployeeWorkloadDto[]> {
  return apiRequest<EmployeeWorkloadDto[]>('/api/v1/crm/employees/workload');
}

export async function promoteToAdvisor(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/admin/employees/${id}/promote-to-advisor`, {
    method: 'POST'
  });
}

export async function demoteToEmployee(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/admin/employees/${id}/demote-to-employee`, {
    method: 'POST'
  });
}

export async function toggleUserStatus(id: number): Promise<void> {
  return apiRequest<void>(`/api/v1/admin/users/${id}/toggle-status`, {
    method: 'PATCH'
  });
}