import { useEffect, useState } from 'react';
import { getTasks } from '@/entities/task/api/taskApi';
import type { TaskDto } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';

export function ClientOverviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);

  useEffect(() => {
    if (user?.userId) {
      getTasks({ clientId: user.userId }).then(setTasks);
    }
  }, [user?.userId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Client Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">My Active Requests</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length}
          </p>
        </div>
      </div>
    </div>
  );
}
