import { useEffect, useState } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Spinner } from '@/shared/ui/Spinner';
import { Users, ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { MiniCalendarWidget } from '../shared/calendar/MiniCalendarWidget';
import { useTranslation } from 'react-i18next';

interface EmployeeDashboardDto {
  totalClients: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
}

async function getEmployeeDashboard(): Promise<EmployeeDashboardDto> {
  return apiRequest<EmployeeDashboardDto>('/api/crm/dashboard/employee');
}

export function EmployeeOverviewPage() {
  const { t } = useTranslation(['common']);
  const [data, setData] = useState<EmployeeDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
    NEW:         { label: t('employeeOverview.status.NEW'),        color: 'bg-gray-300',  textColor: 'text-gray-600' },
    IN_PROGRESS: { label: t('employeeOverview.status.IN_PROGRESS'),  color: 'bg-blue-500',  textColor: 'text-blue-600' },
    ON_REVIEW:   { label: t('employeeOverview.status.ON_REVIEW'), color: 'bg-amber-500', textColor: 'text-amber-600' },
    DONE:        { label: t('employeeOverview.status.DONE'),       color: 'bg-green-500', textColor: 'text-green-600' },
    CANCELLED:   { label: t('employeeOverview.status.CANCELLED'),    color: 'bg-red-400',   textColor: 'text-red-500' },
  };

  useEffect(() => {
    getEmployeeDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;
  if (!data) return <div className="p-6 text-red-500">{t('employeeOverview.loadError')}</div>;

  const activeTasks = (data.tasksByStatus['NEW'] ?? 0) + (data.tasksByStatus['IN_PROGRESS'] ?? 0);
  const onReviewTasks = data.tasksByStatus['ON_REVIEW'] ?? 0;
  const doneTasks = data.tasksByStatus['DONE'] ?? 0;

  const statCards = [
    {
      label: t('employeeOverview.statClients'),
      value: data.totalClients,
      icon: <Users size={22} className="text-blue-500" />,
      bg: 'bg-blue-50',
    },
    {
      label: t('employeeOverview.statTasks'),
      value: data.totalTasks,
      icon: <ClipboardList size={22} className="text-amber-500" />,
      bg: 'bg-amber-50',
    },
    {
      label: t('employeeOverview.statActive'),
      value: activeTasks,
      icon: <AlertCircle size={22} className="text-indigo-500" />,
      bg: 'bg-indigo-50',
    },
    {
      label: t('employeeOverview.statReview'),
      value: onReviewTasks,
      icon: <Clock size={22} className="text-orange-500" />,
      bg: 'bg-orange-50',
    },
    {
      label: t('employeeOverview.statDone'),
      value: doneTasks,
      icon: <CheckCircle2 size={22} className="text-green-500" />,
      bg: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('employeeOverview.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('employeeOverview.subtitle')}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Task status breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">{t('employeeOverview.taskStats')}</h2>
            
            <div className="space-y-4">
              {['NEW', 'IN_PROGRESS', 'ON_REVIEW', 'DONE', 'CANCELLED'].map((status) => {
                const count = data.tasksByStatus[status] ?? 0;
                const total = data.totalTasks || 1; // prevent div by zero
                const percent = Math.round((count / total) * 100);
                const config = STATUS_CONFIG[status];
                
                return (
                  <div key={status} className="flex items-center gap-2 md:gap-4">
                    <div className="w-24 md:w-28 shrink-0 text-xs md:text-sm font-medium text-gray-600 truncate">{config.label}</div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${config.color}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className={`w-12 text-right text-sm font-bold ${config.textColor}`}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <MiniCalendarWidget />
        </div>
      </div>
    </div>
  );
}
