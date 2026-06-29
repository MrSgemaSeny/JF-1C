import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseDto, LessonDto, getCourseById } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/shared/api/http';

export function LearnerLessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      getCourseById(Number(courseId)).then(data => {
        setCourse(data);
        const foundLesson = data.sections.flatMap(s => s.lessons).find(l => l.id === Number(lessonId));
        if (foundLesson) setLesson(foundLesson);
      }).catch(console.error);
    }
  }, [courseId, lessonId]);

  if (!lesson) return <div className="p-6">Загрузка...</div>;

  const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/courses/lessons/${lesson.id}/file`;
  const token = localStorage.getItem('access_token');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate(ROUTES.LEARNER_COURSE_DETAILS.replace(':id', courseId!))}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Назад к курсу
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
          <p className="text-gray-600 mt-2">{lesson.description}</p>
        </div>

        <div className="p-6 bg-gray-50 flex justify-center items-center min-h-[400px]">
          {lesson.type === 'VIDEO' ? (
            <video 
              controls 
              className="w-full max-w-4xl rounded-lg shadow-md"
              src={fileUrl} // Note: Depending on auth, might need a custom player that sends Bearer token, or rely on cookies. For MVP, standard src if public or we pass token in URL.
              // A better approach for protected video is appending ?access_token=token if backend supports it.
            >
              Ваш браузер не поддерживает видео.
            </video>
          ) : lesson.type === 'PRESENTATION' || lesson.type === 'DOCUMENT' ? (
             <div className="text-center">
               <p className="mb-4 text-gray-600">Это документ. Вы можете скачать его для просмотра.</p>
               <a 
                 href={fileUrl} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="bg-brand-green text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-green/90 transition-colors"
               >
                 Скачать материал
               </a>
             </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
