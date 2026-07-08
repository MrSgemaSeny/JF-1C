import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTasks,
  getTask,
  batchUpdateTasks,
  updateTaskStatus,
  createTask,
  assignTask,
} from './taskApi';
import type { TaskDto, TaskFilter, TaskStatus, TaskCreateRequest } from '../model/types';

export const TASK_QUERY_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
  list: (filter?: TaskFilter) => [...TASK_QUERY_KEYS.lists(), filter] as const,
  details: () => [...TASK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...TASK_QUERY_KEYS.details(), id] as const,
};

export function useTasksQuery(filter?: TaskFilter, enabled = true) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list(filter),
    queryFn: () => getTasks(filter),
    enabled,
  });
}

export function useTaskQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.detail(id),
    queryFn: () => getTask(id),
    enabled,
  });
}

export function useBatchUpdateTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tasks: TaskDto[]) => batchUpdateTasks(tasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
    },
  });
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => updateTaskStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(variables.id) });
    },
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TaskCreateRequest) => createTask(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
    },
  });
}

export function useAssignTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: number; assigneeId?: number }) => assignTask(id, assigneeId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(variables.id) });
    },
  });
}
