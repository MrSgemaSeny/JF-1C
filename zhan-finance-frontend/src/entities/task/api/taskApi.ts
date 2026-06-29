import { apiRequest, apiDownload } from '@/shared/api/http';
import type { TaskDto, TaskCreateRequest, TaskRequestCreateRequest, TaskStatus, TaskFilter } from '../model/types';

export async function getTasks(filter?: TaskFilter): Promise<TaskDto[]> {
  const query = new URLSearchParams();
  if (filter?.status) query.append('status', filter.status);
  if (filter?.clientId) query.append('clientId', filter.clientId.toString());
  if (filter?.assignedToId) query.append('assignedToId', filter.assignedToId.toString());
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<TaskDto[]>(`/api/crm/tasks${queryString}`);
}

export async function exportTasksCsv(filter?: TaskFilter): Promise<Blob> {
  const query = new URLSearchParams();
  if (filter?.status) query.append('status', filter.status);
  if (filter?.clientId) query.append('clientId', filter.clientId.toString());
  if (filter?.assignedToId) query.append('assignedToId', filter.assignedToId.toString());
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiDownload(`/api/crm/export/tasks${queryString}`);
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
  const query = assigneeId ? `?assigneeId=${assigneeId}` : '';
  return apiRequest<TaskDto>(`/api/crm/tasks/${id}/assign${query}`, {
    method: 'PATCH',
  });
}

export async function deleteTask(id: number): Promise<void> {
  return apiRequest<void>(`/api/crm/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function batchUpdateTasks(updatedTasks: TaskDto[]): Promise<void> {
  await apiRequest<TaskDto[]>('/api/crm/tasks/batch', {
    method: 'PUT',
    body: JSON.stringify({ updates: updatedTasks }),
  });
}

import type { TaskCommentDto, TaskActivityDto } from '../model/types';

export async function getTaskComments(taskId: number): Promise<TaskCommentDto[]> {
  return apiRequest<TaskCommentDto[]>(`/api/crm/tasks/${taskId}/comments`);
}

export async function addTaskComment(taskId: number, text: string): Promise<TaskCommentDto> {
  return apiRequest<TaskCommentDto>(`/api/crm/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function getTaskHistory(taskId: number): Promise<TaskActivityDto[]> {
  return apiRequest<TaskActivityDto[]>(`/api/crm/tasks/${taskId}/history`);
}

export async function reviewTaskDecision(taskId: number, decision: 'ACCEPT' | 'REJECT'): Promise<TaskDto> {
  return apiRequest<TaskDto>(`/api/crm/tasks/${taskId}/review-decision`, {
    method: 'PATCH',
    body: JSON.stringify({ decision }),
  });
}