import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Activity, Clock, Tag, User as UserIcon } from 'lucide-react';
import type { TaskDto, TaskCommentDto, TaskActivityDto, SubtaskStatus } from '../model/types';
import { getTaskComments, addTaskComment, getTaskHistory } from '../api/taskApi';
import { StatusBadge, PriorityBadge } from '@/shared/ui/Badge';
import { twMerge } from 'tailwind-merge';
import { Edit2, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

interface TaskDetailsModalProps {
  task: TaskDto;
  onClose: () => void;
  onUpdateTask: (updatedTask: TaskDto) => void;
  userRole: 'ADMIN' | 'EMPLOYEE' | 'CLIENT';
}

export function TaskDetailsModal({ task, onClose, onUpdateTask, userRole }: TaskDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [comments, setComments] = useState<TaskCommentDto[]>([]);
  const [history, setHistory] = useState<TaskActivityDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description || '');

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    fetchComments();
    fetchHistory();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const data = await getTaskComments(task.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await getTaskHistory(task.id);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsLoading(true);
    try {
      const comment = await addTaskComment(task.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      
      // Update task comment count in the parent (for badge) if we add it there
      const updatedTask = { ...task, comments: [...(task.comments || []), comment] };
      onUpdateTask(updatedTask);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim();
      if (val && !task.tags?.includes(val)) {
        const newTags = [...(task.tags || []), val];
        onUpdateTask({ ...task, tags: newTags });
      }
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = task.tags?.filter(t => t !== tagToRemove) || [];
    onUpdateTask({ ...task, tags: newTags });
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdateTask({ ...task, title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (editedDescription.trim() !== (task.description || '').trim()) {
      onUpdateTask({ ...task, description: editedDescription.trim() });
    }
    setIsEditingDescription(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtasks = [
      ...(task.subtasks || []), 
      { id: -Date.now(), taskId: task.id, title: newSubtaskTitle.trim(), status: 'NEW' as SubtaskStatus, createdAt: new Date().toISOString() }
    ];
    onUpdateTask({ ...task, subtasks: newSubtasks });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (stId: number) => {
    const newSubtasks = task.subtasks?.map(st => 
      st.id === stId ? { ...st, status: (st.status === 'DONE' ? 'NEW' : 'DONE') as SubtaskStatus } : st
    ) || [];
    onUpdateTask({ ...task, subtasks: newSubtasks });
  };

  const handleDeleteSubtask = (stId: number) => {
    const newSubtasks = task.subtasks?.filter(st => st.id !== stId) || [];
    onUpdateTask({ ...task, subtasks: newSubtasks });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3 mb-2">
              {isEditingTitle && (userRole === 'ADMIN' || userRole === 'EMPLOYEE') ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="text-2xl font-bold text-gray-800 border-b-2 border-brand-green outline-none bg-gray-50 flex-1 min-w-[300px]"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-2xl font-bold text-gray-800 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 transition-colors flex-1"
                  onClick={() => (userRole === 'ADMIN' || userRole === 'EMPLOYEE') && setIsEditingTitle(true)}
                  title={(userRole === 'ADMIN' || userRole === 'EMPLOYEE') ? "Нажмите чтобы изменить" : ""}
                >
                  {task.title}
                </h2>
              )}
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {task.client && (
                <span className="flex items-center gap-1">
                  <UserIcon size={14} />
                  Клиент: {task.client.fullName}
                </span>
              )}
              {task.assignedTo && (
                <span className="flex items-center gap-1">
                  <UserIcon size={14} className="text-brand-green" />
                  Исполнитель: {task.assignedTo.fullName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={14} />
                Создано: {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Details */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-100">
            {/* Description */}
            <div className="mb-8 group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Описание</h3>
                {!isEditingDescription && (userRole === 'ADMIN' || userRole === 'EMPLOYEE') && (
                  <button 
                    onClick={() => setIsEditingDescription(true)}
                    className="text-gray-400 hover:text-brand-green opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs"
                  >
                    <Edit2 size={12} /> Изменить
                  </button>
                )}
              </div>
              
              {isEditingDescription ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full min-h-[120px] bg-white border border-gray-200 rounded-lg p-3 outline-none focus:border-brand-green resize-y text-sm text-gray-700"
                    placeholder="Добавьте более подробное описание..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleSaveDescription}
                      className="bg-brand-green text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-green/90"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => {
                        setEditedDescription(task.description || '');
                        setIsEditingDescription(false);
                      }}
                      className="text-gray-500 hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => (userRole === 'ADMIN' || userRole === 'EMPLOYEE') && setIsEditingDescription(true)}
                  className="text-gray-600 bg-gray-50 p-4 rounded-xl min-h-[100px] whitespace-pre-wrap cursor-pointer hover:bg-gray-100 transition-colors"
                  title={(userRole === 'ADMIN' || userRole === 'EMPLOYEE') ? "Нажмите чтобы изменить" : ""}
                >
                  {task.description || <span className="text-gray-400 italic">Описание отсутствует...</span>}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag size={16} /> Метки
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {task.tags?.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center gap-1 bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                    {(userRole === 'ADMIN' || userRole === 'EMPLOYEE') && (
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 ml-1"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
                {(!task.tags || task.tags.length === 0) && (
                  <span className="text-gray-400 text-sm">Нет меток</span>
                )}
              </div>
              {(userRole === 'ADMIN' || userRole === 'EMPLOYEE') && (
                <input 
                  type="text" 
                  placeholder="Добавить метку (Enter)" 
                  onKeyDown={handleAddTag}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-green w-full max-w-[200px]"
                />
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                Подзадачи ({task.subtasks?.filter(s => s.status === 'DONE').length || 0} / {task.subtasks?.length || 0})
              </h3>
              
              <div className="space-y-1 mb-3">
                {task.subtasks?.map(st => (
                  <div key={st.id} className="flex items-start gap-2 text-sm p-2 hover:bg-gray-50 rounded-lg group">
                    <button
                      onClick={() => (userRole === 'ADMIN' || userRole === 'EMPLOYEE') && handleToggleSubtask(st.id)}
                      className={twMerge(
                        "mt-0.5 text-gray-400 hover:text-brand-green transition-colors",
                        st.status === 'DONE' && "text-brand-green"
                      )}
                      disabled={userRole !== 'ADMIN' && userRole !== 'EMPLOYEE'}
                    >
                      {st.status === 'DONE' ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    
                    <span className={twMerge(
                      "flex-1 pt-0.5 transition-colors",
                      st.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-700'
                    )}>
                      {st.title}
                    </span>

                    {(userRole === 'ADMIN' || userRole === 'EMPLOYEE') && (
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {(!task.subtasks || task.subtasks.length === 0) && (
                  <p className="text-gray-400 text-sm italic px-2">Нет подзадач</p>
                )}
              </div>

              {(userRole === 'ADMIN' || userRole === 'EMPLOYEE') && (
                <div className="flex items-center gap-2 px-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Добавить подзадачу..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-green"
                  />
                  <button
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="p-1.5 text-brand-green bg-brand-green/10 rounded-lg hover:bg-brand-green/20 transition-colors disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Comments & History */}
          <div className="w-1/2 flex flex-col bg-gray-50/50">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 pt-4 gap-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={twMerge(
                  "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'comments' 
                    ? "border-brand-green text-brand-green" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <MessageSquare size={16} />
                Комментарии
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={twMerge(
                  "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'history' 
                    ? "border-brand-green text-brand-green" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Activity size={16} />
                История
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'comments' ? (
                <div className="flex flex-col gap-4">
                  {comments.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800 text-sm">{c.author.fullName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      Нет комментариев. Будьте первыми!
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {history.map(h => (
                    <div key={h.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Activity size={14} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 text-xs">{h.actor.fullName}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(h.createdAt).toLocaleDateString()} {new Date(h.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs">{h.actionText}</p>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm">
                      История пуста
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Input */}
            {activeTab === 'comments' && (
              <div className="p-4 bg-white border-t border-gray-100 flex items-end gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="flex-1 max-h-32 min-h-[40px] border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-brand-green resize-y text-sm"
                  rows={2}
                />
                <button
                  onClick={handleAddComment}
                  disabled={isLoading || !newComment.trim()}
                  className="bg-brand-green text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Отправить
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
