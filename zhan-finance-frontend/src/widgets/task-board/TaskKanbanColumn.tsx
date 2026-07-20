import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskKanbanCard } from './TaskKanbanCard';
import type { TaskDto, StageDto } from '@/entities/task/model/types';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TaskKanbanColumnProps {
  stage: StageDto;
  tasks: TaskDto[];
  onTaskClick: (taskId: number) => void;
  userRole: string;
  onOpenChat?: (clientId: number, clientName: string) => void;
}

export function TaskKanbanColumn({ stage, tasks, onTaskClick, userRole, onOpenChat }: TaskKanbanColumnProps) {
  const { t } = useTranslation('crm');
  const { setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
    data: {
      type: 'Column',
      stage,
    },
  });

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const totalAmount = tasks.reduce((sum, task) => sum + (task.amount || 0), 0);
  const amountStr = totalAmount > 0 ? new Intl.NumberFormat('ru-RU').format(totalAmount) : '0';
  
  // Mapping stage to CSS variables based on orderIndex or name, assuming predefined ones
  // In a real scenario we'd use `stage.color` or map based on predefined list
  const stageColors = [
    'var(--color-stage-new)',
    'var(--color-stage-docs)',
    'var(--color-stage-prepay)',
    'var(--color-stage-active)',
    'var(--color-stage-invoice)',
    'var(--color-stage-lost)'
  ];
  
  const headerColorRaw = stage.color || stageColors[stage.orderIndex % stageColors.length] || 'var(--color-brand-green)';
  const headerColor = headerColorRaw === 'var(--color-stage-review)' ? '#6366F1' : headerColorRaw;

  return (
    <div className="flex flex-col flex-shrink-0 w-[85vw] md:w-[280px] snap-center">
      {/* Column Header */}
      <div 
        className="rounded-t-lg px-3 py-2 flex items-center justify-between text-white shadow-sm"
        style={{ backgroundColor: headerColor }}
      >
        <span className="font-semibold text-sm truncate pr-2">{stage.name}</span>
        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Column Body (Glassmorphism look) */}
      <div 
        ref={setNodeRef}
        className="flex flex-col flex-1 bg-gray-50/50 backdrop-blur-sm border-x border-b border-gray-200 rounded-b-lg p-2 min-h-[500px]"
      >

        


        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskKanbanCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task.id)} 
              userRole={userRole}
              onOpenChat={onOpenChat}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
