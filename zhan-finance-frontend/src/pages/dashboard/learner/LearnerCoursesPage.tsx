import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseDto, getPublishedCourses } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { BookOpen } from 'lucide-react';

export function LearnerCoursesPage() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getPublishedCourses().then(setCourses).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="text-brand-green" />
        Доступные курсы
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div 
            key={course.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
            onClick={() => navigate(ROUTES.LEARNER_COURSE_DETAILS.replace(':id', String(course.id)))}
          >
            <div className="h-40 bg-gray-100 flex items-center justify-center">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-grow">{course.description}</p>
              <div className="text-brand-green font-medium text-sm flex items-center">
                Перейти к курсу &rarr;
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Нет доступных курсов
          </div>
        )}
      </div>
    </div>
  );
}
