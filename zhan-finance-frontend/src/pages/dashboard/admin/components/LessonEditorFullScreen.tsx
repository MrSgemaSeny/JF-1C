import { useState, useEffect } from 'react';
import { LessonDto, LessonBlockDto, addTextBlock, addMediaBlock } from '@/entities/course/api/courseApi';
import { API_BASE_URL } from '@/shared/api/http';
import { ArrowLeft, Plus, Video, FileText, File, Save, Trash2, GripVertical } from 'lucide-react';

interface LessonEditorFullScreenProps {
  lesson: LessonDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonEditorFullScreen({ lesson, onClose, onSaved }: LessonEditorFullScreenProps) {
  const [draftBlocks, setDraftBlocks] = useState<Partial<LessonBlockDto>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setDraftBlocks(lesson.blocks || []);
    }
  }, [lesson]);

  if (!lesson) return null;

  const handleAddTextDraft = () => {
    setDraftBlocks(prev => [...prev, { type: 'TEXT', content: '' }]);
  };

  const handleTextContentChange = (index: number, content: string) => {
    const newDraft = [...draftBlocks];
    newDraft[index].content = content;
    setDraftBlocks(newDraft);
  };

  const handleAddMediaDraft = (type: 'VIDEO' | 'FILE') => {
    setDraftBlocks(prev => [...prev, { type, _tempFile: null } as any]);
  };

  const handleFileChange = (index: number, file: File) => {
    const newDraft = [...draftBlocks] as any[];
    newDraft[index]._tempFile = file;
    setDraftBlocks(newDraft);
  };

  const handleRemoveDraft = (index: number) => {
    setDraftBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newBlocks = draftBlocks.filter(b => !b.id);
      
      for (const block of newBlocks) {
        if (block.type === 'TEXT' && block.content) {
          await addTextBlock(lesson.id, block.content);
        } else if ((block.type === 'VIDEO' || block.type === 'FILE') && (block as any)._tempFile) {
          await addMediaBlock(lesson.id, block.type as 'VIDEO' | 'FILE', (block as any)._tempFile);
        }
      }
      onSaved();
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении урока');
    } finally {
      setIsSaving(false);
    }
  };

  const parseMediaUrl = (content?: string): { url: string; name: string } | null => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      if (parsed.url) {
        const fullUrl = parsed.url.startsWith('http') ? parsed.url : `${API_BASE_URL}${parsed.url.startsWith('/') ? '' : '/'}${parsed.url}`;
        return { ...parsed, url: fullUrl };
      }
      return null;
    } catch {
      return null;
    }
  };

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
          
          {draftBlocks.length === 0 ? (
            <div className="text-center py-20 px-4 border-2 border-dashed border-gray-300 rounded-2xl bg-white/50">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Урок пока пуст</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Создайте структуру урока. Вы можете чередовать обучающие видео с текстовыми объяснениями и файлами для скачивания.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {draftBlocks.map((block, idx) => {
                const mediaData = block.id ? parseMediaUrl(block.content) : null;
                
                return (
                  <div key={block.id || `draft-${idx}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
                    
                    {/* Block Header */}
                    <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                          <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                        </div>
                        {block.type === 'VIDEO' ? <Video className="w-5 h-5 text-indigo-500" /> : 
                         block.type === 'FILE' ? <File className="w-5 h-5 text-orange-500" /> : 
                         <FileText className="w-5 h-5 text-blue-500" />}
                        <span className="font-semibold text-gray-700">
                          {block.type === 'VIDEO' ? 'Видео-модуль' : block.type === 'FILE' ? 'Материалы (Файл)' : 'Текстовый модуль'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!block.id && (
                          <button 
                            onClick={() => handleRemoveDraft(idx)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить черновик"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <GripVertical className="w-5 h-5 text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500 transition-colors" />
                      </div>
                    </div>

                    {/* Block Content Body */}
                    <div className="p-6">
                      {block.type === 'TEXT' ? (
                        <textarea 
                          className="w-full min-h-[350px] p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green focus:bg-white outline-none text-gray-800 transition-all resize-y"
                          value={block.content || ''}
                          onChange={e => handleTextContentChange(idx, e.target.value)}
                          placeholder="Начните писать содержание урока (поддерживается Markdown)..."
                          disabled={!!block.id}
                        />
                      ) : (
                        <div className="flex flex-col gap-4">
                          {block.id ? (
                            // ALREADY SAVED MEDIA PREVIEW
                            <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-200 shadow-inner">
                              {block.type === 'VIDEO' && mediaData ? (
                                <video 
                                  src={mediaData.url} 
                                  controls 
                                  className="w-full max-h-[80vh] object-contain bg-black"
                                >
                                  Ваш браузер не поддерживает видео.
                                </video>
                              ) : (
                                <div className="p-6 bg-white flex items-center justify-center gap-3">
                                  <File className="w-8 h-8 text-orange-500" />
                                  <div>
                                    <p className="font-medium text-gray-900">{mediaData?.name || 'Файл'}</p>
                                    <a href={mediaData?.url} target="_blank" rel="noreferrer" className="text-sm text-brand-green hover:underline">Скачать файл</a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            // DRAFT MEDIA UPLOAD
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
                              <input 
                                type="file" 
                                id={`file-upload-${idx}`}
                                accept={block.type === 'VIDEO' ? 'video/mp4,video/webm' : '*/*'}
                                onChange={e => e.target.files && handleFileChange(idx, e.target.files[0])}
                                className="hidden"
                              />
                              <label 
                                htmlFor={`file-upload-${idx}`}
                                className="cursor-pointer flex flex-col items-center justify-center"
                              >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${block.type === 'VIDEO' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'}`}>
                                  <Plus className="w-8 h-8" />
                                </div>
                                {(block as any)._tempFile ? (
                                  <div className="text-brand-green font-medium">
                                    Файл выбран: {(block as any)._tempFile.name}
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-medium text-brand-green hover:underline">Нажмите, чтобы выбрать файл</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {block.type === 'VIDEO' ? 'MP4, WebM (до 500MB)' : 'Любой формат файла'}
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Action Bar (Add Blocks) */}
          <div className="sticky bottom-8 mt-12 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-full p-2 max-w-fit mx-auto flex items-center gap-2">
            <span className="px-4 text-sm font-medium text-gray-400 border-r border-gray-200">Добавить блок</span>
            <button 
              onClick={handleAddTextDraft}
              className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-full transition-colors group"
            >
              <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">Текст</span>
            </button>
            <button 
              onClick={() => handleAddMediaDraft('VIDEO')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-full transition-colors group"
            >
              <Video className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600 transition-colors">Видео</span>
            </button>
            <button 
              onClick={() => handleAddMediaDraft('FILE')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50 rounded-full transition-colors group"
            >
              <File className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">Файл</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
