import { useQuery } from '@tanstack/react-query';
import { getPipelines } from './pipelineApi';

export const usePipelinesQuery = () => {
  return useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });
};
