import { useEffect, useState } from 'react';
import { getEmployees, type EmployeeWorkloadDto } from '@/entities/employee/api/employeeApi';
import { getClients } from '@/entities/client/api/clientApi';
import { getTasks } from '@/entities/task/api/taskApi';
import type { EmployeeDto } from '@/entities/employee/model/types';
import type { ClientDto } from '@/entities/client/model/types';
import type { TaskDto } from '@/entities/task/model/types';
import { Users, Briefcase, CheckSquare, Layers, ShieldCheck, ArrowRight, UserCheck, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

export function AdvisorOverviewPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdvisorData() {
      setIsLoading(true);
      try {
        const [empList, clientList, allTasks, unassigned] = await Promise.all([
          getEmployees().catch(() => []),
          getClients().catch(() => []),
          getTasks({}).catch(() => []),
          getTasks({ unassigned: true }).catch(() => [])
        ]);
        setEmployees(empList);
        setClients(clientList);
        setTasks(allTasks as TaskDto[]);
        setUnassignedTasks(unassigned as TaskDto[]);
      } catch (e) {
        console.error('Failed to load Advisor Overview:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdvisorData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Загрузка панели Эдвайзера...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-purple-800/30">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Портал Эдвайзера / Старшего наставника
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Обзор портфеля и команды</h1>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            Мониторинг нагрузки сотрудников, глобальное управление клиентами и распределение задач из пула.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.ADVISOR_WORKLOAD)}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-purple-500/20 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Нагрузка команды
          </button>
          <button
            onClick={() => navigate(ROUTES.ADVISOR_TASK_POOL)}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl backdrop-blur-md transition-all flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Пул задач ({unassignedTasks.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">Всего клиентов</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{clients.length}</div>
            <div className="text-xs text-purple-600 font-semibold mt-1">Полный доступ компании</div>
          </div>
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">Активные задачи</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{tasks.length}</div>
            <div className="text-xs text-blue-600 font-semibold mt-1">В процессе выполнения</div>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">Пул свободный</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{unassignedTasks.length}</div>
            <div className="text-xs text-amber-600 font-semibold mt-1">Требуют назначения</div>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">Команда</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{employees.length}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Сотрудники и Эдвайзеры</div>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Team Workload Summary & Recent Unassigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Team Workload Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Загруженность специалистов</h2>
              <p className="text-xs text-gray-500">Текущий распределительный баланс команды</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.ADVISOR_WORKLOAD)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Подробнее <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {employees.slice(0, 5).map((emp) => {
              const empTasksCount = tasks.filter(t => t.assignedTo?.id === emp.id).length;
              const statusColor = empTasksCount > 7 ? 'bg-red-500' : empTasksCount > 3 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={emp.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/70 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{emp.fullName}</div>
                      <div className="text-xs text-gray-400">{emp.email} • <span className="font-semibold text-purple-600">{emp.role}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900">{empTasksCount}</span>
                      <span className="text-xs text-gray-400"> задач</span>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unassigned Task Pool Sidebar */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Пул нераспределённых задач</h2>
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {unassignedTasks.length}
              </span>
            </div>
            
            {unassignedTasks.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <CheckSquare className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
                Все задачи распределены по исполнителям!
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 hover:bg-amber-50/60 transition-colors">
                    <div className="text-sm font-bold text-gray-900 truncate">{task.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                      <span>{task.client?.companyName || task.client?.fullName || 'Без клиента'}</span>
                      <span className="font-medium text-amber-700">{task.stage?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(ROUTES.ADVISOR_TASK_POOL)}
            className="w-full py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-2xl text-sm font-bold transition-colors text-center block"
          >
            Перейти в Пул задач
          </button>
        </div>
      </div>
    </div>
  );
}
