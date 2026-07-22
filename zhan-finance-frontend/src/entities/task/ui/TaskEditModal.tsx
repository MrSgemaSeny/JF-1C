import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TaskDto } from '../model/types';
import { updateTaskDetails } from '../api/taskApi';
import { DatePicker } from '@/shared/ui/DatePicker';
import { Spinner } from '@/shared/ui/Spinner';
import { useEscapeKey } from '@/shared/lib/hooks/useEscapeKey';

interface TaskEditModalProps {
  task: TaskDto;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedTask: TaskDto) => void;
}

export function TaskEditModal({ task, isOpen, onClose, onSaved }: TaskEditModalProps) {
  const { t } = useTranslation(['tasks']);
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState<string>(() => {
    return task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setError(null);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await updateTaskDetails(task.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || ''
      });
      onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
              <Edit3 size={18} />
            </div>
            <h3 className="font-bold text-lg text-gray-900">
              {t('tasks:editModal.title', { defaultValue: 'Редактирование задачи' })}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t('tasks:editModal.taskTitle', { defaultValue: 'Название задачи' })} *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('tasks:editModal.taskTitlePlaceholder', { defaultValue: 'Введите название задачи' })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all outline-none"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t('tasks:editModal.description', { defaultValue: 'Описание задачи' })}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder={t('tasks:editModal.descriptionPlaceholder', { defaultValue: 'Опишите детали задачи...' })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all outline-none resize-none"
            />
          </div>

          {/* Deadline Field using custom DatePicker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {t('tasks:editModal.deadline', { defaultValue: 'Желаемый срок (Дедлайн)' })}
            </label>
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors"
            >
              {t('tasks:editModal.cancel', { defaultValue: 'Отмена' })}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md shadow-brand-green/20"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 text-white" />
                  {t('tasks:editModal.saving', { defaultValue: 'Сохранение...' })}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('tasks:editModal.save', { defaultValue: 'Сохранить изменения' })}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
