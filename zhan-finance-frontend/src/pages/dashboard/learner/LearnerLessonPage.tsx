import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CourseDto, LessonDto, getCourseById } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { ArrowLeft, FileText } from 'lucide-react';

export function LearnerLessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId && lessonId) {
      getCourseById(Number(courseId)).then(data => {
        setCourse(data);
        const foundLesson = data.lessons.find(l => l.id === Number(lessonId));
        if (foundLesson) {
          setLesson(foundLesson);
        }
      }).catch(console.error);
    }
  }, [courseId, lessonId]);

  if (!lesson) return <div className="p-6 flex justify-center mt-20 text-gray-500">Загрузка урока...</div>;

  const fileUrl = lesson.fileName ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/courses/lessons/${lesson.id}/file` : null;

  return (
    <div className="p-6 max-w-4xl mx-auto pb-32">
      <button 
        onClick={() => navigate(ROUTES.LEARNER_COURSE_DETAILS.replace(':id', courseId!))}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Вернуться к курсу
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">{lesson.title}</h1>
        </div>

        <div className="p-10 space-y-12">
          {lesson.content ? (
             <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap font-serif">
                {lesson.content}
             </div>
          ) : null}

          {fileUrl && (
            <div className="pt-8 border-t border-gray-100">
                {lesson.type === 'VIDEO' ? (
                    <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
                        <video 
                            src={fileUrl} 
                            controls 
                            controlsList="nodownload"
                            className="w-full aspect-video object-contain"
                        />
                    </div>
                ) : (
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-6 bg-brand-beige rounded-xl border border-brand-green/20 hover:border-brand-green/40 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <FileText className="w-6 h-6 text-brand-green" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-brand-green transition-colors">
                                    Материал к уроку
                                </h3>
                                <p className="text-gray-500 text-sm">{lesson.fileName}</p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-brand-green shadow-sm border border-gray-100">
                            Открыть
                        </span>
                    </a>
                )}
            </div>
          )}

          {!lesson.content && !fileUrl && (
            <div className="text-gray-400 flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-xl font-medium text-gray-500">Урок пока пуст</p>
              <p className="text-sm mt-2">Автор еще не добавил содержимое</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
