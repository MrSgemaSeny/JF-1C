import { apiRequest } from '@/shared/api/http';

export interface CalendarEventDto {
  id: string; // prefixed with event_ or task_
  originalId: number;
  type: 'EVENT' | 'TASK';
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  description?: string;
  color: string;
  isCompleted: boolean;
}

export interface CalendarEventCreateRequest {
  date: string;
  time?: string;
  title: string;
  description?: string;
  color?: string;
}

export async function getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEventDto[]> {
  return apiRequest<CalendarEventDto[]>(`/api/crm/calendar?startDate=${startDate}&endDate=${endDate}`);
}

export async function createCalendarEvent(request: CalendarEventCreateRequest): Promise<CalendarEventDto> {
  return apiRequest<CalendarEventDto>('/api/crm/calendar', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  return apiRequest<void>(`/api/crm/calendar/${id}`, {
    method: 'DELETE',
  });
}
