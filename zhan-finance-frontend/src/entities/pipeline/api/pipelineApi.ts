import { apiRequest } from '@/shared/api/http';
import type { PipelineDto } from '@/entities/task/model/types';

export const getPipelines = async (): Promise<PipelineDto[]> => {
  return apiRequest<PipelineDto[]>('/api/crm/pipelines');
};
