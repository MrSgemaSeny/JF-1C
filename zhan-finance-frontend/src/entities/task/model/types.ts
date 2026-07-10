import type { ServiceDto } from '@/entities/service/api/servicesApi';

export type StageType = 'OPEN' | 'WON' | 'LOST';

export interface StageDto {
  id: number;
  pipelineId: number;
  name: string;
  orderIndex: number;
  color?: string;
  type: StageType;
  isDefault: boolean;
}

export interface PipelineDto {
  id: number;
  name: string;
  isDefault: boolean;
  stages: StageDto[];
}



export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER';
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
  stageId?: number;
  stage?: StageDto;
  amount?: number;
  currency?: string;
  source?: string;
  closedAt?: string;
  lostReason?: string;
  dueDate?: string;
  subtasks?: SubtaskDto[];
  tags?: string[];
  serviceIds?: number[];
  services?: ServiceDto[];
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
  subtasks?: { title: string; status?: string }[];
  serviceIds?: number[];
}

export interface TaskRequestCreateRequest {
  title: string;
  description?: string;
  clientId: number;
  dueDate?: string;
  subtasks?: { title: string; status?: string }[];
  serviceIds?: number[];
}

export interface TaskFilter {
  stageId?: number;
  clientId?: number;
  assignedToId?: number;
}

export interface TaskBatchUpdateRequest {
  updates: {
    id: number;
    stageId?: number;
    tags?: string[];
    priority?: TaskPriority;
    title?: string;
    description?: string;
    dueDate?: string;
    assignedToId?: number;
  }[];
}
