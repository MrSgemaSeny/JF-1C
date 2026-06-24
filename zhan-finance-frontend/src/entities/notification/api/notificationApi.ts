import { apiRequest } from '@/shared/api/http';
import type { NotificationDto } from '../model/types';

export async function getUserNotifications(): Promise<NotificationDto[]> {
  return apiRequest<NotificationDto[]>('/api/notifications');
}

export async function markAsRead(id: number): Promise<NotificationDto> {
  return apiRequest<NotificationDto>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllAsRead(): Promise<void> {
  return apiRequest<void>('/api/notifications/read-all', {
    method: 'POST',
  });
}
