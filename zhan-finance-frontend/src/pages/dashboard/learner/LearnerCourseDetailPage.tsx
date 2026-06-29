import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, FileText, Monitor, ChevronRight, BookOpen } from 'lucide-react';
import { CourseDto, LessonDto, getCourseById } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { Spinner } from '@/shared/ui/Spinner';

// ─── helpers ────────────────────────────────────────────────────────────────

const LESSON_TYPE_CONFIG: Record<
  LessonDto['type'],
  { label: string; icon: React.ReactNode; iconBg: string; iconColor: string }
> = {
  VIDEO: {
    label: 'Видеоурок',
    icon: <Video size={16} />,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  PRESENTATION: {
    label: 'Презентация',
    icon: <Monitor size={16} />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  DOCUMENT: {
    label: 'Документ',
    icon: <FileText size={16} />,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
};

// ─── sub-components ──────────────────────────────────────────────────────────

interface SectionCardProps {
  sectionIndex: number;
  title: string;
  lessons: LessonDto[];
  courseId: string;
  onNavigate: (lessonId: number) => void;
}

function SectionCard({ sectionIndex, title, lessons, onNavigate }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center shrink-0">
            {sectionIndex}
          </span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <span className="text-xs text-gray-400">
          {lessons.length} {lessons.length === 1 ? 'урок' : 'урока'}
        </span>
      </div>

      {/* Lessons */}
      {lessons.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-400">Уроки ещё не добавлены</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {lessons.map((lesson) => {
            const cfg = LESSON_TYPE_CONFIG[lesson.type];
            return (
              <li key={lesson.id}>
                <button
                  onClick={() => onNavigate(lesson.id)}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                >
                  {/* Type icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg} ${cfg.iconColor}`}
                  >
                    {cfg.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export function LearnerCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getCourseById(Number(id))
      .then(setCourse)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleLessonClick = (lessonId: number) => {
    navigate(
      ROUTES.LEARNER_LESSON
        .replace(':courseId', id!)
        .replace(':lessonId', String(lessonId))
    );
  };

  // ── loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" className="text-brand-green" />
      </div>
    );
  }

  // ── error ────────────────────────────────────────────────────────────────
  if (error || !course) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(ROUTES.LEARNER_COURSES)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Все курсы
        </button>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500 text-sm">
          Не удалось загрузить курс. Попробуйте обновить страницу.
        </div>
      </div>
    );
  }

  const totalLessons = course.lessons.length;

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate(ROUTES.LEARNER_COURSES)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={14} />
        Все курсы
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        {course.description && (
          <p className="text-sm text-gray-500 mt-1">{course.description}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Уроков</p>
          <p className="text-3xl font-bold text-gray-900">{totalLessons}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Разделов</p>
          <p className="text-3xl font-bold text-gray-900">{course.sections?.length ?? 1}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hidden sm:block">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Статус</p>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Доступен
          </span>
        </div>
      </div>

      {/* Sections with lessons */}
      {course.sections && course.sections.length > 0 ? (
        <div className="space-y-4">
          {course.sections.map((section, idx) => (
            <SectionCard
              key={section.id}
              sectionIndex={idx + 1}
              title={section.title}
              lessons={section.lessons ?? []}
              courseId={id!}
              onNavigate={handleLessonClick}
            />
          ))}
        </div>
      ) : (
        /* Fallback: курс без sections — плоский список уроков */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} className="text-brand-green" />
              <span className="text-sm font-semibold text-gray-700">Программа курса</span>
            </div>
            <span className="text-xs text-gray-400">{totalLessons} уроков</span>
          </div>

          {totalLessons === 0 ? (
            <div className="px-5 py-12 text-center">
              <BookOpen size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">Уроки пока не добавлены</p>
              <p className="text-xs text-gray-400">Автор курса ещё работает над материалами</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {course.lessons.map((lesson) => {
                const cfg = LESSON_TYPE_CONFIG[lesson.type];
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => handleLessonClick(lesson.id)}
                      className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg} ${cfg.iconColor}`}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}