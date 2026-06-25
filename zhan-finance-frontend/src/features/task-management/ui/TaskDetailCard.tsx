import { useEffect, useState, useRef } from 'react';
import { getTask, updateTaskStatus } from '@/entities/task/api/taskApi';
import { getTaskDocuments, uploadDocument, downloadDocument, deleteDocument } from '@/entities/document/api/documentApi';
import type { TaskDto, SubtaskDto, TaskStatus } from '@/entities/task/model/types';
import type { DocumentDto } from '@/entities/document/model/types';
import { Spinner } from '@/shared/ui/Spinner';
import { StatusBadge, PriorityBadge } from '@/shared/ui/Badge';
import { CheckSquare, Square, Clock, FileText, Upload, Download, Trash2 } from 'lucide-react';

interface TaskDetailCardProps {
  taskId: number;
  isModal?: boolean;
  onStatusChange?: () => void;
  onClose?: () => void;
}

export function TaskDetailCard({ taskId, isModal = false, onStatusChange, onClose }: TaskDetailCardProps) {
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<SubtaskDto[]>([]);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    
    Promise.all([
      getTask(taskId),
      getTaskDocuments(taskId).catch(() => []) // if it fails, just empty array
    ])
    .then(([taskData, docsData]) => {
      setTask(taskData);
      setSubtasks(taskData.subtasks ?? []);
      setDocuments(docsData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [taskId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    
    setIsUploading(true);
    try {
      await uploadDocument(file, task.client?.id, task.id);
      const updatedDocs = await getTaskDocuments(task.id);
      setDocuments(updatedDocs);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to upload', err);
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadDoc = async (doc: DocumentDto) => {
    try {
      await downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!window.confirm('Удалить документ?')) return;
    try {
      await deleteDocument(id);
      if (task) {
        const updatedDocs = await getTaskDocuments(task.id);
        setDocuments(updatedDocs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    setIsUpdatingStatus(true);
    try {
      await updateTaskStatus(task.id, status);
      setTask({ ...task, status });
      onStatusChange?.();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) return <Spinner />;
  if (!task) return <div className="text-gray-500">Task not found</div>;

  const completedCount = subtasks.filter(s => s.status === 'DONE').length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;
  const statuses: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'ON_REVIEW', 'DONE', 'CANCELLED'];

  return (
    <div className={`flex flex-col gap-6 ${isModal ? '' : 'lg:col-span-2'}`}>
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${isModal ? 'p-6' : 'p-8'}`}>
        <div className="flex items-start justify-between mb-4">
          <h1 className={`${isModal ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 leading-tight pr-4`}>
            {task.title}
          </h1>
          {isModal && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          )}
        </div>
        
        <p className={`${isModal ? 'text-base' : 'text-lg'} text-gray-600 mb-6 leading-relaxed`}>
          {task.description || 'Нет описания.'}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Статус:</span>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Приоритет:</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Создана {new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
          {task.client && (
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
              <span className="font-medium text-gray-700">Клиент:</span>
              <span>{task.client.fullName}</span>
            </div>
          )}
        </div>

        {/* Status Selection */}
        <div className="mt-6 border-t pt-4">
           <label className="text-sm font-medium text-gray-700 block mb-3">Изменить статус</label>
           <div className="flex flex-wrap gap-2">
             {statuses.map(status => (
               <button
                 key={status}
                 onClick={() => handleStatusChange(status)}
                 disabled={isUpdatingStatus || status === task.status}
                 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                   status === task.status
                     ? 'bg-brand-green text-white cursor-default ring-2 ring-brand-green ring-offset-2'
                     : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-green hover:text-brand-green disabled:opacity-50'
                 }`}
               >
                 {status}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${isModal ? 'p-6' : 'p-8'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Чеклист</h2>
          <span className="text-sm font-medium text-brand-green bg-brand-green/10 px-3 py-1 rounded-full">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <div 
            className="bg-brand-green h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="space-y-3">
          {subtasks.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Нет подзадач.</p>
          ) : (
            subtasks.map(st => (
              <div 
                key={st.id} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
              >
                <div className="text-gray-400 mt-0.5">
                  {st.status === 'DONE' ? (
                    <CheckSquare className="w-5 h-5 text-brand-green" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm ${st.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                  {st.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${isModal ? 'p-6' : 'p-8'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Документы</h2>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className={`flex items-center gap-2 bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Загрузка...' : 'Загрузить файл'}
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Нет прикрепленных документов</p>
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-brand-green/30 transition-colors group bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-brand-green">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm line-clamp-1">{doc.fileName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDownloadDoc(doc)}
                    className="p-2 hover:bg-white rounded-lg text-gray-600 hover:text-brand-green border border-transparent hover:border-gray-200 transition-all shadow-sm"
                    title="Скачать"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-2 hover:bg-white rounded-lg text-gray-600 hover:text-red-500 border border-transparent hover:border-gray-200 transition-all shadow-sm"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
