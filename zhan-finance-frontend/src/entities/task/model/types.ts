// Зеркалит backend DTO
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'ON_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
}

export interface TaskDto {
  id: number;
  title: string;
  description?: string;
  client: UserDto;
  assignedTo?: UserDto;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  clientId: number;
  assignedToId?: number;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface TaskRequestCreateRequest {
  title: string;
  description?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  clientId?: number;
  assignedToId?: number;
}
