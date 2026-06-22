import type { TaskStatus, TaskPriority } from '@/entities/task/model/types';

const statusColors: Record<TaskStatus, string> = {
  'NEW': 'bg-gray-100 text-gray-800',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
  'ON_REVIEW': 'bg-blue-100 text-blue-800',
  'DONE': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800',
};

const priorityColors: Record<TaskPriority, string> = {
  'LOW': 'bg-gray-50 text-gray-600',
  'MEDIUM': 'bg-blue-50 text-blue-600',
  'HIGH': 'bg-orange-50 text-orange-600',
  'URGENT': 'bg-red-50 text-red-600',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority]}`}>
      {priority}
    </span>
  );
}
