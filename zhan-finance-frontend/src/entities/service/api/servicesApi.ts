import { apiRequest } from '@/shared/api/http';

// ========== Types ==========

export interface ServiceDto {
  id: number;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  price: string | null;
  imageUrl: string | null;
  isHighlighted: boolean;
  features: string[];
  createdAt: string;
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
