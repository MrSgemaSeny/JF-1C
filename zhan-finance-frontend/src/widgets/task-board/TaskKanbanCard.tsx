import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import type { TaskDto } from '@/entities/task/model/types';
import type { EmployeeDto } from '@/entities/employee/model/types';
import { getSecureImageUrl } from '@/shared/api/http';

interface TaskKanbanCardProps {
  task: TaskDto;
  onClick: () => void;
  userRole: string;
  onOpenChat?: (clientId: number, clientName: string) => void;
}

export function TaskKanbanCard({ task, onClick, userRole, onOpenChat }: TaskKanbanCardProps) {
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
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (task.client?.phone) {
                window.open(`tel:${task.client.phone}`);
              }
            }}
            className={`p-0.5 rounded transition-colors ${
              task.client?.phone
                ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                : 'text-gray-300 cursor-default'
            }`}
            title={task.client?.phone ? `Позвонить: ${task.client.phone}` : 'Телефон не указан'}
          >
            <Phone size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (task.client?.email) {
                window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(task.client.email)}`, '_blank');
              }
            }}
            className={`p-0.5 rounded transition-colors ${
              task.client?.email
                ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                : 'text-gray-300 cursor-default'
            }`}
            title={task.client?.email ? `Написать: ${task.client.email}` : 'Email не указан'}
          >
            <Mail size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (task.client && onOpenChat) {
                onOpenChat(task.client.id, task.client.fullName);
              }
            }}
            className={`p-0.5 rounded transition-colors ${
              task.client && onOpenChat
                ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                : 'text-gray-300 cursor-default'
            }`}
            title={task.client ? `Чат с ${task.client.fullName}` : 'Клиент не указан'}
          >
            <MessageCircle size={14} />
          </button>
        </div>
      </div>

      {/* Client Name */}
      {task.client && (
        <span
          className="text-[13px] text-blue-600 hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenChat) {
              onOpenChat(task.client!.id, task.client!.fullName);
            }
          }}
        >
          {task.client.fullName}
        </span>
      )}
      {!task.client && (
        <span className="text-[13px] text-gray-400">
          Без клиента
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
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden"
              title={task.assignedTo.fullName}
            >
              {task.assignedTo.avatarUrl ? (
                <img src={getSecureImageUrl(task.assignedTo.avatarUrl)} alt={task.assignedTo.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black text-white flex items-center justify-center">
                  {task.assignedTo.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
