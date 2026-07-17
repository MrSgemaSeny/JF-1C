import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/http';

export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';

export interface LeadDto {
  id: number;
  name: string;
  phone: string;
  message?: string;
  source: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export function useLeads() {
  return useQuery<LeadDto[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      return await apiRequest<LeadDto[]>('/api/contact-requests');
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: LeadStatus }) => {
      return await apiRequest<LeadDto>(`/api/contact-requests/${id}/status?status=${status}`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export interface ConvertLeadRequest {
  email: string;
  serviceIds: number[];
}

export interface ConvertLeadResponse {
  task: any; // TaskDto
  generatedPassword?: string;
}

export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ConvertLeadRequest }) => {
      return await apiRequest<ConvertLeadResponse>(`/api/contact-requests/${id}/convert`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
