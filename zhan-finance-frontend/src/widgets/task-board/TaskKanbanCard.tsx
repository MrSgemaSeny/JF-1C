import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import type { TaskDto } from '@/entities/task/model/types';
import type { EmployeeDto } from '@/entities/employee/model/types';

interface TaskKanbanCardProps {
  task: TaskDto;
  onClick: () => void;
  userRole: string;
}

export function TaskKanbanCard({ task, onClick, userRole }: TaskKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const amountStr = task.amount ? new Intl.NumberFormat('ru-RU').format(task.amount) : '0';
  const currencyStr = task.currency || 'тенге';
  
  const dateStr = task.createdAt 
    ? new Date(task.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white rounded-md p-3 mb-2 cursor-pointer
        shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_5px_rgba(0,0,0,0.15)]
        transition-shadow border border-gray-100 flex flex-col gap-2 relative
        ${isDragging ? 'opacity-50 scale-[1.02] rotate-1 z-50' : 'opacity-100'}
      `}
    >
      {/* Top row: Name and red badge if any */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-gray-800 leading-tight">
          {task.title}
        </span>
        {/* Placeholder for red badge (e.g. overdue count) */}
        {/* <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span> */}
      </div>

      {/* Amount and Icons */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[13px] text-gray-500">
          {amountStr} {currencyStr}
        </span>
        <div className="flex gap-1.5 text-blue-400">
          <Phone size={14} />
          <Mail size={14} />
          <MessageCircle size={14} className="text-gray-300" />
        </div>
      </div>

      {/* Client Name */}
      {task.client && (
        <span className="text-[13px] text-blue-600 hover:underline">
          {task.client.fullName}
        </span>
      )}
      {!task.client && (
        <span className="text-[13px] text-blue-600 hover:underline">
          Без имени
        </span>
      )}

      {/* Footer: Date and Avatar */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[12px] text-gray-400 flex items-center gap-1">
          <span className="text-gray-300">+ Дело</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400">{dateStr}</span>
          {task.assignedTo && (
            <div 
              className="w-5 h-5 rounded-full bg-brand-accent text-white flex items-center justify-center text-[10px] font-bold"
              title={task.assignedTo.fullName}
            >
              {task.assignedTo.fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
