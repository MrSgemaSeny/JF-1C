import { useEffect, useState } from 'react';
import { getTasks } from '@/entities/task/api/taskApi';
import { StatCard } from '@/shared/ui/StatCard';
import { Spinner } from '@/shared/ui/Spinner';
import type { TaskDto } from '@/entities/task/model/types';

export function AdminOverviewPage() {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;

  const totalClients = new Set(tasks.map(t => t.client?.id)).size;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const activeTasks = tasks.filter(t => ['NEW', 'IN_PROGRESS', 'ON_REVIEW'].includes(t.status)).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Clients" value={totalClients} />
        <StatCard label="Total Tasks" value={totalTasks} />
        <StatCard label="Active Tasks" value={activeTasks} />
        <StatCard label="Completed" value={completedTasks} />
      </div>

      {/* Task distribution */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks by Status</h2>
        <div className="space-y-2">
          {(['NEW', 'IN_PROGRESS', 'ON_REVIEW', 'DONE', 'CANCELLED'] as const).map(status => {
            const count = tasks.filter(t => t.status === status).length;
            const percent = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
            return (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{status}</span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-brand-green h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}