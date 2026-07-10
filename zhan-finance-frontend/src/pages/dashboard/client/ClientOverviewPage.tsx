import { useEffect, useState } from 'react';
import { getTasks, requestTask, reviewTaskDecision } from '@/entities/task/api/taskApi';
import type { TaskDto, TaskStatus } from '@/entities/task/model/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Spinner } from '@/shared/ui/Spinner';
import { MiniCalendarWidget } from '../shared/calendar/MiniCalendarWidget';
import { TaskDetailsModal } from '@/entities/task/ui/TaskDetailsModal';
import { TaskCreateModal } from '@/widgets/task-create/TaskCreateModal';
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// Mapping internal statuses to client-friendly statuses
const CLIENT_STATUS_MAP: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  NEW: { label: 'В очереди', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Clock size={14} /> },
  IN_PROGRESS: { label: 'В работе', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock size={14} /> },
  ON_REVIEW: { label: 'Ждет подтверждения', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <AlertCircle size={14} /> },
  DONE: { label: 'Завершено', color: 'bg-brand-green/10 text-brand-green border-brand-green/20', icon: <CheckCircle2 size={14} /> },
  CANCELLED: { label: 'Отменено', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle size={14} /> },
};

export function ClientOverviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null);

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

  const handleUpdateTask = async (updatedTask: TaskDto) => {
    // Если клиент меняет статус через модалку
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  // Stats calculations
  const stats = {
    active: tasks.filter((t) => t.status === 'NEW' || t.status === 'IN_PROGRESS').length,
    onReview: tasks.filter((t) => t.status === 'ON_REVIEW').length,
    completed: tasks.filter((t) => t.status === 'DONE').length,
  };

  // Filter tasks
  const displayedTasks = tasks.filter(t => {
    if (activeTab === 'ACTIVE') return t.status !== 'DONE' && t.status !== 'CANCELLED';
    return t.status === 'DONE' || t.status === 'CANCELLED';
  });

  if (isLoading && tasks.length === 0) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Premium Welcome Header */}
      <div className="bg-gradient-to-r from-brand-green to-emerald-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Добро пожаловать, {user?.fullName || 'Клиент'}!</h1>
          <p className="text-brand-green-100 mt-2 text-lg max-w-2xl">
            Это ваш личный кабинет. Здесь вы можете оставлять заявки на услуги и отслеживать процесс их выполнения.
          </p>
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-10 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">В работе</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Требуют внимания</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.onReview}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Завершено</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* Left Column: Requests List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Request Block */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-brand-green hover:border-brand-green hover:bg-brand-green/5 transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <span className="font-medium text-sm">Создать новую заявку</span>
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
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('ACTIVE')}
                  className={twMerge(
                    "text-sm font-semibold pb-4 -mb-4 border-b-2 transition-all",
                    activeTab === 'ACTIVE' 
                      ? "border-brand-green text-brand-green" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  Активные заявки
                </button>
                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={twMerge(
                    "text-sm font-semibold pb-4 -mb-4 border-b-2 transition-all",
                    activeTab === 'HISTORY' 
                      ? "border-brand-green text-brand-green" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  История
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {displayedTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>У вас пока нет {activeTab === 'ACTIVE' ? 'активных заявок' : 'завершенных заявок'}.</p>
                </div>
              ) : (
                displayedTasks.map((task) => {
                  const clientStatus = CLIENT_STATUS_MAP[task.status];
                  return (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-5 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className={twMerge("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border", clientStatus.color)}>
                            {clientStatus.icon}
                            {clientStatus.label}
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

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(updated) => {
            handleUpdateTask(updated);
          }}
          userRole="CLIENT"
        />
      )}
    </div>
  );
}