import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, File, Film } from 'lucide-react';
import { CourseDto, LessonDto, getAdminCourseById, updateLesson } from '@/entities/course/api/courseApi';
import { ROUTES } from '@/shared/config/routes';

export function AdminLessonEditPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (courseId && lessonId) {
      getAdminCourseById(Number(courseId))
        .then((data) => {
          setCourse(data);
          const found = data.lessons.find(l => l.id === Number(lessonId));
          if (found) {
            setLesson(found);
            setTitle(found.title);
            if (found.content) {
              setContent(found.content);
            }
          }
          setIsLoading(false);
        })
        .catch(console.error);
    }
  }, [courseId, lessonId]);

  const handleSave = async () => {
    if (!lesson) return;
    setIsSaving(true);
    try {
      await updateLesson(lesson.id, title, undefined, content, undefined, file || undefined);
      alert('Урок успешно сохранен!');
      // Refresh lesson data to show new file
      const updatedCourse = await getAdminCourseById(Number(courseId));
      const updatedLesson = updatedCourse.lessons.find(l => l.id === Number(lessonId));
      if (updatedLesson) setLesson(updatedLesson);
      setFile(null); // Clear selected file after successful save
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении урока.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (isLoading) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(ROUTES.ADMIN_COURSES_EDIT.replace(':id', courseId!))}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад к курсу
        </button>

        <div className="flex-1 max-w-2xl mx-8">
            <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-2xl font-bold bg-transparent outline-none w-full border-b border-transparent focus:border-gray-300 transition-colors text-center"
                placeholder="Название урока"
            />
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-green text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-green/90 flex items-center gap-2 transition-colors shrink-0 disabled:opacity-50 shadow-md"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8 pb-20">
            
            {/* Текстовая секция */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <label className="text-gray-500 text-sm font-medium mb-3 uppercase tracking-wider">Основной текст урока</label>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Напишите здесь содержимое урока..."
                    className="w-full min-h-[400px] text-lg text-gray-800 outline-none resize-y placeholder-gray-300"
                />
            </div>

            {/* Секция загрузки медиа */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <label className="text-gray-500 text-sm font-medium mb-3 uppercase tracking-wider block">Файл / Видео урока</label>
                
                {lesson?.fileName && !file && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
                        {lesson.type === 'VIDEO' ? <Film className="w-8 h-8 text-blue-500" /> : <File className="w-8 h-8 text-gray-500" />}
                        <div>
                            <p className="font-medium text-gray-900">Текущий файл: {lesson.fileName}</p>
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/courses/lessons/${lesson.id}/file`} target="_blank" rel="noreferrer" className="text-sm text-brand-green hover:underline">
                                Скачать / Открыть
                            </a>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="text-gray-900 font-medium text-lg">
                        {file ? file.name : 'Нажмите, чтобы загрузить видео или файл'}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        {file ? `Размер: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Это заменит текущий файл, если он есть'}
                    </p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
