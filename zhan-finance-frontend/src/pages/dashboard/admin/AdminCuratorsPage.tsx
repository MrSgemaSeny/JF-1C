import { useState, useEffect } from 'react';
import { apiRequest } from '@/shared/api/http';
import { UserCheck, UserX, Plus, BookOpen, ShieldAlert, CheckCircle, MoreVertical } from 'lucide-react';
import { Spinner } from '@/shared/ui/Spinner';
import { toast } from '@/shared/ui/Toast/ToastContext';

interface Curator {
  id: number;
  fullName: string;
  email: string;
  enabled: boolean;
  assignedCourseIds: number[];
}

interface CourseItem {
  id: number;
  title: string;
}

export function AdminCuratorsPage() {
  const [curators, setCurators] = useState<Curator[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Assign Modal
  const [selectedCurator, setSelectedCurator] = useState<Curator | null>(null);

  // Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [curatorsRes, coursesRes] = await Promise.all([
        apiRequest<Curator[]>('/api/admin/curators'),
        apiRequest<CourseItem[]>('/api/admin/courses')
      ]);
      setCurators(curatorsRes || []);
      setCourses(coursesRes || []);
    } catch (err) {
      toast.error('Failed to load curators or courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCurator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    try {
      setSubmitting(true);
      await apiRequest('/api/admin/curators', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password })
      });
      toast.success('Curator created successfully');
      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create curator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await apiRequest(`/api/admin/curators/${id}/toggle-status`, { method: 'POST' });
      toast.success('Curator status updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleCourseAssign = async (curatorId: number, courseId: number, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await apiRequest(`/api/admin/curators/${curatorId}/courses/${courseId}`, { method: 'DELETE' });
      } else {
        await apiRequest(`/api/admin/curators/${curatorId}/courses/${courseId}`, { method: 'POST' });
      }
      toast.success('Course assignment updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update assignment');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Кураторы обучения</h1>
          <p className="text-sm text-gray-500 mt-1">Управление аккаунтами кураторов и привязкой к курсам</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white font-medium rounded-xl hover:bg-green-800 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Добавить куратора</span>
        </button>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {curators.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-gray-100 text-center text-gray-500">
            Кураторы пока не добавлены
          </div>
        ) : (
          curators.map((c) => (
            <div key={c.id} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md">
              <div>
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <h3 className="font-bold text-xl text-gray-900 mb-1 leading-tight">{c.fullName}</h3>
                    <p className="text-sm text-gray-500">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {c.enabled ? 'Активен' : 'Заблокирован'}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === c.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-20 py-1">
                            <button
                              onClick={() => {
                                handleToggleStatus(c.id);
                                setOpenMenuId(null);
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors text-left ${
                                c.enabled ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {c.enabled ? <UserX size={15} /> : <UserCheck size={15} />}
                              <span>{c.enabled ? 'Заблокировать доступ' : 'Разблокировать'}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-5 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-2">
                    <BookOpen size={16} className="text-brand-green" />
                    <span>Назначено курсов: <span className="text-gray-900">{c.assignedCourseIds.length}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setSelectedCurator(c)}
                  className="w-full py-3 bg-gray-50 hover:bg-brand-green/10 hover:text-brand-green text-gray-700 text-sm font-bold rounded-xl transition-all"
                >
                  Управление курсами
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900">Новый куратор</h2>
            <form onSubmit={handleCreateCurator} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ФИО</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                  placeholder="curator@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Начальный пароль</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-green"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-brand-green text-white rounded-xl text-sm font-semibold hover:bg-green-800 disabled:opacity-50"
                >
                  {submitting ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Courses Assign Modal */}
      {selectedCurator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Назначенные курсы: {selectedCurator.fullName}</h2>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <p className="text-sm text-gray-500">Курсы в системе отсутствуют</p>
              ) : (
                courses.map((course) => {
                  const isAssigned = selectedCurator.assignedCourseIds.includes(course.id);
                  return (
                    <div key={course.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <span className="text-sm font-medium text-gray-800">{course.title}</span>
                      <button
                        onClick={async () => {
                          await handleToggleCourseAssign(selectedCurator.id, course.id, isAssigned);
                          setSelectedCurator(prev => prev ? {
                            ...prev,
                            assignedCourseIds: isAssigned
                              ? prev.assignedCourseIds.filter(id => id !== course.id)
                              : [...prev.assignedCourseIds, course.id]
                          } : null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isAssigned ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                        }`}
                      >
                        {isAssigned ? 'Отвязать' : 'Привязать'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSelectedCurator(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
