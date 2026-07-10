import { apiRequest } from '@/shared/api/http';
import type { PipelineDto } from '../model/types';

export async function getPipelines(): Promise<PipelineDto[]> {
  return apiRequest<PipelineDto[]>('/api/crm/pipelines');
}
