import { useEffect, useState } from 'react';
import { getTasks, batchUpdateTasks } from '@/entities/task/api/taskApi';
import type { TaskDto } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { TaskGridBoard } from '@/widgets/task-board/TaskGridBoard';
import { Empty } from '@/shared/ui/Empty';

export function EmployeeTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);

  useEffect(() => {
    if (user?.userId) {
      loadTasks();
    }
  }, [user?.userId]);

  const loadTasks = () => {
    if (user?.userId) {
      getTasks({ assignedToId: user.userId }).then(data => {
        setTasks(data);
      }).catch(e => {
        console.error("Failed to load tasks", e);
      });
    }
  };

  const handleBatchSave = async (allTasks: TaskDto[]) => {
    try {
      await batchUpdateTasks(allTasks);
      loadTasks(); 
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tasks');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>
      
      {!tasks.length ? (
        <Empty label="No tasks assigned to you" />
      ) : (
        <TaskGridBoard 
          initialTasks={tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')} 
          onBatchSave={handleBatchSave}
          userRole="EMPLOYEE"
        />
      )}
    </div>
  );
}
