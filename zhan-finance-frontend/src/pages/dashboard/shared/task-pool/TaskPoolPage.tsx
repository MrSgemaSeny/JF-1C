import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getTasks } from '@/entities/task/api/taskApi';
import { useApiData } from '@/shared/hooks/useApiData';
import { Users, Loader2, Inbox } from 'lucide-react';
import { TaskDetailsModal } from '@/entities/task/ui/TaskDetailsModal';
import { StatusBadge } from '@/shared/ui/Badge';
import type { TaskDto } from '@/entities/task/model/types';
import { assignTask } from '@/entities/task/api/taskApi';
import type { EmployeeDto } from '@/entities/employee/model/types';
import { getEmployees } from '@/entities/employee/api/employeeApi';

export function TaskPoolPage() {
  const { user } = useAuth();
  const { data: tasks, isLoading, error, refetch } = useApiData(() => getTasks({ unassigned: true }));
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [employees, setEmployees] = React.useState<EmployeeDto[]>([]);
  const [assigningTaskId, setAssigningTaskId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (user?.role === 'ADMIN') {
      getEmployees().then(setEmployees).catch(console.error);
    }
  }, [user?.role]);

  const handleAssign = async (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>, taskId: number, assigneeId?: number) => {
    e.stopPropagation();
    setAssigningTaskId(taskId);
    try {
      await assignTask(taskId, assigneeId);
      refetch();
    } catch (err) {
      console.error('Failed to assign task:', err);
      alert('Не удалось назначить задачу');
    } finally {
      setAssigningTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-brand-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500 gap-4">
        <p>Ошибка загрузки пула задач</p>
        <button onClick={refetch} className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
            <Users size={24} />
          </div>
          Пул задач
        </h1>
        <p className="text-gray-500">
          Свободные задачи, ожидающие назначения. {user?.role === 'EMPLOYEE' ? 'Вы можете взять любую задачу в работу.' : 'Назначьте задачу сотруднику.'}
        </p>
      </div>

      {!tasks || tasks.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <Inbox size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Пул пуст</h3>
          <p className="text-gray-500 max-w-sm">
            Сейчас нет неназначенных задач. Все задачи находятся в работе.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[40%]">Задача</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Клиент</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Создано</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task: TaskDto) => (
                <tr 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-brand-green/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800 group-hover:text-brand-green transition-colors">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 truncate max-w-md mt-1">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.client ? (
                      <div className="text-sm text-gray-700">{task.client.fullName}</div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Не указан</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {task.stage && <StatusBadge stage={task.stage} />}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {(user?.role === 'EMPLOYEE' || user?.role === 'ADMIN') && (
                        <button
                          title="Забрать задачу себе"
                          disabled={assigningTaskId === task.id}
                          onClick={(e) => handleAssign(e, task.id, user.userId)}
                          className="bg-brand-green text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-green/90 hover:shadow-sm transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                          {assigningTaskId === task.id ? 'Назначение...' : 'Взять себе'}
                        </button>
                      )}

                      {user?.role === 'ADMIN' && (
                        <div className="relative group">
                          <select
                            disabled={assigningTaskId === task.id}
                            value=""
                            onChange={(e) => handleAssign(e, task.id, e.target.value ? Number(e.target.value) : undefined)}
                            className="text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer transition-all focus:ring-2 focus:ring-brand-green/20 outline-none appearance-none pr-8 min-w-[120px]"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                          >
                            <option value="" disabled>Назначить...</option>
                            <optgroup label="Сотрудники">
                              {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          userRole={user!.role as any}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(updatedTask) => {
            // Update local state or just refetch. In a pool, if it's assigned, it might leave the pool.
            // A simple refetch is safest to keep the list accurate.
            if (updatedTask.assignedToId) {
              refetch();
              setSelectedTask(null); // Close modal if it's no longer in the pool (assigned to me or someone else)
            } else {
              setSelectedTask(updatedTask);
            }
          }}
        />
      )}
    </div>
  );
}
