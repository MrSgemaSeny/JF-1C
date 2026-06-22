import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask } from '@/entities/task/api/taskApi';
import type { TaskDto, TaskStatus } from '@/entities/task/model/types';
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

const PRIORITY_BG_COLORS: Record<string, string> = {
  LOW: 'bg-gray-50 border-gray-200',
  MEDIUM: 'bg-blue-50 border-blue-200',
  HIGH: 'bg-orange-50 border-orange-200',
  URGENT: 'bg-red-50 border-red-200',
};

export function ClientTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) {
        setError('Task ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getTask(parseInt(id, 10));
        setTask(data);
      } catch (err) {
        setError('Failed to load task details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/JF-1C/client')}
          className="text-brand-green hover:text-green-700 text-sm font-medium"
        >
          ← Back to Overview
        </button>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error || 'Task not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/JF-1C/client')}
        className="text-brand-green hover:text-green-700 text-sm font-medium flex items-center gap-1"
      >
        ← Back to Overview
      </button>

      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <p className="text-gray-500 text-sm mt-2">
                Created {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'unknown date'}
                {task.createdBy && ` by ${task.createdBy.fullName}`}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium w-fit ${
                  TASK_STATUS_COLORS[task.status]
                }`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Description */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              {task.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>
          </div>

          {/* Right column - Details */}
          <div className="space-y-4">
            {/* Priority */}
            <div className={`p-4 rounded-lg border ${PRIORITY_BG_COLORS[task.priority] || 'bg-gray-50'}`}>
              <p className="text-xs font-medium text-gray-600 uppercase">Priority</p>
              <p className={`text-lg font-bold mt-2 ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </p>
            </div>

            {/* Due Date */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600 uppercase">Due Date</p>
              {task.dueDate ? (
                <>
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(task.dueDate) < new Date()
                      ? '⚠️ Overdue'
                      : `in ${Math.ceil(
                          (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        )} days`}
                  </p>
                </>
              ) : (
                <p className="text-gray-500 italic mt-2">No due date set</p>
              )}
            </div>

            {/* Assigned To */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600 uppercase">Assigned To</p>
              {task.assignedTo ? (
                <div className="mt-2">
                  <p className="font-semibold text-gray-900">{task.assignedTo.fullName}</p>
                  <p className="text-xs text-gray-500 mt-1">{task.assignedTo.email}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic mt-2">Not assigned yet</p>
              )}
            </div>

            {/* Status Timeline */}
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-600 uppercase mb-3">Timeline</p>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="text-gray-900 font-medium">
                    {task.createdAt
                      ? new Date(task.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-600">Last Updated</p>
                  <p className="text-gray-900 font-medium">
                    {task.updatedAt
                      ? new Date(task.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Created By (if different from task.createdBy) */}
        {task.createdBy && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase">Created By</p>
            <div className="mt-2 flex items-center gap-3">
              <div>
                <p className="font-medium text-gray-900">{task.createdBy.fullName}</p>
                <p className="text-xs text-gray-500">{task.createdBy.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}