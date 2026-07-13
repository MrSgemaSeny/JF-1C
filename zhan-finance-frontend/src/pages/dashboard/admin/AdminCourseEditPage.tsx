import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CourseDto, 
  createCourse, 
  updateCourse, 
  getAdminCourseById,
  createLesson,
  deleteLesson
} from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { ArrowLeft, Save, Plus, Trash2, Video, FileText, File } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AdminCourseEditPage() {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Modal states for Lesson
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      getAdminCourseById(Number(id)).then(data => {
        setCourse(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setIsPublished(data.status === 'PUBLISHED');
      }).catch(console.error);
    }
  }, [isEditMode, id]);

  const handleSaveCourse = async () => {
    try {
      if (isEditMode) {
        const updated = await updateCourse(Number(id), title, description, isPublished);
        setCourse(updated);
        alert(t('adminCourseEdit.courseUpdated'));
      } else {
        const created = await createCourse(title, description, isPublished);
        navigate(ROUTES.ADMIN_COURSES_EDIT.replace(':id', String(created.id)));
      }
    } catch (e) {
      console.error(e);
      alert(t('adminCourseEdit.courseSaveError'));
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    
    setIsUploading(true);
    try {
      await createLesson(course.id, lessonTitle, '', 'DOCUMENT');
      // reload course
      const updated = await getAdminCourseById(course.id);
      setCourse(updated);
      
      setShowLessonModal(false);
      setLessonTitle('');
    } catch (err) {
      console.error(err);
      alert(t('adminCourseEdit.lessonCreateError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!course || !window.confirm(t('adminCourseEdit.lessonDeleteConfirm'))) return;
    try {
      await deleteLesson(lessonId);
      const updated = await getAdminCourseById(course.id);
      setCourse(updated);
    } catch (e) {
      alert(t('adminCourseEdit.lessonDeleteError'));
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
    <div className="p-6 w-full max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(ROUTES.ADMIN_COURSES)}
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('adminCourseEdit.backToList')}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">{isEditMode ? t('adminCourseEdit.editTitle') : t('adminCourseEdit.createTitle')}</h1>
          <button 
            onClick={handleSaveCourse}
            className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 flex items-center gap-2 transition-colors shrink-0"
          >
            <Save className="w-5 h-5" />
            {t('adminCourseEdit.save')}
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminCourseEdit.courseNameLabel')}</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
              placeholder={t('adminCourseEdit.courseNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminCourseEdit.descriptionLabel')}</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
              placeholder={t('adminCourseEdit.descriptionPlaceholder')}
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
              {t('adminCourseEdit.publishLabel')}
            </label>
          </div>
        </div>
      </div>

      {isEditMode && course && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('adminCourseEdit.lessonsTitle')}</h2>
            <button 
              onClick={() => setShowLessonModal(true)}
              className="text-brand-green hover:bg-brand-green/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> {t('adminCourseEdit.addLessonBtn')}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {course.chapters.flatMap(c => c.lessons).map(lesson => (
                <div key={lesson.id} className="px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {getIcon(lesson.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{lesson.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t('adminCourseEdit.textLesson')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(ROUTES.ADMIN_LESSON_EDIT.replace(':courseId', String(course.id)).replace(':lessonId', String(lesson.id)))}
                      className="text-brand-green hover:bg-brand-green/10 px-4 py-2 rounded-lg text-sm transition-colors font-medium"
                    >
                      {t('adminCourseEdit.editLesson')}
                    </button>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title={t('adminCourseEdit.deleteLessonTitle')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {course.chapters.flatMap(c => c.lessons).length === 0 && (
                <div className="px-4 py-8 text-sm text-center text-gray-400 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-gray-300" />
                  </div>
                  {t('adminCourseEdit.noLessons')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900">{t('adminCourseEdit.newLessonTitle')}</h2>
            <form onSubmit={handleCreateLesson} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('adminCourseEdit.lessonNameLabel')}</label>
                <input 
                  required 
                  type="text" 
                  value={lessonTitle} 
                  onChange={e => setLessonTitle(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all" 
                  placeholder={t('adminCourseEdit.lessonNamePlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowLessonModal(false)} 
                  disabled={isUploading} 
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {t('adminCourseEdit.cancel')}
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading || !lessonTitle.trim()} 
                  className="px-5 py-2.5 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? t('adminCourseEdit.creating') : t('adminCourseEdit.createLesson')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
