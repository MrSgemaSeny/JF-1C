import { apiRequest } from '@/shared/api/http';

export interface LessonBlockDto {
  id: number;
  lessonId: number;
  type: 'VIDEO' | 'TEXT' | 'FILE';
  orderIndex: number;
  content: string;
}

export interface LessonDto {
  id: number;
  chapterId: number;
  title: string;
  description: string;
  type: 'VIDEO' | 'PRESENTATION' | 'DOCUMENT';
  orderIndex: number;
  durationMinutes: number;
  isPreview: boolean;
  blocks: LessonBlockDto[];
}

export interface ChapterDto {
  id: number;
  courseId: number;
  title: string;
  orderIndex: number;
  lessons: LessonDto[];
}

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdById: number;
  createdAt: string;
  chapters: ChapterDto[];
}

// Learner API
export async function getPublishedCourses(): Promise<CourseDto[]> {
  return await apiRequest<CourseDto[]>('/api/courses');
}

export async function getCourseById(id: number): Promise<CourseDto> {
  return await apiRequest<CourseDto>(`/api/courses/${id}`);
}

// Admin API
export async function getAdminCourses(): Promise<CourseDto[]> {
  return await apiRequest<CourseDto[]>('/api/admin/courses');
}

export async function getAdminCourseById(id: number): Promise<CourseDto> {
  return await apiRequest<CourseDto>(`/api/admin/courses/${id}`);
}

export async function createCourse(title: string, description: string, isPublished: boolean): Promise<CourseDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('isPublished', String(isPublished));

  return await apiRequest<CourseDto>('/api/admin/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function updateCourse(id: number, title: string, description: string, isPublished: boolean): Promise<CourseDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('isPublished', String(isPublished));

  return await apiRequest<CourseDto>(`/api/admin/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function createLesson(
  courseId: number, 
  title: string, 
  description: string, 
  type: string, 
  file?: File
): Promise<LessonDto> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('type', type);
  if (file) {
    formData.append('file', file);
  }

  return await apiRequest<LessonDto>(`/api/admin/courses/${courseId}/lessons`, {
    method: 'POST',
    body: formData // Note: Content-Type is intentionally omitted for FormData
  });
}

export async function deleteLesson(lessonId: number): Promise<void> {
  await apiRequest(`/api/admin/courses/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}

export async function updateLesson(
  lessonId: number,
  title?: string,
  description?: string,
  content?: string,
  orderIndex?: number,
  file?: File
): Promise<LessonDto> {
  const formData = new FormData();
  if (title !== undefined) formData.append('title', title);
  if (description !== undefined) formData.append('description', description);
  if (content !== undefined) formData.append('content', content);
  if (orderIndex !== undefined) formData.append('orderIndex', String(orderIndex));
  if (file !== undefined) formData.append('file', file);

  return await apiRequest<LessonDto>(`/api/admin/courses/lessons/${lessonId}`, {
    method: 'PUT',
    body: formData
  });
}

export async function createChapter(
  courseId: number,
  title: string,
  orderIndex: number = 0
): Promise<ChapterDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  formData.append('orderIndex', String(orderIndex));

  return await apiRequest<ChapterDto>(`/api/admin/courses/${courseId}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function createLessonForChapter(
  chapterId: number,
  title: string,
  description: string,
  type: string,
  orderIndex: number = 0
): Promise<LessonDto> {
  const formData = new URLSearchParams();
  formData.append('title', title);
  if (description) formData.append('description', description);
  formData.append('type', type);
  formData.append('orderIndex', String(orderIndex));

  return await apiRequest<LessonDto>(`/api/admin/courses/chapters/${chapterId}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function addTextBlock(
  lessonId: number,
  content: string
): Promise<LessonBlockDto> {
  const formData = new URLSearchParams();
  formData.append('type', 'TEXT');
  formData.append('content', content);

  return await apiRequest<LessonBlockDto>(`/api/admin/courses/lessons/${lessonId}/blocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });
}

export async function addMediaBlock(
  lessonId: number,
  type: 'VIDEO' | 'FILE',
  file: File
): Promise<LessonBlockDto> {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  return await apiRequest<LessonBlockDto>(`/api/admin/courses/lessons/${lessonId}/blocks`, {
    method: 'POST',
    body: formData
  });
}

export async function uploadMedia(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return await apiRequest<{ url: string }>('/api/admin/media/upload', {
    method: 'POST',
    body: formData
  });
}
