import { useState, useEffect } from 'react';
import { LessonDto, LessonBlockDto, addTextBlock, addMediaBlock } from '@/entities/course/api/courseApi';
import { X, Plus, Video, FileText, File, Save } from 'lucide-react';

interface LessonEditorDrawerProps {
  lesson: LessonDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LessonEditorDrawer({ lesson, onClose, onSaved }: LessonEditorDrawerProps) {
  const [draftBlocks, setDraftBlocks] = useState<Partial<LessonBlockDto>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // When lesson changes, initialize draft blocks with existing ones
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
    // For media, we will just store a placeholder and require the user to pick a file before saving
    setDraftBlocks(prev => [...prev, { type, _tempFile: null } as any]);
  };

  const handleFileChange = (index: number, file: File) => {
    const newDraft = [...draftBlocks] as any[];
    newDraft[index]._tempFile = file;
    setDraftBlocks(newDraft);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find new blocks (ones without id)
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-gray-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
            <p className="text-sm text-gray-500">Редактирование содержимого урока</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {draftBlocks.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Урок пока пуст</h3>
              <p className="text-sm text-gray-500">Добавьте первый блок контента, чтобы начать.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {draftBlocks.map((block, idx) => (
                <div key={block.id || `draft-${idx}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    {block.type === 'VIDEO' ? <Video className="w-4 h-4 text-indigo-500" /> : 
                     block.type === 'FILE' ? <File className="w-4 h-4 text-orange-500" /> : 
                     <FileText className="w-4 h-4 text-blue-500" />}
                    <span className="text-sm font-medium text-gray-700">
                      {block.type === 'VIDEO' ? 'Видео' : block.type === 'FILE' ? 'Файл' : 'Текст'}
                    </span>
                  </div>
                  <div className="p-4">
                    {block.type === 'TEXT' ? (
                      <textarea 
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-brand-green focus:border-brand-green outline-none text-sm font-mono"
                        value={block.content || ''}
                        onChange={e => handleTextContentChange(idx, e.target.value)}
                        placeholder="Введите текст (поддерживается Markdown)..."
                        disabled={!!block.id}
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        {block.id ? (
                          <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-100 flex items-center gap-2">
                            <Save className="w-4 h-4" /> Файл уже загружен и сохранен.
                          </div>
                        ) : (
                          <input 
                            type="file" 
                            accept={block.type === 'VIDEO' ? 'video/mp4,video/webm' : '*/*'}
                            onChange={e => e.target.files && handleFileChange(idx, e.target.files[0])}
                            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Blocks Toolbar */}
          <div className="flex gap-3 justify-center pt-4">
            <button 
              onClick={handleAddTextDraft}
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-green hover:shadow-md transition-all group min-w-[100px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-brand-green">Текст</span>
            </button>
            <button 
              onClick={() => handleAddMediaDraft('VIDEO')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-green hover:shadow-md transition-all group min-w-[100px]"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition-colors">
                <Video className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-brand-green">Видео</span>
            </button>
            <button 
              onClick={() => handleAddMediaDraft('FILE')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-green hover:shadow-md transition-all group min-w-[100px]"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-2 group-hover:bg-orange-100 transition-colors">
                <File className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-brand-green">Файл</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-green text-white font-medium hover:bg-brand-green/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-pulse">Сохранение...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить урок
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
