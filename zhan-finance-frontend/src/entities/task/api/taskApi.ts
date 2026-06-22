import { apiRequest } from '@/shared/api/http';
import type { TaskDto, TaskCreateRequest, TaskRequestCreateRequest, TaskStatus, TaskFilter } from '../model/types';

function toQuery(filter?: TaskFilter): string {
  if (!filter) return '';
  const params = new URLSearchParams();
  if (filter.status) params.append('status', filter.status);
  if (filter.clientId) params.append('clientId', filter.clientId.toString());
  if (filter.assignedToId) params.append('assignedToId', filter.assignedToId.toString());
  const str = params.toString();
  return str ? `?${str}` : '';
}

export async function getTasks(filter?: TaskFilter): Promise<TaskDto[]> {
  return apiRequest<TaskDto[]>(`/api/crm/tasks${toQuery(filter)}`);
}

export async function getTask(id: number): Promise<TaskDto> {
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}`);
}

export async function createTask(request: TaskCreateRequest): Promise<TaskDto> {
  return apiRequest<TaskDto>('/api/crm/tasks', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function requestTask(request: TaskRequestCreateRequest): Promise<TaskDto> {
  return apiRequest<TaskDto>('/api/crm/tasks/request', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<TaskDto> {
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function assignTask(id: number, assigneeId?: number): Promise<TaskDto> {
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}/assign${assigneeId ? `?assigneeId=${assigneeId}` : ''}`, {
    method: 'PATCH',
  });
}