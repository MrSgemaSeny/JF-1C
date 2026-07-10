import { useEffect, useRef } from 'react';
import { useTasksQuery, useBatchUpdateTasksMutation } from '@/entities/task/api/taskQueries';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import type { TaskDto } from '@/entities/task/model/types';
import { TaskKanbanBoard } from '@/widgets/task-board/TaskKanbanBoard';
import type { TaskKanbanBoardRef } from '@/widgets/task-board/TaskKanbanBoard';
import { Plus, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { exportTasksCsv } from '@/entities/task/api/taskApi';
export function AdminTasksPage() {
  const { data: tasks, isLoading, error } = useTasksQuery();
  const { mutateAsync: batchUpdate } = useBatchUpdateTasksMutation();
  const boardRef = useRef<TaskKanbanBoardRef>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdParam = searchParams.get('taskId');

  useEffect(() => {
    if (taskIdParam && tasks && boardRef.current) {
      boardRef.current.openTaskModal(Number(taskIdParam));
      // Remove taskId from URL to avoid re-opening on refresh, or leave it. 
      // We will remove it for a cleaner URL state after modal opens.
      setSearchParams(new URLSearchParams());
    }
  }, [taskIdParam, tasks, setSearchParams]);

  const handleBatchSave = async (allTasks: TaskDto[]) => {
    try {
      await batchUpdate(allTasks);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tasks');
    }
  };

  const handleCreateTask = () => {
    const now = Date.now();
    const newTask: TaskDto = {
      id: now,
      title: 'New Task',
      subtasks: [
        { id: now + 1, taskId: now, title: 'First step', status: 'NEW', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 1, fullName: 'Admin', email: '', role: 'ADMIN' }
    };
    boardRef.current?.createNewTask(newTask);
  };

  const handleExport = async () => {
    try {
      const blob = await exportTasksCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to export tasks');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={handleCreateTask}
            className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-accent transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {!tasks?.length ? (
        <Empty label="Нет задач в системе" />
      ) : (
        <TaskKanbanBoard 
          initialTasks={tasks}
          userRole="ADMIN"
          ref={boardRef}
        />
      )}
    </div>
  );
}