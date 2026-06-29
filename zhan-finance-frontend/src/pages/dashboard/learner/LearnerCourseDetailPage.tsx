import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseDto, getCourseById } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { Video, FileText, File, ArrowLeft } from 'lucide-react';

export function LearnerCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getCourseById(Number(id)).then(setCourse).catch(console.error);
    }
  }, [id]);

  if (!course) return <div className="p-6">Загрузка...</div>;

  const getIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="w-5 h-5 text-indigo-500" />;
      case 'PRESENTATION': return <File className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(ROUTES.LEARNER_COURSES)}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад к списку
      </button>

      <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
      <p className="text-gray-600 mb-8">{course.description}</p>

      <div className="space-y-6">
        {course.sections.map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-lg">{section.title}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {section.lessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(ROUTES.LEARNER_LESSON.replace(':courseId', id!).replace(':lessonId', String(lesson.id)))}
                >
                  <div className="flex items-center gap-3">
                    {getIcon(lesson.type)}
                    <div>
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      <p className="text-sm text-gray-500">{lesson.type === 'VIDEO' ? 'Видео-урок' : 'Материал'}</p>
                    </div>
                  </div>
                  <div className="text-brand-green text-sm">Открыть</div>
                </div>
              ))}
              {section.lessons.length === 0 && (
                <div className="px-6 py-4 text-gray-400 text-sm text-center">Нет уроков в этом разделе</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
