import { useState, useEffect } from 'react';
import { LessonDto, updateLesson } from '@/entities/course/api/courseApi';
import { API_BASE_URL } from '@/shared/api/http';
import { ArrowLeft, Video, FileText, Save, UploadCloud } from 'lucide-react';

interface LessonEditorFullScreenProps {
  lesson: LessonDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonEditorFullScreen({ lesson, onClose, onSaved }: LessonEditorFullScreenProps) {
  const [content, setContent] = useState('');
  const [tempVideoFile, setTempVideoFile] = useState<File | null>(null);
  const [tempDocumentFile, setTempDocumentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setContent(lesson.content || '');
      setTempVideoFile(null);
      setTempDocumentFile(null);
    }
  }, [lesson]);

  if (!lesson) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLesson(
        lesson.id,
        lesson.title,
        lesson.description,
        content,
        lesson.orderIndex,
        tempVideoFile || null,
        tempDocumentFile || null
      );
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении урока');
    } finally {
      setIsSaving(false);
    }
  };

  const videoUrl = tempVideoFile 
    ? URL.createObjectURL(tempVideoFile) 
    : lesson.mediaUrl 
      ? (lesson.mediaUrl.startsWith('http') ? lesson.mediaUrl : `${API_BASE_URL}${lesson.mediaUrl.startsWith('/') ? '' : '/'}${lesson.mediaUrl}`) 
      : null;

  const documentUrl = tempDocumentFile 
    ? URL.createObjectURL(tempDocumentFile) 
    : lesson.fileUrl 
      ? (lesson.fileUrl.startsWith('http') ? lesson.fileUrl : `${API_BASE_URL}${lesson.fileUrl.startsWith('/') ? '' : '/'}${lesson.fileUrl}`) 
      : null;

  const isDocumentPdf = documentUrl ? documentUrl.match(/\.pdf$/i) || (tempDocumentFile && tempDocumentFile.type === 'application/pdf') : false;

  return (
    <div className="fixed inset-0 z-[100] bg-brand-green/5 flex flex-col h-screen overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header */}
      <div className="h-16 bg-white border-b border-brand-green/10 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4 w-1/3">
          <button 
            onClick={onClose}
            className="flex items-center text-brand-green/70 hover:text-brand-green transition-colors font-medium text-sm bg-brand-green/10 hover:bg-brand-green/20 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Назад к курсу
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center w-1/3">
          <h2 className="text-lg font-bold text-brand-green truncate max-w-sm">{lesson.title}</h2>
          <span className="text-xs font-medium text-brand-green/80 uppercase tracking-wider">Редактор урока</span>
        </div>

        <div className="flex items-center justify-end w-1/3 gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-green text-brand-beige px-6 py-2 rounded-lg font-medium hover:bg-brand-green/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-pulse">Сохранение...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Сохранить изменения
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto space-y-8 pb-32">
          
          {/* Video Section */}
          <div className="bg-white border border-brand-green/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-brand-green/5/80 border-b border-gray-100 flex items-center gap-3">
              <Video className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-gray-700">Видео урока</span>
            </div>
            
            <div className="p-6">
              {videoUrl ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden bg-brand-accent border border-brand-green/10 shadow-inner flex justify-center">
                    <video 
                      src={videoUrl} 
                      controls 
                      controlsList="nodownload"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full max-h-[60vh] object-contain"
                    >
                      Ваш браузер не поддерживает видео.
                    </video>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-green/5 cursor-pointer transition-colors cursor-pointer">
                      <UploadCloud className="w-4 h-4" />
                      Заменить видео
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setTempVideoFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-green/50 hover:bg-brand-green/5 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-brand-green" />
                  </div>
                  <span className="font-medium text-gray-700 mb-1">Загрузить видео для урока</span>
                  <span className="text-sm text-brand-green/70">Нажмите, чтобы выбрать файл</span>
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setTempVideoFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Text Content Section */}
          <div className="bg-white border border-brand-green/10 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-3 bg-brand-green/5/80 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-700">Текстовый конспект (Markdown)</span>
            </div>
            
            <div className="p-0 flex-1 flex flex-col relative group">
              <textarea 
                className="w-full h-full p-6 bg-transparent outline-none text-gray-800 resize-none font-medium leading-relaxed"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Начните писать содержание урока (поддерживается Markdown)..."
              />
            </div>
          </div>

          {/* Document Section */}
          <div className="bg-white border border-brand-green/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-brand-green/5/80 border-b border-gray-100 flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-700">Прикрепленные материалы (PDF, DOCX)</span>
            </div>
            
            <div className="p-6">
              {documentUrl ? (
                <div className="space-y-4">
                  {isDocumentPdf ? (
                    <div className="rounded-xl overflow-hidden border border-brand-green/10 shadow-inner h-[60vh]">
                      <object data={documentUrl} type="application/pdf" className="w-full h-full">
                        <div className="p-8 flex flex-col items-center justify-center h-full bg-brand-green/5 text-brand-green/70">
                          <FileText className="w-12 h-12 text-brand-green/50 mb-4" />
                          <p>Ваш браузер не поддерживает просмотр PDF.</p>
                          <a href={documentUrl} target="_blank" rel="noreferrer" className="text-brand-green mt-2 font-medium hover:underline">
                            Скачать PDF-файл
                          </a>
                        </div>
                      </object>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-brand-green/5 border border-brand-green/10 shadow-inner p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-800 font-semibold text-sm">Дополнительный материал</span>
                          <span className="text-brand-green/70 text-xs">Документ загружен</span>
                        </div>
                      </div>
                      <a href={documentUrl} target="_blank" rel="noreferrer" className="bg-white border border-brand-green/10 shadow-sm text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green/5 transition-all active:scale-95">
                        Открыть / Скачать
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-green/5 cursor-pointer transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      Заменить документ
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setTempDocumentFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-green/50 hover:bg-brand-green/5 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-brand-green" />
                  </div>
                  <span className="font-medium text-gray-700 mb-1">Загрузить дополнительные материалы</span>
                  <span className="text-sm text-brand-green/70">Нажмите, чтобы выбрать PDF или другой документ</span>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" 
                    className="hidden" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setTempDocumentFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
