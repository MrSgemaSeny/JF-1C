import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { BookOpen } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  thumbnail?: string;
}

export function CuratorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<Course[]>('/api/curator/courses');
        setCourses(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Закрепленные курсы</h1>
        <p className="text-sm text-gray-500 mt-1">Список учебных программ, куратором которых вы являетесь</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-gray-100 text-center text-gray-500">
            За вами пока не закреплен ни один курс
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {course.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 leading-snug">{course.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3">{course.description || 'Описание не указано'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
