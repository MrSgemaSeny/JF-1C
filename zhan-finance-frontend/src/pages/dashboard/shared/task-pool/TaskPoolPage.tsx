import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { getTasks } from '@/entities/task/api/taskApi';
import { useApiData } from '@/shared/hooks/useApiData';
import { Users, Loader2, Inbox } from 'lucide-react';
import { TaskDetailsModal } from '@/entities/task/ui/TaskDetailsModal';
import { StatusBadge } from '@/shared/ui/Badge';
import { getEmployees } from '@/entities/employee/api/employeeApi';
import type { EmployeeDto } from '@/entities/employee/model/types';
import type { TaskDto } from '@/entities/task/model/types';
import { assignTask } from '@/entities/task/api/taskApi';
import { ChevronDown, Check } from 'lucide-react';

function CustomAssignDropdown({ employees, disabled, onAssign, assigningTaskId, taskId }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="inline-flex items-center justify-between w-40 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-50 transition-all shadow-sm"
      >
        {assigningTaskId === taskId ? 'Назначение...' : 'Назначить'}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
          <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
            {employees.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">Нет доступных сотрудников</div>
            ) : (
              employees.map((emp: EmployeeDto) => (
                <button
                  key={emp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onAssign(e, taskId, emp.id);
                  }}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-green/5 hover:text-brand-green transition-colors text-left font-medium"
                >
                  <span className="w-6 flex-shrink-0"></span>
                  {emp.fullName}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="p-6 md:p-8 max-w-full mx-auto min-h-full">
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
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[40%]">Задача</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Клиент</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Создано</th>
                <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task: TaskDto) => (
                <tr 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className="hover:bg-brand-green/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="font-semibold text-gray-800 text-base group-hover:text-brand-green transition-colors">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1.5">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {task.client ? (
                      <div className="text-sm font-medium text-gray-700">{task.client.fullName}</div>
                    ) : (
                      <span className="text-xs text-gray-400 italic bg-gray-50 px-2 py-1 rounded">Не указан</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {task.stage && <StatusBadge stage={task.stage} />}
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                      {user?.role === 'EMPLOYEE' && (
                        <button
                          title="Забрать задачу себе"
                          disabled={assigningTaskId === task.id}
                          onClick={(e) => handleAssign(e, task.id, user.userId)}
                          className="bg-brand-green text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-green/90 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                        >
                          {assigningTaskId === task.id ? 'Назначение...' : 'Взять себе'}
                        </button>
                      )}

                      {user?.role === 'ADMIN' && (
                        <CustomAssignDropdown
                          taskId={task.id}
                          assigningTaskId={assigningTaskId}
                          employees={employees}
                          disabled={assigningTaskId === task.id}
                          onAssign={handleAssign}
                        />
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
