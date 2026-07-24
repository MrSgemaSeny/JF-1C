import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CourseDto, 
  LessonDto,
  createCourse, 
  updateCourse, 
  getAdminCourseById 
} from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { ArrowLeft, Save, Globe, EyeOff, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CourseCurriculumTab } from './components/CourseCurriculumTab';

export function AdminCourseEditPage() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // Core course state
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  
  // UI state
  const [showPublishAlert, setShowPublishAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadCourse = () => {
    if (isEditMode && id) {
      getAdminCourseById(Number(id)).then(data => {
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublished(data.status === 'PUBLISHED');
      }).catch(console.error);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [isEditMode, id]);

  const handleSaveCourse = async () => {
    setIsSaving(true);
    try {
      if (isEditMode) {
        const updated = await updateCourse(Number(id), title, description, isPublished);
        setCourse(updated);
        alert(t('adminCourseEdit.courseUpdated', { defaultValue: 'Курс успешно сохранен' }));
      } else {
        const created = await createCourse(title, description, isPublished);
        navigate(ROUTES.ADMIN_COURSES_EDIT.replace(':id', String(created.id)));
      }
    } catch (e) {
      console.error(e);
      alert(t('adminCourseEdit.courseSaveError', { defaultValue: 'Ошибка при сохранении курса' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggleClick = () => {
    if (!isPublished) {
      setShowPublishAlert(true);
    } else {
      setIsPublished(false);
    }
  };

  const confirmPublish = () => {
    setIsPublished(true);
    setShowPublishAlert(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(ROUTES.ADMIN_COURSES)}
            className="flex items-center text-sm text-gray-500 hover:text-brand-green transition-colors font-medium mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('adminCourseEdit.backToList', { defaultValue: 'Назад к списку курсов' })}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isEditMode ? title || 'Редактирование курса' : 'Создание нового курса'}
            </h1>
            {isEditMode && (
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                isPublished 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isPublished ? 'Опубликован' : 'Черновик'}
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={handleSaveCourse}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-green text-white font-semibold text-sm rounded-xl hover:bg-brand-green/90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Сохранение...' : t('adminCourseEdit.save', { defaultValue: 'Сохранить изменения' })}
        </button>
      </div>

      {/* Section 1: Unified Course Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-green" />
            <h2 className="text-lg font-bold text-gray-900">Основная информация</h2>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200/60">
            <span className="text-xs font-semibold text-gray-600">
              {isPublished ? 'Доступен всем' : 'Приватный черновик'}
            </span>
            <button
              onClick={handlePublishToggleClick}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPublished ? 'bg-brand-green' : 'bg-gray-300'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublished ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('adminCourseEdit.courseNameLabel', { defaultValue: 'Название курса' })}
            </label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all font-medium text-gray-900"
              placeholder={t('adminCourseEdit.courseNamePlaceholder', { defaultValue: 'Введите название курса (например, 1С:Бухгалтерия 8.3)' })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t('adminCourseEdit.descriptionLabel', { defaultValue: 'Описание курса' })}
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all text-gray-800 leading-relaxed"
              placeholder={t('adminCourseEdit.descriptionPlaceholder', { defaultValue: 'Подробное описание программы курса и результатов обучения...' })}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Unified Curriculum (Chapters & Lessons) */}
      {isEditMode && course && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <CourseCurriculumTab 
            course={course} 
            onEditLesson={(lesson) => navigate(ROUTES.ADMIN_LESSON_EDIT.replace(':courseId', String(course.id)).replace(':lessonId', String(lesson.id)))}
            onReload={loadCourse}
          />
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishAlert && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Опубликовать курс?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Курс станет доступен студентам на платформе. Вы можете скрыть его обратно в любое время.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowPublishAlert(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmPublish}
                className="px-4 py-2 text-sm font-semibold bg-brand-green text-white hover:bg-brand-green/90 rounded-xl shadow-sm transition-all"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
