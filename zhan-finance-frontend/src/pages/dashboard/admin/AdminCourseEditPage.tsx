import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CourseDto, 
  CourseSectionDto, 
  createCourse, 
  updateCourse, 
  getCourseById,
  createSection,
  deleteSection,
  createLesson,
  deleteLesson
} from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { ArrowLeft, Save, Plus, Trash2, Video, FileText, File } from 'lucide-react';

export function AdminCourseEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Modal states for Section
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Modal states for Lesson
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonType, setLessonType] = useState('VIDEO');
  const [lessonFile, setLessonFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      getCourseById(Number(id)).then(data => {
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublished(data.isPublished);
      }).catch(console.error);
    }
  }, [isEditMode, id]);

  const handleSaveCourse = async () => {
    try {
      if (isEditMode) {
        const updated = await updateCourse(Number(id), title, description, isPublished);
        setCourse(updated);
        alert('Курс обновлен');
      } else {
        const created = await createCourse(title, description, isPublished);
        navigate(ROUTES.ADMIN_COURSES_EDIT.replace(':id', String(created.id)));
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении курса');
    }
  };

  const handleCreateSection = async () => {
    if (!course) return;
    try {
      const newSec = await createSection(course.id, newSectionTitle);
      setCourse({ ...course, sections: [...course.sections, newSec] });
      setShowSectionModal(false);
      setNewSectionTitle('');
    } catch (e) {
      alert('Ошибка при создании раздела');
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!course || !window.confirm('Удалить раздел и все его уроки?')) return;
    try {
      await deleteSection(sectionId);
      setCourse({ ...course, sections: course.sections.filter(s => s.id !== sectionId) });
    } catch (e) {
      alert('Ошибка при удалении раздела');
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSectionId || !course) return;
    
    setIsUploading(true);
    try {
      await createLesson(activeSectionId, lessonTitle, lessonDescription, lessonType, lessonFile || undefined);
      // reload course
      const updated = await getCourseById(course.id);
      setCourse(updated);
      
      setShowLessonModal(false);
      setLessonTitle('');
      setLessonDescription('');
      setLessonType('VIDEO');
      setLessonFile(null);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки урока. Убедитесь, что размер файла не превышает лимит.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!course || !window.confirm('Удалить этот урок?')) return;
    try {
      await deleteLesson(lessonId);
      const updated = await getCourseById(course.id);
      setCourse(updated);
    } catch (e) {
      alert('Ошибка при удалении урока');
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(ROUTES.ADMIN_COURSES)}
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад к списку
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{isEditMode ? 'Редактирование курса' : 'Создание курса'}</h1>
          <button 
            onClick={handleSaveCourse}
            className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 flex items-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            Сохранить
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название курса</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
              placeholder="Например: Основы бухгалтерского учета"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
              placeholder="Краткое описание курса..."
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="isPublished"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-brand-green rounded focus:ring-brand-green border-gray-300 cursor-pointer"
            />
            <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700 cursor-pointer">
              Опубликовать курс (будет виден ученикам)
            </label>
          </div>
        </div>
      </div>

      {isEditMode && course && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Программа курса</h2>
            <button 
              onClick={() => setShowSectionModal(true)}
              className="text-brand-green hover:bg-brand-green/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Добавить раздел
            </button>
          </div>

          <div className="space-y-4">
            {course.sections.map(section => (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">{section.title}</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setActiveSectionId(section.id); setShowLessonModal(true); }}
                      className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Урок
                    </button>
                    <button 
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                      title="Удалить раздел"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.lessons.map(lesson => (
                    <div key={lesson.id} className="px-4 py-3 flex justify-between items-center bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {getIcon(lesson.type)}
                        <div>
                          <p className="font-medium text-sm text-gray-900">{lesson.title}</p>
                          <p className="text-xs text-gray-500">{lesson.fileName || 'Нет файла'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {section.lessons.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400">Нет уроков в этом разделе</div>
                  )}
                </div>
              </div>
            ))}
            {course.sections.length === 0 && (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                Нет разделов. Создайте первый раздел, чтобы добавить уроки.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold mb-4">Новый раздел</h2>
            <input 
              type="text" 
              value={newSectionTitle} 
              onChange={e => setNewSectionTitle(e.target.value)} 
              placeholder="Название раздела"
              className="w-full px-4 py-2 border rounded-lg mb-6" 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSectionModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Отмена</button>
              <button onClick={handleCreateSection} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90">Создать</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">Добавить урок</h2>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название урока</label>
                <input required type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип урока</label>
                <select value={lessonType} onChange={e => setLessonType(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                  <option value="VIDEO">Видео</option>
                  <option value="PRESENTATION">Презентация</option>
                  <option value="DOCUMENT">Документ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Файл (до 500 МБ)</label>
                <input 
                  type="file" 
                  onChange={e => setLessonFile(e.target.files?.[0] || null)} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
                <textarea rows={2} value={lessonDescription} onChange={e => setLessonDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowLessonModal(false)} disabled={isUploading} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">Отмена</button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 disabled:opacity-50">
                  {isUploading ? 'Загрузка...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
