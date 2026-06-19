import { UserDto } from '@/entities/task/model/types';

export interface ClientDto {
  id: number;
  user: UserDto;
  companyName?: string;
  phone?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientCreateRequest {
  userId: number;
  companyName?: string;
  phone?: string;
  notes?: string;
}
