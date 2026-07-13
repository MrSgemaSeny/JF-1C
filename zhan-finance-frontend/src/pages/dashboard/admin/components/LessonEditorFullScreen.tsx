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
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setContent(lesson.content || '');
      setTempFile(null);
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
        tempFile || undefined
      );
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении урока');
    } finally {
      setIsSaving(false);
    }
  };

  const videoUrl = tempFile 
    ? URL.createObjectURL(tempFile) 
    : lesson.mediaUrl 
      ? (lesson.mediaUrl.startsWith('http') ? lesson.mediaUrl : `${API_BASE_URL}${lesson.mediaUrl.startsWith('/') ? '' : '/'}${lesson.mediaUrl}`) 
      : null;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col h-screen overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4 w-1/3">
          <button 
            onClick={onClose}
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Назад к курсу
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center w-1/3">
          <h2 className="text-lg font-bold text-gray-900 truncate max-w-sm">{lesson.title}</h2>
          <span className="text-xs font-medium text-brand-green/80 uppercase tracking-wider">Редактор урока</span>
        </div>

        <div className="flex items-center justify-end w-1/3 gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-green text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-green/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
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
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3">
              <Video className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-gray-700">Видео урока</span>
            </div>
            
            <div className="p-6">
              {videoUrl ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden bg-black border border-gray-200 shadow-inner flex justify-center">
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
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors cursor-pointer">
                      <UploadCloud className="w-4 h-4" />
                      Заменить видео
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setTempFile(e.target.files[0]);
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
                  <span className="text-sm text-gray-500">Нажмите, чтобы выбрать файл</span>
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setTempFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Text Content Section */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3 shrink-0">
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

        </div>
      </div>
    </div>
  );
}
