import { useEffect, useState } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Spinner } from '@/shared/ui/Spinner';
import { Users, ClipboardList, CheckCircle2, Clock, Flame, Target, History, Bell, ArrowRight, AlertCircle } from 'lucide-react';
import { MiniCalendarWidget } from '../shared/calendar/MiniCalendarWidget';
import { useTranslation } from 'react-i18next';
import { WeeklySummaryWidget } from '@/widgets/dashboard/WeeklySummaryWidget';
import { TaskGridBoard } from '@/widgets/task-board/TaskGridBoard';
import type { TaskDto } from '@/entities/task/model/types';
import { useNotifications } from '@/features/notifications/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

interface EmployeeDashboardDto {
  totalClients: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  avgCompletionDays: number;
  urgentTasks: TaskDto[];
  plannedTasks: TaskDto[];
  recentHistory: TaskDto[];
}

async function getEmployeeDashboard(): Promise<EmployeeDashboardDto> {
  return apiRequest<EmployeeDashboardDto>('/api/crm/dashboard/employee');
}

export function EmployeeOverviewPage() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [data, setData] = useState<EmployeeDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    getEmployeeDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner />;
  if (!data) return <div className="p-6 text-red-500">{t('employeeOverview.loadError')}</div>;

  const statCards = [
    {
      label: t('employeeOverview.statClients', { defaultValue: 'Мои клиенты' }),
      value: data.totalClients,
      icon: <Users size={20} className="text-gray-500" />,
      color: 'bg-white',
    },
    {
      label: t('employeeOverview.statTasks', { defaultValue: 'Всего задач' }),
      value: data.totalTasks,
      icon: <ClipboardList size={20} className="text-gray-500" />,
      color: 'bg-white',
    },
    {
      label: t('employeeOverview.statInProgress', { defaultValue: 'В работе' }),
      value: (data.tasksByStatus['IN_PROGRESS'] ?? 0) + (data.tasksByStatus['NEW'] ?? 0),
      icon: <Clock size={20} className="text-blue-500" />,
      color: 'bg-white border-l-4 border-l-blue-500',
    },
    {
      label: t('employeeOverview.statOnReview', { defaultValue: 'На проверке' }),
      value: data.tasksByStatus['ON_REVIEW'] ?? 0,
      icon: <AlertCircle size={20} className="text-orange-500" />,
      color: 'bg-white border-l-4 border-l-orange-500',
    },
    {
      label: t('employeeOverview.statDone', { defaultValue: 'Завершено' }),
      value: data.tasksByStatus['DONE'] ?? 0,
      icon: <CheckCircle2 size={20} className="text-emerald-500" />,
      color: 'bg-white border-l-4 border-l-emerald-500',
    },
    {
      label: t('employeeOverview.statAvgTime', { defaultValue: 'Среднее время (дн)' }),
      value: data.avgCompletionDays.toFixed(1),
      icon: <Clock size={20} className="text-purple-500" />,
      color: 'bg-white border-l-4 border-l-purple-500',
    },
  ];

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('employeeOverview.title', { defaultValue: 'Обзор' })}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('employeeOverview.subtitle', { defaultValue: 'Ваш рабочий пульт' })}</p>
      </div>

      <WeeklySummaryWidget />

      {/* Stat cards in Stripe/Vercel style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className={`rounded-xl shadow-sm border border-gray-200 p-4 ${card.color}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</span>
              {card.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Urgent Tasks */}
          {data.urgentTasks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
               <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Flame className="text-red-500" size={18} />
                   <h2 className="text-sm font-bold text-gray-900">{t('employeeOverview.urgentTasks', { defaultValue: 'Горящие задачи' })}</h2>
                   <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{data.urgentTasks.length}</span>
                 </div>
               </div>
               <div className="p-4 bg-gray-50/50">
                 <TaskGridBoard 
                   initialTasks={data.urgentTasks} 
                   userRole="EMPLOYEE" 
                   onBatchSave={async () => {}} 
                   compact={true} 
                   maxRows={4}
                   gridColsClass="grid-cols-1 xl:grid-cols-2"
                 />
               </div>
            </div>
          )}

          {/* Planned Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
             <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Target className="text-blue-500" size={18} />
                 <h2 className="text-sm font-bold text-gray-900">{t('employeeOverview.plannedTasks', { defaultValue: 'План в работе' })}</h2>
               </div>
               <button onClick={() => navigate(ROUTES.EMPLOYEE_TASKS)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors">
                 {t('employeeOverview.allTasks', { defaultValue: 'Все задачи' })} <ArrowRight size={14} />
               </button>
             </div>
             <div className="p-4">
               {data.plannedTasks.length > 0 ? (
                 <TaskGridBoard 
                   initialTasks={data.plannedTasks} 
                   userRole="EMPLOYEE" 
                   onBatchSave={async () => {}} 
                   compact={true} 
                   maxRows={6}
                   gridColsClass="grid-cols-1 xl:grid-cols-2"
                 />
               ) : (
                 <div className="text-center py-8 text-gray-400 text-sm">
                   {t('employeeOverview.noPlannedTasks', { defaultValue: 'Нет запланированных задач на ближайшее время' })}
                 </div>
               )}
             </div>
          </div>

          {/* Recent History */}
          {data.recentHistory.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
               <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                 <History className="text-gray-500" size={18} />
                 <h2 className="text-sm font-bold text-gray-900">{t('employeeOverview.recentHistory', { defaultValue: 'Недавно завершенные' })}</h2>
               </div>
               <div className="p-4">
                 <TaskGridBoard 
                   initialTasks={data.recentHistory} 
                   userRole="EMPLOYEE" 
                   onBatchSave={async () => {}} 
                   compact={true} 
                   maxRows={4}
                   gridColsClass="grid-cols-1 xl:grid-cols-2"
                 />
               </div>
             </div>
          )}

        </div>

        <div className="space-y-6">
          <MiniCalendarWidget />
          
          {/* Notifications Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900">{t('employeeOverview.notifications', { defaultValue: 'Уведомления' })}</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{unreadCount}</span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map(notification => (
                  <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}>
                    <p className="text-sm text-gray-800">{notification.message}</p>
                    <span className="text-xs text-gray-400 mt-2 block">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">{t('employeeOverview.noNewNotifications', { defaultValue: 'Нет новых уведомлений' })}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
