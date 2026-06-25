import { UserDto } from '@/entities/task/model/types';

export interface EmployeeDto {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
  enabled: boolean;
  createdAt: string;
}
