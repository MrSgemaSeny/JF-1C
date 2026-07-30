import { UserDto } from '@/entities/task/model/types';

export interface EmployeeDto {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER' | 'CURATOR' | 'ADVISOR';
  enabled: boolean;
  createdAt: string;
}
