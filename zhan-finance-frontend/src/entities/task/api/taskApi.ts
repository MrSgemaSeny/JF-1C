import { apiRequest } from '@/shared/api/http';
import { USE_MOCK_API } from '@/shared/config/env';
import * as mock from './taskApi.mock';
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
  if (USE_MOCK_API) return mock.getTasks(filter);
  return apiRequest<TaskDto[]>(`/api/crm/tasks${toQuery(filter)}`);
}

export async function getTask(id: number): Promise<TaskDto> {
  if (USE_MOCK_API) return mock.getTask(id);
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}`);
}

export async function createTask(request: TaskCreateRequest): Promise<TaskDto> {
  if (USE_MOCK_API) return mock.createTask(request);
  return apiRequest<TaskDto>('/api/crm/tasks', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function requestTask(request: TaskRequestCreateRequest): Promise<TaskDto> {
  if (USE_MOCK_API) return mock.requestTask(request);
  return apiRequest<TaskDto>('/api/crm/tasks/request', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<TaskDto> {
  if (USE_MOCK_API) return mock.updateTaskStatus(id, status);
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function assignTask(id: number, assigneeId?: number): Promise<TaskDto> {
  if (USE_MOCK_API) return mock.assignTask(id, assigneeId);
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}/assign${assigneeId ? `?assigneeId=${assigneeId}` : ''}`, {
    method: 'PATCH',
  });
}
