import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { BookOpen, Users, ArrowRight } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
}

interface StudentProgress {
  id: number;
  userFullName: string;
  userEmail: string;
  courseTitle: string;
  progressPercent: number;
}

export function CuratorOverviewPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, studentsRes] = await Promise.all([
          apiRequest<Course[]>('/api/curator/courses'),
          apiRequest<StudentProgress[]>('/api/curator/students')
        ]);
        setCourses(coursesRes || []);
        setStudents(studentsRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Кабинет Куратора</h1>
        <p className="text-sm text-gray-500 mt-1">Управление закрепленными курсами и отслеживание успеваемости студентов</p>
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Закреплено курсов</p>
            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Активных студентов</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Мои курсы</h2>
          <Link to={ROUTES.CURATOR_COURSES} className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1">
            Все курсы <ArrowRight size={14} />
          </Link>
        </div>
        
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">За вами пока не закреплены курсы</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div key={course.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-sm">{course.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                    {course.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{course.description || 'Без описания'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
