import { apiRequest } from '@/shared/api/http';

// ========== Types ==========

export interface ServiceDto {
  id: number;
  title: string;
  description: string;
  price: string | null;
  imageUrl: string | null;
  isHighlighted: boolean;
  features: string[];
  createdAt: string;
}

export interface ServiceRequestDto {
  id: number;
  serviceId: number | null;
  serviceTitle: string;
  clientMessage: string | null;
  preferredContactDate: string | null;
  status: string;
  assignedEmployeeId: number | null;
  taskId: number | null;
  createdAt: string;
}

export interface ServiceRequestCreateRequest {
  serviceId: number;
  message?: string;
  preferredContactDate?: string;
}

// ========== API Calls ==========

/** GET /api/services — все активные услуги (публичный) */
export async function fetchServices(): Promise<ServiceDto[]> {
  return apiRequest<ServiceDto[]>('/api/services');
}

/** GET /api/services/highlighted — услуги для главной страницы (публичный) */
export async function fetchHighlightedServices(): Promise<ServiceDto[]> {
  return apiRequest<ServiceDto[]>('/api/services/highlighted');
}

/** POST /api/services/request — запрос на услугу (требует авторизации CLIENT) */
export async function requestService(data: ServiceRequestCreateRequest): Promise<ServiceRequestDto> {
  return apiRequest<ServiceRequestDto>('/api/services/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** GET /api/services/requests/my — мои запросы (CLIENT) */
export async function fetchMyServiceRequests(): Promise<ServiceRequestDto[]> {
  return apiRequest<ServiceRequestDto[]>('/api/services/requests/my');
}

/** GET /api/services/requests/by-task/{taskId} — Получить информацию об услуге по ID задачи */
export async function fetchServiceRequestByTaskId(taskId: number): Promise<ServiceRequestDto> {
  return apiRequest<ServiceRequestDto>(`/api/services/requests/by-task/${taskId}`);
}
