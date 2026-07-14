import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseDto, LessonDto, getCourseById, getCourseProgress, completeLesson, CourseProgressDto } from '@/entities/course/api/courseApi';
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
  const [progress, setProgress] = useState<CourseProgressDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    setIsLoading(true);
    Promise.all([
      getCourseById(Number(courseId)),
      getCourseProgress(Number(courseId))
    ])
      .then(([courseData, progressData]) => {
        setCourse(courseData);
        setProgress(progressData);
        const found = courseData.chapters.flatMap((c) => c.lessons).find((l) => l.id === Number(lessonId));
        if (found) setLesson(found);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [courseId, lessonId]);

  const handleComplete = async () => {
    if (!courseId || !lessonId || !progress) return;
    try {
      setIsCompleting(true);
      await completeLesson(Number(courseId), Number(lessonId));
      const updatedProgress = await getCourseProgress(Number(courseId));
      setProgress(updatedProgress);
      // Automatically go to next lesson if available
      if (nextLesson) {
        goToLesson(nextLesson.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

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
      <div className="bg-white rounded-xl border border-brand-green/10 shadow-sm p-8 text-center text-sm text-brand-green/70">
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
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-green/10 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-green/5 hover:text-brand-green transition-all shadow-sm active:scale-95 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('learnerLesson.backToCourse')}
      </button>

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-brand-green/50 uppercase tracking-wide mb-1">
          {t('learnerLesson.lessonLabel')} {currentIndex + 1} {t('learnerLesson.of')} {allLessons.length}
        </p>
        <h1 className="text-2xl font-bold text-brand-green">{lesson.title}</h1>
      </div>

      {/* Content Blocks */}
      <div className="space-y-6">
        {lesson.mediaUrl && (
          <div className="bg-brand-accent rounded-xl overflow-hidden border border-brand-green/10 shadow-sm flex justify-center">
            <video
              src={lesson.mediaUrl.startsWith('http') ? lesson.mediaUrl : `${API_BASE}${lesson.mediaUrl.startsWith('/') ? '' : '/'}${lesson.mediaUrl}`}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="w-full max-h-[60vh] object-contain mx-auto"
            />
          </div>
        )}

        {lesson.content && (
          <div className="bg-white rounded-xl border border-brand-green/10 shadow-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {lesson.content}
              </div>
            </div>
          </div>
        )}

        {!lesson.content && !lesson.mediaUrl && !lesson.fileUrl && (
          <div className="bg-white rounded-xl border border-brand-green/10 shadow-sm px-6 py-10 text-center text-sm text-brand-green/50">
            {t('learnerLesson.noContent')}
          </div>
        )}

        {lesson.fileUrl && (
          <div className="bg-white rounded-xl border border-brand-green/10 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-800 font-semibold text-sm">Дополнительный материал</span>
                  <span className="text-brand-green/70 text-xs">Прикрепленный документ</span>
                </div>
              </div>
              <a
                href={lesson.fileUrl.startsWith('http') ? lesson.fileUrl : `${API_BASE}${lesson.fileUrl.startsWith('/') ? '' : '/'}${lesson.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="bg-brand-green/10 text-brand-green px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-green/20 transition-all active:scale-95 border border-brand-green/10"
              >
                Скачать / Открыть
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Complete Button */}
      <div className="flex justify-center mt-12">
        <button
          onClick={handleComplete}
          disabled={isCompleting || (progress?.completedLessonIds.includes(lesson.id))}
          className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium text-lg transition-all shadow-md active:scale-95 w-full max-w-md ${
            progress?.completedLessonIds.includes(lesson.id)
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
              : 'bg-brand-green text-brand-beige hover:bg-brand-green/90 border border-transparent'
          }`}
        >
          {isCompleting ? (
            <Spinner size="sm" className="text-current" />
          ) : progress?.completedLessonIds.includes(lesson.id) ? (
            'Пройдено ✅'
          ) : (
            'Завершить урок и перейти к следующему'
          )}
        </button>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center justify-center gap-4 mt-8 pb-12">
        <button
          onClick={() => prevLesson && goToLesson(prevLesson.id)}
          disabled={!prevLesson}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-brand-green/10 rounded-xl font-medium text-brand-green hover:bg-brand-green/5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('learnerLesson.previous')}
        </button>

        <button
          onClick={() => nextLesson && goToLesson(nextLesson.id)}
          disabled={!nextLesson || !(progress?.completedLessonIds.includes(lesson.id))}
          title={!(progress?.completedLessonIds.includes(lesson.id)) ? "Сначала завершите текущий урок" : undefined}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-brand-green/10 rounded-xl font-medium text-brand-green hover:bg-brand-green/5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('learnerLesson.next')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}