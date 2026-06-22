import { useEffect, useState } from 'react';
import { getTasks, updateTaskStatus } from '@/entities/task/api/taskApi';
import { StatusBadge, PriorityBadge } from '@/shared/ui/Badge';
import { Spinner } from '@/shared/ui/Spinner';
import { Empty } from '@/shared/ui/Empty';
import { TaskDetailModal } from '@/widgets/task-detail-modal/Taskdetailmodal';
import type { TaskDto, TaskStatus } from '@/entities/task/model/types';

export function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (searchQuery) filtered = filtered.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchQuery]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: TaskDto) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (id: number, status: TaskStatus) => {
    try {
      await updateTaskStatus(id, status);
      fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>;
  if (!filteredTasks.length) return <Empty label="No tasks found" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Tasks</h1>

      {/* Фильтры */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-green focus:border-brand-green"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-green focus:border-brand-green"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_REVIEW">On Review</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Таблица */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" onClick={() => handleTaskClick(t)}>{t.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.client?.fullName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={t.status} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm"><PriorityBadge priority={t.priority} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleTaskClick(t)}
                    className="text-brand-green hover:text-green-800 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={fetchTasks}
      />
    </div>
  );
}