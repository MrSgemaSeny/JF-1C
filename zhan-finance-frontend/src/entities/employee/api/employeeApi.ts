import { apiRequest } from '@/shared/api/http';
import type { EmployeeDto } from '../model/types';

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

export interface EmployeeWorkloadDto {
  employeeId: number;
  fullName: string;
  email: string;
  activeTasksCount: number;
}

export async function getEmployeeWorkload(): Promise<EmployeeWorkloadDto[]> {
  return apiRequest<EmployeeWorkloadDto[]>('/api/admin/employees/workload');
}