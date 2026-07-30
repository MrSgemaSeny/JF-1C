import { useEffect, useState } from 'react';
import { getEmployees, getEmployeeWorkload, type EmployeeWorkloadDto } from '@/entities/employee/api/employeeApi';
import { getTasks, assignTask } from '@/entities/task/api/taskApi';
import type { EmployeeDto } from '@/entities/employee/model/types';
import type { TaskDto } from '@/entities/task/model/types';
import { Users, Briefcase, CheckSquare, Layers, UserCheck, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

export function AdvisorWorkloadPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [workloads, setWorkloads] = useState<Map<number, number>>(new Map());
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);
  const [assigningToEmployeeId, setAssigningToEmployeeId] = useState<number | null>(null);

  const [pendingAssignment, setPendingAssignment] = useState<{ taskId: number; employeeId: number } | null>(null);

  async function loadWorkloadData() {
    setIsLoading(true);
    try {
      const [empList, wlList, allTasks, unassigned] = await Promise.all([
        getEmployees().catch(() => []),
        getEmployeeWorkload().catch(() => [] as EmployeeWorkloadDto[]),
        getTasks({}).catch(() => []),
        getTasks({ unassigned: true }).catch(() => [])
      ]);
      setEmployees(empList);
      const wlMap = new Map<number, number>();
      wlList.forEach(w => wlMap.set(w.employeeId, w.activeTasksCount));
      setWorkloads(wlMap);
      setTasks(allTasks as TaskDto[]);
      setUnassignedTasks(unassigned as TaskDto[]);
    } catch (e) {
      console.error('Failed to load Advisor Workload:', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkloadData();
  }, []);

  async function handleAssignTask(taskId: number, employeeId: number) {
    try {
      await assignTask(taskId, employeeId);
      setPendingAssignment(null);
      await loadWorkloadData();
    } catch (e) {
      console.error(e);
      alert('Ошибка при назначении задачи');
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Загрузка мониторинга нагрузки...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-600 text-xs font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Балансировка нагрузки команды
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Мониторинг специалистов</h1>
          <p className="text-gray-500 text-sm mt-1">
            Распределение задач из пула и оптимальная балансировка нагрузки между сотрудниками.
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.ADVISOR_TASK_POOL)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Layers className="w-4 h-4" />
          Пул нераспределенных задач ({unassignedTasks.length})
        </button>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => {
          const activeTasksCount = workloads.get(emp.id) ?? tasks.filter(t => t.assignedTo?.id === emp.id).length;
          const empTasks = tasks.filter(t => t.assignedTo?.id === emp.id);
          const isOverloaded = activeTasksCount > 7;

          return (
            <div key={emp.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{emp.fullName}</h3>
                      <p className="text-xs text-gray-400">{emp.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    emp.role === 'ADVISOR' ? 'bg-purple-100 text-purple-800' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {emp.role}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-500 uppercase">Нагрузка</span>
                  <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                    isOverloaded ? 'bg-red-100 text-red-700' : activeTasksCount > 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {activeTasksCount} активных задач
                  </span>
                </div>

                {/* Current Tasks List */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Текущие задачи</div>
                  {empTasks.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-2">Свободен для новых задач</div>
                  ) : (
                    empTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="text-xs p-2.5 bg-gray-50/80 rounded-xl font-medium text-gray-700 truncate flex justify-between items-center">
                        <span className="truncate">{t.title}</span>
                        <span className="text-[10px] text-purple-600 font-bold ml-2 shrink-0">{t.stage?.name}</span>
                      </div>
                    ))
                  )}
                  {empTasks.length > 3 && (
                    <div className="text-[11px] text-gray-400 text-right font-medium">+ еще {empTasks.length - 3} задач</div>
                  )}
                </div>
              </div>

              {/* Delegate Task Button */}
              {unassignedTasks.length > 0 && (
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setPendingAssignment({ taskId: Number(e.target.value), employeeId: emp.id });
                      }
                    }}
                    value={pendingAssignment?.employeeId === emp.id ? pendingAssignment.taskId : ''}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-purple-800 hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>+ Выбрать задачу из пула</option>
                    {unassignedTasks.map((ut) => (
                      <option key={ut.id} value={ut.id}>
                        {ut.title} ({ut.client?.companyName || ut.client?.fullName || 'Без клиента'})
                      </option>
                    ))}
                  </select>

                  {pendingAssignment?.employeeId === emp.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAssignTask(pendingAssignment.taskId, pendingAssignment.employeeId)}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        Подтвердить
                      </button>
                      <button
                        onClick={() => setPendingAssignment(null)}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-all"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
