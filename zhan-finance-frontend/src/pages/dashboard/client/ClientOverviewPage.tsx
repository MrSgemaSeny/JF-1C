import { useEffect, useState } from 'react';
import { getTasks, requestTask } from '@/entities/task/api/taskApi';
import type { TaskDto, TaskStatus } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/shared/ui/Spinner';

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
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      await requestTask({ title, description });
      setTitle('');
      setDescription('');
      setShowForm(false);
      await fetchTasks();
    } catch (err) {
      setError('Failed to create request');
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

        {filteredTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600">
              {tasks.length === 0
                ? 'No requests yet. Create one to get started!'
                : `No requests with "${TASK_STATUS_LABELS[statusFilter as TaskStatus]}" status`}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900 max-w-xs truncate">
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          TASK_STATUS_COLORS[task.status]
                        }`}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.assignedTo?.fullName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => navigate(`/JF-1C/client/tasks/${task.id}`)}
                        className="text-brand-green hover:text-green-700 font-medium transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}