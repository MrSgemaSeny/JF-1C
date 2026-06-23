import { useRef } from 'react';
import { getTasks, batchUpdateTasks } from '@/entities/task/api/taskApi';
import { useApiData } from '@/shared/hooks/useApiData';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import type { TaskDto } from '@/entities/task/model/types';
import { TaskGridBoard, type TaskGridBoardRef } from '@/widgets/task-board/TaskGridBoard';

export function AdminArchiveCancelledPage() {
  const { data: tasks, isLoading, refetch: fetchTasks } = useApiData(getTasks);
  const boardRef = useRef<TaskGridBoardRef>(null);

  const handleBatchSave = async (allTasks: TaskDto[]) => {
    try {
      await batchUpdateTasks(allTasks);
      fetchTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tasks');
    }
  };

  if (isLoading) return <Spinner />;

  const cancelledTasks = tasks?.filter(t => t.status === 'CANCELLED') || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Архив: Отмененные задачи</h1>
      </div>

      {!cancelledTasks.length ? (
        <Empty label="Нет отмененных задач" />
      ) : (
        <TaskGridBoard 
          ref={boardRef}
          initialTasks={cancelledTasks} 
          onBatchSave={handleBatchSave}
          userRole="ADMIN"
        />
      )}
    </div>
  );
}
