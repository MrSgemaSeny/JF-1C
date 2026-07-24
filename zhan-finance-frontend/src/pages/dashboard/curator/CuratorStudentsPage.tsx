import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { Users, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';

interface StudentProgressDto {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  courseId: number;
  courseTitle: string;
  enrolledAt: string;
  completedAt?: string;
  completedLessonsCount: number;
  progressPercent: number;
}

export function CuratorStudentsPage() {
  const [students, setStudents] = useState<StudentProgressDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<StudentProgressDto[]>('/api/curator/students');
        setStudents(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Студенты и успеваемость</h1>
        <p className="text-sm text-gray-500 mt-1">Прогресс прохождения курсов вашими студентами</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {students.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            Ученики пока не записаны на ваши курсы
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Студент</th>
                  <th className="p-4">Курс</th>
                  <th className="p-4">Дата записи</th>
                  <th className="p-4">Пройдено уроков</th>
                  <th className="p-4 pr-6">Прогресс</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-gray-900">{s.userFullName}</p>
                      <p className="text-xs text-gray-500">{s.userEmail}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-800">{s.courseTitle}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-semibold text-gray-700">
                      {s.completedLessonsCount} уроков
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-brand-green h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, s.progressPercent))}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 min-w-[36px]">
                          {Math.round(s.progressPercent)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
