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
import { ArrowLeft, Settings, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CourseSettingsTab } from './components/CourseSettingsTab';
import { CourseCurriculumTab } from './components/CourseCurriculumTab';
import { LessonEditorDrawer } from './components/LessonEditorDrawer';

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
  const [activeTab, setActiveTab] = useState<'settings' | 'curriculum'>('settings');
  const [editingLesson, setEditingLesson] = useState<LessonDto | null>(null);
  const [showPublishAlert, setShowPublishAlert] = useState(false);

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

  const handlePublishToggleClick = () => {
    if (!isPublished) {
      setShowPublishAlert(true); // User wants to publish, show alert
    } else {
      setIsPublished(false); // Immediate unpublish is fine, or we could alert too
    }
  };

  const confirmPublish = () => {
    setIsPublished(true);
    setShowPublishAlert(false);
  };

  return (
    <div className="p-6 w-full max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(ROUTES.ADMIN_COURSES)}
        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('adminCourseEdit.backToList')}
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? title || 'Редактирование курса' : 'Создание нового курса'}
        </h1>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'settings' 
              ? 'border-brand-green text-brand-green' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" /> Настройки курса
        </button>
        {isEditMode && (
          <button 
            onClick={() => setActiveTab('curriculum')}
            className={`pb-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'curriculum' 
                ? 'border-brand-green text-brand-green' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" /> Программа (Уроки)
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'settings' && (
          <CourseSettingsTab 
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            isPublished={isPublished}
            onPublishToggle={handlePublishToggleClick}
            onSave={handleSaveCourse}
          />
        )}
        
        {activeTab === 'curriculum' && course && (
          <CourseCurriculumTab 
            course={course} 
            onEditLesson={setEditingLesson}
            onReload={loadCourse}
          />
        )}
      </div>

      {/* Publish Alert Dialog */}
      {showPublishAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Опубликовать курс?</h3>
            <p className="text-gray-600 mb-6">
              Курс станет виден всем студентам платформы. Вы уверены, что хотите продолжить?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowPublishAlert(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button 
                onClick={confirmPublish}
                className="px-4 py-2 bg-brand-green text-white font-medium hover:bg-brand-green/90 rounded-lg transition-colors"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Drawer */}
      <LessonEditorDrawer 
        lesson={editingLesson} 
        onClose={() => setEditingLesson(null)} 
        onSaved={() => {
          setEditingLesson(null);
          loadCourse();
        }}
      />
    </div>
  );
}
