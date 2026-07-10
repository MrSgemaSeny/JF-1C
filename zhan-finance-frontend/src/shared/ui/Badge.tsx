import type { StageDto } from '@/entities/task/model/types';

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

