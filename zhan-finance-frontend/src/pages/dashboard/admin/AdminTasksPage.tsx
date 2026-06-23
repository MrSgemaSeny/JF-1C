import { useEffect, useState, useRef } from 'react';
import { getTasks, batchUpdateTasks } from '@/entities/task/api/taskApi';
import { useApiData } from '@/shared/hooks/useApiData';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import type { TaskDto } from '@/entities/task/model/types';
import { TaskGridBoard, type TaskGridBoardRef } from '@/widgets/task-board/TaskGridBoard';
import { Plus } from 'lucide-react';

export function AdminTasksPage() {
  const { data: tasks, isLoading, error, refetch: fetchTasks } = useApiData(getTasks);
  const boardRef = useRef<TaskGridBoardRef>(null);

  const handleBatchSave = async (allTasks: TaskDto[]) => {
    try {
      await batchUpdateTasks(allTasks);
      fetchTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tasks');
    }
  };

  const handleCreateTask = () => {
    const now = Date.now();
    const newTask: TaskDto = {
      id: now,
      title: 'New Task',
      status: 'NEW',
      priority: 'MEDIUM',
      subtasks: [
        { id: now + 1, taskId: now, title: 'First step', status: 'NEW', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 1, fullName: 'Admin', email: '', role: 'ADMIN' }
    };
    boardRef.current?.createNewTask(newTask);
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        <button 
          onClick={handleCreateTask}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-accent transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      {!tasks?.length ? (
        <Empty label="No tasks found" />
      ) : (
        <TaskGridBoard 
          ref={boardRef}
          initialTasks={tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')} 
          onBatchSave={handleBatchSave}
          userRole="ADMIN"
        />
      )}
    </div>
  );
}