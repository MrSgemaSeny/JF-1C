import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskKanbanCard } from './TaskKanbanCard';
import type { TaskDto, StageDto } from '@/entities/task/model/types';
import { Plus } from 'lucide-react';

interface TaskKanbanColumnProps {
  stage: StageDto;
  tasks: TaskDto[];
  onTaskClick: (taskId: number) => void;
  userRole: string;
  onOpenChat?: (clientId: number, clientName: string) => void;
}

export function TaskKanbanColumn({ stage, tasks, onTaskClick, userRole, onOpenChat }: TaskKanbanColumnProps) {
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
  
  const headerColor = stage.color || stageColors[stage.orderIndex % stageColors.length] || 'var(--color-brand-green)';

  return (
    <div className="flex flex-col flex-shrink-0 w-[280px]">
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
        className="flex flex-col flex-1 bg-brand-beige/50 backdrop-blur-sm border-x border-b border-brand-green/10 rounded-b-lg p-2 min-h-[500px]"
      >
        <div className="text-center py-2 mb-2">
          <span className="inline-block bg-white/40 text-gray-700 border border-white/50 px-3 py-0.5 rounded-full text-[13px] font-medium shadow-sm backdrop-blur-md">
            {amountStr} тенге
          </span>
        </div>
        
        <button className="w-full mb-3 flex items-center justify-center gap-1 py-1.5 text-sm text-gray-500 bg-white/30 hover:bg-white/50 border border-white/40 rounded shadow-sm transition-colors backdrop-blur-md">
          <Plus size={14} />
          <span>Быстрая сделка</span>
        </button>

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
