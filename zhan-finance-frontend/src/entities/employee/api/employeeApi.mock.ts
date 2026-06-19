import type { EmployeeDto } from '../model/types';

export async function getEmployees(): Promise<EmployeeDto[]> {
  return [
    { id: 2, fullName: 'Employee One', email: 'employee@test.com', role: 'EMPLOYEE' },
  ];
}
