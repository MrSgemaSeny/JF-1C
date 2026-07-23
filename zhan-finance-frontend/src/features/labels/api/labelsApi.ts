import { apiRequest } from '@/shared/api/http';
import type { UserLabelDto } from '@/entities/task/model/types';

export const labelsApi = {
  getMyLabels: async (): Promise<UserLabelDto[]> => {
    return apiRequest<UserLabelDto[]>('/api/crm/labels');
  },

  createLabel: async (data: { name: string; color: string }): Promise<UserLabelDto> => {
    return apiRequest<UserLabelDto>('/api/crm/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  deleteLabel: async (id: number): Promise<void> => {
    await apiRequest(`/api/crm/labels/${id}`, { method: 'DELETE' });
  },

  toggleTaskLabel: async (taskId: number, labelId: number): Promise<void> => {
    await apiRequest(`/api/crm/tasks/${taskId}/labels/${labelId}`, { method: 'POST' });
  },

  batchUpdateTasks: async (data: { taskIds: number[]; stageId?: number; assignedToId?: number; labelId?: number }): Promise<void> => {
    await apiRequest('/api/crm/tasks/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
};
