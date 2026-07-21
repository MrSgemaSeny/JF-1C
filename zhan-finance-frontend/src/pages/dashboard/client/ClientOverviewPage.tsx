import { useEffect, useState } from 'react';
import { getTasks, requestTask } from '@/entities/task/api/taskApi';
import type { TaskDto, StageDto } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { MiniCalendarWidget } from '../shared/calendar/MiniCalendarWidget';

import { TaskCreateModal } from '@/widgets/task-create/TaskCreateModal';
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';

// Mapping internal statuses to client-friendly statuses
const CLIENT_STATUS_MAP: Record<string, { labelKey: string; color: string; icon: React.ReactNode }> = {
  NEW: { labelKey: 'clientDashboard.status.NEW', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock size={14} /> },
  IN_PROGRESS: { labelKey: 'clientDashboard.status.IN_PROGRESS', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock size={14} /> },
  ON_REVIEW: { labelKey: 'clientDashboard.status.ON_REVIEW', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <AlertCircle size={14} /> },
  DONE: { labelKey: 'clientDashboard.status.DONE', color: 'bg-brand-green/10 text-brand-green border-brand-green/20', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { labelKey: 'clientDashboard.status.CANCELLED', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle size={14} /> },
};

function getClientStatus(stage: StageDto | undefined, t: any): { labelKey: string; dynamicLabel?: string; color: string; hexColor?: string; icon: React.ReactNode } {
  if (!stage) return CLIENT_STATUS_MAP.NEW;
  
  const base = (() => {
    if (stage.type === 'WON') return CLIENT_STATUS_MAP.DONE;
    if (stage.type === 'LOST') return CLIENT_STATUS_MAP.CANCELLED;
    if (stage.name === 'Новый') return CLIENT_STATUS_MAP.NEW;
    if (stage.name === 'В работе') return CLIENT_STATUS_MAP.IN_PROGRESS;
    return { labelKey: '', dynamicLabel: t(`stages.${stage.name}`, { defaultValue: stage.name }), color: '', icon: <Clock size={14} /> };
  })();

  if (stage.color) {
    return { ...base, color: '', hexColor: stage.color };
  }
  return base;
}

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

export function ClientOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Filter state
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

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
        const data = await getTasks();
        // Сортировка: новые сверху
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      await requestTask({ 
        title, 
        description, 
        clientId: user?.userId || 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined 
      });
      setTitle('');
      setDescription('');
      setDueDate('');
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
    active: tasks.filter((t) => t.stage?.type === 'OPEN').length,
    onReview: tasks.filter((t) => {
      const name = t.stage?.name?.toLowerCase() || '';
      return name.includes('доработк') || name.includes('проверк');
    }).length,
    completed: tasks.filter((t) => t.stage?.type === 'WON').length,
  };

  // Filter tasks
  const displayedTasks = tasks.filter(t => {
    if (activeTab === 'ACTIVE') return t.stage?.type === 'OPEN';
    return t.stage?.type === 'WON' || t.stage?.type === 'LOST';
  });

  if (isLoading && tasks.length === 0) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="max-w-[1440px] w-full px-4 md:px-8 mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Simple Welcome Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('clientDashboard.welcome', { name: user?.fullName || 'Client' })}
        </h1>
        <p className="text-gray-500 mt-1">
          {t('clientDashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{t('clientDashboard.inProgress')}</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{t('clientDashboard.needsAttention')}</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.onReview}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{t('clientDashboard.completed')}</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-6 mt-4">
        
        {/* Requests List */}
        <div className="space-y-6">
          
          {/* Create Request Block */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-brand-green hover:border-brand-green hover:bg-brand-green/5 transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <span className="font-medium text-sm">{t('clientDashboard.createRequest')}</span>
          </button>

          {showForm && (
            <TaskCreateModal 
              onClose={() => setShowForm(false)} 
              onCreated={() => {
                setShowForm(false);
                fetchTasks();
              }} 
            />
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Requests List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 px-6 pt-4">
              <button
                className={twMerge("pb-4 px-4 text-sm font-medium border-b-2 transition-colors", activeTab === 'ACTIVE' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700')}
                onClick={() => setActiveTab('ACTIVE')}
              >
                {t('clientDashboard.activeRequests')}
              </button>
              <button
                className={twMerge("pb-4 px-4 text-sm font-medium border-b-2 transition-colors", activeTab === 'HISTORY' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700')}
                onClick={() => setActiveTab('HISTORY')}
              >
                {t('clientDashboard.history')}
              </button>
            </div>

            <div className="p-6">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  {activeTab === 'ACTIVE' ? t('clientDashboard.noActiveRequests') : t('clientDashboard.noHistoryRequests')}
                </div>
              ) : (
                displayedTasks.map((task) => {
                  const status = getClientStatus(task.stage, t);
                  return (
                    <div 
                      key={task.id}
                      onClick={() => navigate(ROUTES.CLIENT_TASK_DETAILS.replace(':id', task.id.toString()))}
                      className="p-5 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span 
                            className={twMerge("px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit", status.color, status.hexColor ? "border" : "")}
                            style={status.hexColor ? {
                               backgroundColor: status.hexColor + '1A', 
                               color: status.hexColor,
                               borderColor: status.hexColor + '33'
                            } : undefined}
                          >
                            {status.icon}
                            {status.labelKey ? t(status.labelKey) : ('dynamicLabel' in status ? status.dynamicLabel : '')}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {task.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 shrink-0">
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg text-gray-600 font-medium">
                            <MessageSquare size={14} />
                            {task.comments.length}
                          </span>
                        )}
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-brand-green group-hover:border-brand-green shadow-sm transition-all">
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          <MiniCalendarWidget />
        </div>
      </div>
    </div>
  );
}