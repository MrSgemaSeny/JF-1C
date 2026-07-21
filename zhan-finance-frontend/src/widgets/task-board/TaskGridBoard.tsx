import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { TaskCard } from '@/entities/task/ui/TaskCard';
import type { TaskDto } from '@/entities/task/model/types';
import { TaskSaveButton } from '@/features/task/ui/TaskSaveButton';
import { Filter, ArrowUpDown, X } from 'lucide-react';
import { getEmployees } from '@/entities/employee/api/employeeApi';
import { deleteTask, getTask } from '@/entities/task/api/taskApi';
import { TaskDetailsModal } from '@/entities/task/ui/TaskDetailsModal';
import type { EmployeeDto } from '@/entities/employee/model/types';
import { useApiData } from '@/shared/hooks/useApiData';
import { useTranslation } from 'react-i18next';

interface TaskGridBoardProps {
  initialTasks: TaskDto[];
  onBatchSave: (tasks: TaskDto[]) => Promise<void>;
  userRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT' | 'LEARNER';
}

export interface TaskGridBoardRef {
  createNewTask: (task: TaskDto) => void;
  openTaskModal: (taskId: number) => void;
}

type SortOption = 'newest' | 'oldest' | 'deadline_asc' | 'deadline_desc';

export const TaskGridBoard = forwardRef<TaskGridBoardRef, TaskGridBoardProps>(({ initialTasks, onBatchSave, userRole }, ref) => {
  const { t } = useTranslation(['crm', 'common']);
  
  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'ALL', label: t('kanban.allStages', { defaultValue: 'Все стадии' }) },
  ];

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: t('kanban.sort.newest', { defaultValue: 'Новые первыми' }) },
    { value: 'oldest', label: t('kanban.sort.oldest', { defaultValue: 'Старые первыми' }) },
    { value: 'deadline_asc', label: t('kanban.sort.deadline_asc', { defaultValue: 'Дедлайн ↑' }) },
    { value: 'deadline_desc', label: t('kanban.sort.deadline_desc', { defaultValue: 'Дедлайн ↓' }) },
  ];

  const [tasks, setTasks] = useState<TaskDto[]>(initialTasks);
  const [isSaving, setIsSaving] = useState(false);
  const [createdTaskIds, setCreatedTaskIds] = useState<Set<number>>(new Set());
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<TaskDto | null>(null);

  const { data: employees } = useApiData(userRole === 'ADMIN' ? getEmployees : async () => []);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useImperativeHandle(ref, () => ({
    createNewTask: (task: TaskDto) => {
      setTasks(prev => [task, ...prev]);
      setCreatedTaskIds(prev => new Set(prev).add(task.id));
      setSelectedTaskForModal(task);
    },
    openTaskModal: async (taskId: number) => {
      const existing = tasks.find(t => t.id === taskId);
      if (existing) {
        setSelectedTaskForModal(existing);
      } else {
        try {
          // static getTask import is used instead
          const fetched = await getTask(taskId);
          setSelectedTaskForModal(fetched);
        } catch (e) {
          console.error('Task not found:', e);
          alert('Task not found');
        }
      }
    }
  }));

  useEffect(() => {
    setTasks(initialTasks);
    setCreatedTaskIds(new Set());
  }, [initialTasks]);

  const changedTasks = useMemo(() => {
    return tasks.filter(t => {
      if (createdTaskIds.has(t.id)) return true;
      const initial = initialTasks.find(it => it.id === t.id);
      return initial && JSON.stringify(initial) !== JSON.stringify(t);
    });
  }, [tasks, initialTasks, createdTaskIds]);

  const hasChanges = changedTasks.length > 0;

  // Filter + Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...tasks];

    // Filter by status
    if (statusFilter !== 'ALL') {
      // result = result.filter(t => t.stageId?.toString() === statusFilter);
    }

    // Filter by priority
    

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'deadline_asc': {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        case 'deadline_desc': {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }
        
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, statusFilter, sortBy]);

  const hasActiveFilters = statusFilter !== 'ALL';

  // 1. Prevent closing tab
  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // 2. Prevent React Router navigation
  useEffect(() => {
    if (!hasChanges) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href) {
        if (!window.confirm(t('kanban.unsavedChanges', { defaultValue: 'У вас есть несохраненные изменения! Вы уверены, что хотите уйти?' }))) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [hasChanges]);

  const handleUpdateTask = (updatedTask: TaskDto) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm(t('kanban.deleteConfirm', { defaultValue: 'Удалить эту задачу навсегда?' }))) return;
    
    if (taskId > 1000000000000) {
      // Это локальная несохраненная задача, просто удаляем из стейта
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setCreatedTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      return;
    }
    
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      alert(t('kanban.deleteError', { defaultValue: 'Ошибка при удалении задачи' }));
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      await onBatchSave(tasks);
      setCreatedTaskIds(new Set());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTasks(initialTasks);
    setCreatedTaskIds(new Set());
  };

  const handleTaskClick = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setSelectedTaskForModal(task);
    }
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    
    setSortBy('newest');
  };

  return (
    <div className="pb-20">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <Filter size={16} className="text-gray-400" />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:border-gray-900 focus:outline-none cursor-pointer"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        

        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:border-gray-900 focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors ml-auto"
          >
            <X size={14} />
            <span>{t('kanban.reset', { defaultValue: 'Сбросить' })}</span>
          </button>
        )}

        <span className="text-xs text-gray-400 ml-auto">
          {filteredAndSorted.length} {t('kanban.of', { defaultValue: 'из' })} {tasks.length} {t('kanban.tasks', { defaultValue: 'задач' })}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSorted.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => handleTaskClick(task.id)}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            userRole={userRole}
            employees={employees}
          />
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">{t('kanban.noFilteredTasks', { defaultValue: 'Нет задач по выбранным фильтрам' })}</p>
          <button onClick={clearFilters} className="text-sm text-gray-900 hover:underline mt-2">
            {t('kanban.resetFilters', { defaultValue: 'Сбросить фильтры' })}
          </button>
        </div>
      )}

      <TaskSaveButton 
        changesCount={changedTasks.length}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {selectedTaskForModal && (
        <TaskDetailsModal
          task={selectedTaskForModal}
          onClose={() => setSelectedTaskForModal(null)}
          onUpdateTask={(updated) => {
            handleUpdateTask(updated);
            setSelectedTaskForModal(updated);
          }}
          userRole={userRole}
        />
      )}
    </div>
  );
}
)