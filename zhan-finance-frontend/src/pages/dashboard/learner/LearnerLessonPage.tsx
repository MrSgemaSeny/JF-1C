import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseDto, LessonDto, getCourseById } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';
import { Spinner } from '@/shared/ui/Spinner';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getFileUrl(lessonId: number) {
  return `${API_BASE}/api/courses/lessons/${lessonId}/file`;
}

export function LearnerLessonPage() {
  const { t } = useTranslation(['common']);
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    setIsLoading(true);
    getCourseById(Number(courseId))
      .then((data) => {
        setCourse(data);
        const found = data.chapters.flatMap((c) => c.lessons).find((l) => l.id === Number(lessonId));
        if (found) setLesson(found);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [courseId, lessonId]);

  // ── loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" className="text-brand-green" />
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-sm text-gray-500">
        {t('learnerLesson.notFound')}
      </div>
    );
  }

  const allLessons = course.chapters.reduce((acc, chapter) => [...acc, ...chapter.lessons], [] as LessonDto[]);
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const goToLesson = (id: number) =>
    navigate(
      ROUTES.LEARNER_LESSON
        .replace(':courseId', courseId!)
        .replace(':lessonId', String(id))
    );

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate(ROUTES.LEARNER_COURSE_DETAILS.replace(':id', courseId!))}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={14} />
        {t('learnerLesson.backToCourse')}
      </button>

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
          {t('learnerLesson.lessonLabel')} {currentIndex + 1} {t('learnerLesson.of')} {allLessons.length}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
      </div>

      {/* Content Blocks */}
      <div className="space-y-6">
        {lesson.mediaUrl && (
          <div className="bg-black rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <video
              src={lesson.mediaUrl.startsWith('http') ? lesson.mediaUrl : `${API_BASE}${lesson.mediaUrl.startsWith('/') ? '' : '/'}${lesson.mediaUrl}`}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="w-full aspect-video"
            />
          </div>
        )}

        {lesson.content && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {lesson.content}
              </div>
            </div>
          </div>
        )}

        {!lesson.content && !lesson.mediaUrl && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-10 text-center text-sm text-gray-400">
            {t('learnerLesson.noContent')}
          </div>
        )}
      </div>

      {/* Prev / Next */}
      <div className="grid grid-cols-2 gap-4">
        {prevLesson ? (
          <button
            onClick={() => goToLesson(prevLesson.id)}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 transition-colors">
              <ChevronLeft size={16} className="text-gray-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{t('learnerLesson.previous')}</p>
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-green transition-colors">
                {prevLesson.title}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <button
            onClick={() => goToLesson(nextLesson.id)}
            className="flex items-center justify-end gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-right group"
          >
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{t('learnerLesson.next')}</p>
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-green transition-colors">
                {nextLesson.title}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-green/5 flex items-center justify-center shrink-0 group-hover:bg-brand-green transition-colors">
              <ChevronRight size={16} className="text-brand-green group-hover:text-white transition-colors" />
            </div>
          </button>
        ) : (
          <div />
        )}
      </div>

    </div>
  );
}