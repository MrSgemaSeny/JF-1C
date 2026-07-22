import { apiRequest } from '@/shared/api/http';
import type { PipelineDto, StageDto, StageType } from '@/entities/task/model/types';

export const getPipelines = async (): Promise<PipelineDto[]> => {
  return apiRequest<PipelineDto[]>('/api/crm/pipelines');
};

export interface CreateStageData {
  name: string;
  nameEn?: string;
  color?: string;
  type: StageType;
  isPreFinal?: boolean;
  orderIndex?: number;
}

export interface UpdateStageData {
  name?: string;
  nameEn?: string;
  color?: string;
  type?: StageType;
  isPreFinal?: boolean;
  orderIndex?: number;
}

export const createStage = async (pipelineId: number, data: CreateStageData): Promise<StageDto> => {
  return apiRequest<StageDto>(`/api/crm/pipelines/${pipelineId}/stages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateStage = async (pipelineId: number, stageId: number, data: UpdateStageData): Promise<StageDto> => {
  return apiRequest<StageDto>(`/api/crm/pipelines/${pipelineId}/stages/${stageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteStage = async (pipelineId: number, stageId: number): Promise<void> => {
  return apiRequest<void>(`/api/crm/pipelines/${pipelineId}/stages/${stageId}`, {
    method: 'DELETE',
  });
};
