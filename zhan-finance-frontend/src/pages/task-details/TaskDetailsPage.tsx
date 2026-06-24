import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask } from '@/entities/task/api/taskApi';
import { getTaskDocuments, uploadDocument, downloadDocument, deleteDocument, updateDocumentStatus } from '@/entities/document/api/documentApi';
import type { TaskDto, SubtaskDto } from '@/entities/task/model/types';
import type { DocumentDto } from '@/entities/document/model/types';
import { Spinner } from '@/shared/ui/Spinner';
import { StatusBadge, PriorityBadge } from '@/shared/ui/Badge';
import { ArrowLeft, CheckSquare, Square, BarChart3, Clock, FileText, FileSpreadsheet, File as FileIcon, Upload, Download, Trash2, MoreVertical } from 'lucide-react';
import { twMerge } from 'tailwind-merge';


export function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<SubtaskDto[]>([]);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    Promise.all([
      getTask(Number(id)),
      getTaskDocuments(Number(id)).catch(() => []) // if it fails, just empty array
    ])
    .then(([taskData, docsData]) => {
      setTask(taskData);
      setSubtasks(taskData.subtasks ?? []);
      setDocuments(docsData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [id]);

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
    if (!window.confirm('Delete this attached document?')) return;
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

  if (loading) return <Spinner />;
  if (!task) return <div className="text-gray-500">Task not found</div>;

  const handleToggleSubtask = (subtask: SubtaskDto) => {
    let newStatus: SubtaskDto['status'] = 'NEW';
    if (subtask.status === 'NEW') newStatus = 'IN_PROGRESS';
    else if (subtask.status === 'IN_PROGRESS') newStatus = 'DONE';
    else if (subtask.status === 'DONE') newStatus = 'NEW'; // ← cycle back
    
    setSubtasks(prev => prev.map(st => 
      st.id === subtask.id ? { ...st, status: newStatus } : st
    ));
  };

  const completedCount = subtasks.filter(s => s.status === 'DONE').length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-brand-green mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Back to Board</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {task.title}
              </h1>
              <StatusBadge status={task.status} />
            </div>
            
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              {task.description || 'No description provided for this task.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2">
                <span className="font-medium">Priority:</span>
                <PriorityBadge priority={task.priority} />
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              {task.client && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                  <span className="font-medium text-gray-700">Client:</span>
                  <span>{task.client.fullName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Checklist</h2>
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

            <div className="flex flex-col gap-3">
              {subtasks.map(st => (
                <div 
                  key={st.id}
                  onClick={() => handleToggleSubtask(st)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className={twMerge(
                    "transition-colors mt-0.5 shrink-0",
                    st.status === 'DONE' && "text-brand-green",
                    st.status === 'IN_PROGRESS' && "text-orange-500",
                    st.status === 'NEW' && "text-gray-300 group-hover:text-gray-400"
                  )}>
                    {st.status === 'DONE' && <CheckSquare size={22} />}
                    {st.status === 'IN_PROGRESS' && <Clock size={22} />}
                    {st.status === 'NEW' && <Square size={22} />}
                  </div>
                  <span className={twMerge(
                    "text-gray-700 text-lg transition-all flex-1",
                    st.status === 'DONE' && "line-through text-gray-400",
                    st.status === 'IN_PROGRESS' && "font-medium text-gray-800"
                  )}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attached Documents */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Attached Documents</h2>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Spinner size="sm" /> : <Upload size={16} />}
                  <span>Attach File</span>
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                No documents attached to this task yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-brand-green/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:text-brand-green group-hover:bg-brand-green/10 transition-colors">
                        <FileIcon size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 line-clamp-1">{doc.fileName}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={twMerge(
                            "px-1.5 py-0.5 rounded font-semibold",
                            doc.status === 'DONE' ? 'bg-green-100 text-green-700' :
                            doc.status === 'PROCESSING' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownloadDoc(doc)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-green" />
              Task Statistics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-sm">Time Tracked</span>
                <span className="font-semibold text-gray-900">12h 30m</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-sm">Estimated</span>
                <span className="font-semibold text-gray-900">16h 00m</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-green/5 border border-brand-green/10 rounded-xl">
                <span className="text-brand-green font-medium text-sm">Efficiency</span>
                <span className="font-bold text-brand-green">Good</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1">
            <h3 className="font-bold text-gray-900 mb-4">Activity Log</h3>
            <div className="text-sm text-gray-500 flex flex-col gap-4">
              <p>• Task created by Admin</p>
              <p>• Assigned to Employee A</p>
              <p>• Status changed to In Progress</p>
              <div className="mt-4 p-4 border border-dashed border-gray-200 rounded-xl text-center">
                More activity info will be loaded here from backend.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
