import { useState } from 'react';
import { CourseDto, ChapterDto, LessonDto, createChapter, createLessonForChapter } from '@/entities/course/api/courseApi';
import { ChevronDown, ChevronRight, Plus, Video, FileText, File, GripVertical } from 'lucide-react';

interface CourseCurriculumTabProps {
  course: CourseDto;
  onEditLesson: (lesson: LessonDto) => void;
  onReload: () => void;
}

export function CourseCurriculumTab({ course, onEditLesson, onReload }: CourseCurriculumTabProps) {
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingLessonToChapter, setAddingLessonToChapter] = useState<number | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    try {
      await createChapter(course.id, newChapterTitle);
      setNewChapterTitle('');
      setIsAddingChapter(false);
      onReload();
    } catch (e) {
      console.error(e);
      alert('Ошибка при создании главы');
    }
  };

  const handleAddLesson = async (chapterId: number) => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLessonForChapter(chapterId, newLessonTitle, '', 'VIDEO');
      setNewLessonTitle('');
      setAddingLessonToChapter(null);
      onReload();
    } catch (e) {
      console.error(e);
      alert('Ошибка при создании урока');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="w-4 h-4 text-indigo-500" />;
      case 'PRESENTATION': return <File className="w-4 h-4 text-orange-500" />;
      default: return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {course.chapters && course.chapters.map((chapter, idx) => {
        const isExpanded = expandedChapters[chapter.id] !== false; // Default to expanded
        
        return (
          <div key={chapter.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-sm">
            {/* Chapter Header */}
            <div 
              className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer border-b border-gray-100"
              onClick={() => toggleChapter(chapter.id)}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                <h3 className="font-semibold text-gray-900">Глава {idx + 1}: {chapter.title}</h3>
              </div>
              <span className="text-sm text-gray-500">{chapter.lessons?.length || 0} уроков</span>
            </div>

            {/* Lessons List */}
            {isExpanded && (
              <div className="bg-white divide-y divide-gray-100">
                {chapter.lessons && chapter.lessons.map((lesson, lIdx) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer group"
                    onClick={() => onEditLesson(lesson)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                      </div>
                      {getIcon(lesson.type)}
                      <span className="text-sm font-medium text-gray-700 group-hover:text-brand-green transition-colors">
                        Урок {lIdx + 1}: {lesson.title}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add Lesson inline form */}
                <div className="px-12 py-3 bg-gray-50/50">
                  {addingLessonToChapter === chapter.id ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        value={newLessonTitle}
                        onChange={e => setNewLessonTitle(e.target.value)}
                        placeholder="Название нового урока..."
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-brand-green focus:border-brand-green outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleAddLesson(chapter.id)}
                      />
                      <button 
                        onClick={() => handleAddLesson(chapter.id)}
                        className="text-xs bg-brand-green text-white px-3 py-1.5 rounded font-medium hover:bg-brand-green/90"
                      >
                        Сохранить
                      </button>
                      <button 
                        onClick={() => setAddingLessonToChapter(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setAddingLessonToChapter(chapter.id)}
                      className="text-sm text-brand-green font-medium flex items-center gap-1 hover:text-brand-green/80"
                    >
                      <Plus className="w-4 h-4" /> Добавить урок
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Chapter Button/Form */}
      <div className="pt-4 border-t border-gray-200 border-dashed">
        {isAddingChapter ? (
          <div className="bg-white p-4 rounded-xl border border-brand-green/30 shadow-sm flex items-center gap-3">
            <input 
              type="text" 
              autoFocus
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              placeholder="Название новой главы (например, Введение)..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
            />
            <button 
              onClick={handleAddChapter}
              className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90"
            >
              Добавить
            </button>
            <button 
              onClick={() => setIsAddingChapter(false)}
              className="text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingChapter(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-brand-green hover:text-brand-green transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Добавить главу
          </button>
        )}
      </div>
    </div>
  );
}
