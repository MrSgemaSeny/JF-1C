import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseDto, getAdminCourses } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { Plus, Edit2 } from 'lucide-react';

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAdminCourses().then(setCourses).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление курсами</h1>
        <button 
          onClick={() => navigate(ROUTES.ADMIN_COURSES_NEW)}
          className="bg-brand-green text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-green/90 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Создать курс
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">ID</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Название</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Статус</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {courses.map(course => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500">{course.id}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{course.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {course.isPublished ? 'Опубликован' : 'Черновик'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => navigate(ROUTES.ADMIN_COURSES_EDIT.replace(':id', String(course.id)))}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Курсов пока нет. Создайте первый курс!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
