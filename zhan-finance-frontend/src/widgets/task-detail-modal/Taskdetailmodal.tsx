import { useState } from 'react';
import { updateTaskStatus, assignTask } from '@/entities/task/api/taskApi';
import { StatusBadge, PriorityBadge } from '@/shared/ui/Badge';
import type { TaskDto, TaskStatus } from '@/entities/task/model/types';

interface TaskDetailModalProps {
  task: TaskDto | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onStatusChange }: TaskDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !task) return null;

  const statuses: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'ON_REVIEW', 'DONE', 'CANCELLED'];

  const handleStatusChange = async (status: TaskStatus) => {
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, status);
      onStatusChange?.();
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-bold text-gray-900">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 mb-4">{task.description}</p>
        )}

        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium text-gray-500">Client</label>
            <p className="text-sm text-gray-900">{task.client?.fullName}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500">Assigned To</label>
            <p className="text-sm text-gray-900">{task.assignedTo?.fullName || '—'}</p>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <div className="mt-1"><StatusBadge status={task.status} /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Priority</label>
              <div className="mt-1"><PriorityBadge priority={task.priority} /></div>
            </div>
          </div>

          {task.dueDate && (
            <div>
              <label className="text-xs font-medium text-gray-500">Due Date</label>
              <p className="text-sm text-gray-900">{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <label className="text-xs font-medium text-gray-500 block">Change Status</label>
          <div className="grid grid-cols-2 gap-2">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isUpdating || status === task.status}
                className={`px-3 py-2 rounded text-xs font-medium transition ${
                  status === task.status
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-green text-white hover:bg-green-800 disabled:opacity-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}