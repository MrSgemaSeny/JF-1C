// Зеркалит backend DTO
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'ON_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
}

export interface ClientInfoDto {
  id: number;
  fullName: string;
  email: string;
  companyName?: string;
}

export interface EmployeeInfoDto {
  id: number;
  fullName: string;
  email: string;
}

export type SubtaskStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

export interface SubtaskDto {
  id: number;
  taskId: number;
  title: string;
  status: SubtaskStatus;
  createdAt: string;
}

export interface TaskCommentDto {
  id: number;
  taskId: number;
  author: UserDto;
  text: string;
  createdAt: string;
}

export interface TaskActivityDto {
  id: number;
  taskId: number;
  actor: UserDto;
  actionText: string;
  createdAt: string;
}

export interface TaskDto {
  id: number;
  title: string;
  description?: string;
  clientId?: number;
  client?: ClientInfoDto;
  assignedToId?: number;
  assignedTo?: EmployeeInfoDto;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  subtasks?: SubtaskDto[];
  tags?: string[];
  comments?: TaskCommentDto[];
  history?: TaskActivityDto[];
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
  clientId: number;
  dueDate?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  clientId?: number;
  assignedToId?: number;
}

export interface TaskBatchUpdateRequest {
  updates: {
    id: number;
    status?: TaskStatus;
    tags?: string[];
    // Можно добавить другие поля для обновления, если нужно
  }[];
}
