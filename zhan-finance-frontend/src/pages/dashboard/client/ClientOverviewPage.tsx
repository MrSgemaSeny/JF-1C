import { useEffect, useState } from 'react';
import { getTasks, requestTask, reviewTaskDecision, batchUpdateTasks } from '@/entities/task/api/taskApi';
import type { TaskDto, TaskStatus } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { TaskGridBoard } from '@/widgets/task-board/TaskGridBoard';

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  ON_REVIEW: 'On Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  NEW: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  ON_REVIEW: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-600',
  MEDIUM: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
};

export function ClientOverviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (user?.userId) {
      fetchTasks();
    }
  }, [user?.userId]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (user?.userId) {
        // Для CLIENT роли бэкенд автоматически вернёт только его таски.
        // Параметры (clientId, assignedToId, status) игнорируются для CLIENT.
        const data = await getTasks();
        setTasks(data);
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await requestTask({ 
        title, 
        description, 
        clientId: user?.userId || 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined 
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowForm(false);
      await fetchTasks();
    } catch (err) {
      setError('Failed to create request');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (updatedTask: TaskDto) => {
    // CLIENT может только менять статус ON_REVIEW -> DONE или IN_PROGRESS через специальный endpoint
    const original = tasks.find(t => t.id === updatedTask.id);
    if (original && original.status === 'ON_REVIEW' && updatedTask.status !== original.status) {
      const decision = updatedTask.status === 'DONE' ? 'ACCEPT' : 'REJECT';
      try {
        const result = await reviewTaskDecision(updatedTask.id, decision);
        setTasks(prev => prev.map(t => t.id === result.id ? result : t));
        if (selectedTask?.id === result.id) setSelectedTask(result);
      } catch (err) {
        console.error(err);
        alert('Не удалось обновить статус задачи');
      }
    } else {
      // Для комментариев и других обновлений — просто обновляем локальный стейт
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
    }
  };

  const handleBatchSave = async (allTasks: TaskDto[]) => {
    try {
      await batchUpdateTasks(allTasks);
      await fetchTasks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update tasks');
    }
  };

  // Stats calculations
  const stats = {
    active: tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED').length,
    onReview: tasks.filter((t) => t.status === 'ON_REVIEW').length,
    completed: tasks.filter((t) => t.status === 'DONE').length,
  };

  // Filter tasks
  const filteredTasks =
    statusFilter === 'ALL'
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  if (isLoading && tasks.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600 text-sm mt-1">
          Track and manage your requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Active Requests</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-2">Open tasks</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">On Review</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.onReview}</p>
          <p className="text-xs text-gray-500 mt-2">Pending review</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-2">Done</p>
        </div>
      </div>

      {/* Create Request Form */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-green hover:bg-green-700 text-white text-sm font-medium transition"
        >
          + New Request
        </button>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Request</h2>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need help with?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-4 py-2 bg-brand-green hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? 'Creating...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setDescription('');
                  setDueDate('');
                }}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Filter & Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="ALL">All</option>
            {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {filteredTasks.length > 0 && (
            <span className="text-xs text-gray-500">
              ({filteredTasks.length} {filteredTasks.length === 1 ? 'request' : 'requests'})
            </span>
          )}
        </div>

        <TaskGridBoard 
          initialTasks={filteredTasks}
          onBatchSave={handleBatchSave}
          userRole="CLIENT"
        />
      </div>
    </div>
  );
}