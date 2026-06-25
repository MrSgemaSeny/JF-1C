import { TaskDetailCard } from '@/features/task-management/ui/TaskDetailCard';
import type { TaskDto } from '@/entities/task/model/types';

interface TaskDetailModalProps {
  task: TaskDto | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onStatusChange }: TaskDetailModalProps) {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <TaskDetailCard 
          taskId={task.id} 
          isModal={true} 
          onClose={onClose}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}