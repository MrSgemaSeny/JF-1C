import { useEffect, useRef } from 'react';
import { useTasksQuery, useBatchUpdateTasksMutation } from '@/entities/task/api/taskQueries';
import type { TaskDto } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { TaskGridBoard, type TaskGridBoardRef } from '@/widgets/task-board/TaskGridBoard';
import { TaskKanbanBoard } from '@/widgets/task-board/TaskKanbanBoard';
import { Empty } from '@/shared/ui/Empty';
import { Spinner } from '@/shared/ui/Spinner';
import { Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { exportTasksCsv } from '@/entities/task/api/taskApi';
export function EmployeeTasksPage() {
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useTasksQuery({ assignedToId: user?.userId }, !!user?.userId);
  const { mutateAsync: batchUpdate } = useBatchUpdateTasksMutation();
  const boardRef = useRef<TaskGridBoardRef>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const taskIdParam = searchParams.get('taskId');

  useEffect(() => {
    if (taskIdParam && tasks.length > 0 && boardRef.current) {
      boardRef.current.openTaskModal(Number(taskIdParam));
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>
      
      <TaskKanbanBoard 
        initialTasks={tasks || []}
        userRole="EMPLOYEE"
        ref={boardRef}
      />
    </div>
  );
}
