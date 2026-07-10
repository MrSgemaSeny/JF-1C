import type { StageDto, TaskPriority } from '@/entities/task/model/types';

const priorityColors: Record<TaskPriority, string> = {
  'LOW': 'bg-gray-50 text-gray-600',
  'MEDIUM': 'bg-blue-50 text-blue-600',
  'HIGH': 'bg-orange-50 text-orange-600',
  'URGENT': 'bg-red-50 text-red-600',
};

export function StatusBadge({ stage }: { stage?: StageDto }) {
  if (!stage) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Нет стадии</span>;
  return (
    <span 
      className="px-2 py-1 text-xs font-medium rounded-full text-white"
      style={{ backgroundColor: stage.color || '#3b82f6' }}
    >
      {stage.name}
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
