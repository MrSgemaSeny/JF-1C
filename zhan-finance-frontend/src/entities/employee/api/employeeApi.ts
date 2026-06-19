import { apiRequest } from '@/shared/api/http';
import { USE_MOCK_API } from '@/shared/config/env';
import * as mock from './employeeApi.mock';
import type { EmployeeDto } from '../model/types';

export async function getEmployees(): Promise<EmployeeDto[]> {
  if (USE_MOCK_API) return mock.getEmployees();
  // We can fetch from admin/users or similar in real backend
  // For MVP, if we don't have this, we can just return a list from the actual endpoint when it exists.
  return apiRequest<EmployeeDto[]>('/api/admin/users'); // Assuming it exists
}
