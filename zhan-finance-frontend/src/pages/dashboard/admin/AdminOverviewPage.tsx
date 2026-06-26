import { useEffect, useState } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Spinner } from '@/shared/ui/Spinner';
import { Users, UserCheck, ClipboardList, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

interface EmployeeStatsDto {
  employeeId: number;
  employeeName: string;
  activeTasks: number;
  doneTasks: number;
  overdueTasks: number;
}

interface AdminDashboardDto {
  totalClients: number;
  totalEmployees: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  totalUsers: number;
  employeeStats: EmployeeStatsDto[];
}

async function getAdminDashboard(): Promise<AdminDashboardDto> {
  return apiRequest<AdminDashboardDto>('/api/crm/dashboard/admin');
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NEW:         { label: 'Новые',        color: 'bg-gray-400',   icon: <Clock size={14} /> },
  IN_PROGRESS: { label: 'В процессе',  color: 'bg-blue-500',   icon: <AlertCircle size={14} /> },
  ON_REVIEW:   { label: 'На проверке', color: 'bg-amber-500',  icon: <Clock size={14} /> },
  DONE:        { label: 'Готово',       color: 'bg-green-500',  icon: <CheckCircle2 size={14} /> },
  CANCELLED:   { label: 'Отменено',    color: 'bg-red-400',    icon: <XCircle size={14} /> },
};

export function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;

  if (!data) return <div className="p-6 text-red-500">Не удалось загрузить данные</div>;

  const statCards = [
    {
      label: 'Клиентов',
      value: data.totalClients,
      icon: <Users size={22} className="text-blue-500" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Сотрудников',
      value: data.totalEmployees,
      icon: <UserCheck size={22} className="text-purple-500" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Всего задач',
      value: data.totalTasks,
      icon: <ClipboardList size={22} className="text-amber-500" />,
      bg: 'bg-amber-50',
    },
    {
      label: 'Выполнено',
      value: data.tasksByStatus['DONE'] ?? 0,
      icon: <CheckCircle2 size={22} className="text-green-500" />,
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Обзор</h1>
        <p className="text-sm text-gray-500 mt-1">Общая статистика системы</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Задачи по статусам</h2>
        <div className="space-y-3">
          {(['NEW', 'IN_PROGRESS', 'ON_REVIEW', 'DONE', 'CANCELLED'] as const).map(status => {
            const cfg = STATUS_CONFIG[status];
            const count = data.tasksByStatus[status] ?? 0;
            const percent = data.totalTasks > 0 ? Math.round((count / data.totalTasks) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-28 md:w-36 flex-shrink-0">
                  <span className="text-gray-400">{cfg.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{cfg.label}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cfg.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                <span className="text-xs text-gray-400 w-8">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee Productivity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Продуктивность сотрудников</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="pb-3 font-medium">Сотрудник</th>
                <th className="pb-3 font-medium text-center">Выполнено</th>
                <th className="pb-3 font-medium text-center">В работе</th>
                <th className="pb-3 font-medium text-center">Просрочено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.employeeStats.map(emp => (
                <tr key={emp.employeeId} className="hover:bg-gray-50/50">
                  <td className="py-3 font-medium text-gray-900">{emp.employeeName}</td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium text-xs">
                      <CheckCircle2 size={12} /> {emp.doneTasks}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs">
                      <Clock size={12} /> {emp.activeTasks}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {emp.overdueTasks > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium text-xs">
                        <AlertCircle size={12} /> {emp.overdueTasks}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.employeeStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    Нет данных по сотрудникам
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
