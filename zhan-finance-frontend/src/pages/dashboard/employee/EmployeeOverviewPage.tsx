import { useEffect, useState } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Spinner } from '@/shared/ui/Spinner';
import { Users, ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface EmployeeDashboardDto {
  totalClients: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
}

async function getEmployeeDashboard(): Promise<EmployeeDashboardDto> {
  return apiRequest<EmployeeDashboardDto>('/api/crm/dashboard/employee');
}

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  NEW:         { label: 'Новые',        color: 'bg-gray-300',  textColor: 'text-gray-600' },
  IN_PROGRESS: { label: 'В процессе',  color: 'bg-blue-500',  textColor: 'text-blue-600' },
  ON_REVIEW:   { label: 'На проверке', color: 'bg-amber-500', textColor: 'text-amber-600' },
  DONE:        { label: 'Готово',       color: 'bg-green-500', textColor: 'text-green-600' },
  CANCELLED:   { label: 'Отменено',    color: 'bg-red-400',   textColor: 'text-red-500' },
};

export function EmployeeOverviewPage() {
  const [data, setData] = useState<EmployeeDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEmployeeDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;
  if (!data) return <div className="p-6 text-red-500">Не удалось загрузить данные</div>;

  const activeTasks = (data.tasksByStatus['NEW'] ?? 0) + (data.tasksByStatus['IN_PROGRESS'] ?? 0);
  const onReviewTasks = data.tasksByStatus['ON_REVIEW'] ?? 0;
  const doneTasks = data.tasksByStatus['DONE'] ?? 0;

  const statCards = [
    {
      label: 'Моих клиентов',
      value: data.totalClients,
      icon: <Users size={22} className="text-blue-500" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'Всего задач',
      value: data.totalTasks,
      icon: <ClipboardList size={22} className="text-amber-500" />,
      bg: 'bg-amber-50',
    },
    {
      label: 'Активных',
      value: activeTasks,
      icon: <AlertCircle size={22} className="text-indigo-500" />,
      bg: 'bg-indigo-50',
    },
    {
      label: 'На проверке',
      value: onReviewTasks,
      icon: <Clock size={22} className="text-orange-500" />,
      bg: 'bg-orange-50',
    },
    {
      label: 'Выполнено',
      value: doneTasks,
      icon: <CheckCircle2 size={22} className="text-green-500" />,
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мой дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">Статистика по вашей работе</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium leading-tight">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task status breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Мои задачи по статусам</h2>
        <div className="space-y-3">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = data.tasksByStatus[status] ?? 0;
            const percent = data.totalTasks > 0 ? Math.round((count / data.totalTasks) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-4">
                <span className={`text-xs font-semibold w-28 ${cfg.textColor}`}>{cfg.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.color}`} style={{ width: `${percent}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
